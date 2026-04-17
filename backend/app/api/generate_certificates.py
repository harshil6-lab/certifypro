"""Generate Certificates route

POST /api/generate-certificates  — generate PNG certificates for a list of
validated students using a Supabase template's background image and layout_config.

Expected JSON body:
    {
        "template_id": "<uuid>",
        "students": [
            {"student_name": "Alice", "email": "alice@example.com", "external_id": "CERT001"},
            ...
        ]
    }
"""

from __future__ import annotations

import io
import os
import uuid
import zipfile
from typing import Any

import httpx
import qrcode
from fastapi import APIRouter, HTTPException, Request
from PIL import Image, ImageDraw, ImageFont
from pydantic import BaseModel, Field

from app.core.supabase_client import supabase
from app.services.auth_service import get_current_user
from app.services.generated_certificate_retention_service import cleanup_expired_generated_certificate_files
from app.services.students_service import list_students

router = APIRouter(prefix="/api/generate-certificates", tags=["Generate Certificates"])

# ---------------------------------------------------------------------------
# Output directory
# ---------------------------------------------------------------------------

_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GENERATED_DIR = os.path.join(_BACKEND_ROOT, "uploads", "generated")
os.makedirs(GENERATED_DIR, exist_ok=True)

API_BASE_URL = os.getenv("API_BASE_URL", "")
QR_VERIFY_BASE = os.getenv("PUBLIC_VERIFY_BASE_URL", "/verify")

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class StudentIn(BaseModel):
    student_id: str | None = None
    student_name: str
    email: str = ""
    external_id: str


class GenerateRequest(BaseModel):
    template_id: str
    students: list[StudentIn]


class CertificateOut(BaseModel):
    certificate_id: str
    student_name: str
    url: str


class GenerateResponse(BaseModel):
    certificates: list[CertificateOut]
    zip_url: str


def _extract_user_id(user: Any) -> str | None:
    if user is None:
        return None
    if isinstance(user, dict):
        return user.get("id")
    inner = getattr(user, "user", None)
    if inner is not None:
        return getattr(inner, "id", None)
    return getattr(user, "id", None)


def _extract_user_email(user: Any) -> str | None:
    if user is None:
        return None
    if isinstance(user, dict):
        nested = user.get("user")
        if isinstance(nested, dict) and nested.get("email"):
            return nested.get("email")
        return user.get("email")
    inner = getattr(user, "user", None)
    if inner is not None:
        return getattr(inner, "email", None)
    return getattr(user, "email", None)


def _as_layout_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _to_bool(value: Any, fallback: bool) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "yes", "on"}:
            return True
        if normalized in {"false", "0", "no", "off"}:
            return False
    if isinstance(value, (int, float)):
        return value != 0
    return fallback


def _to_float(value: Any, fallback: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _normalize_layout_config(layout_config: Any) -> dict[str, Any]:
    source = _as_layout_dict(layout_config)
    student_name = _as_layout_dict(source.get("student_name"))
    qr_code = _as_layout_dict(source.get("qr_code"))
    certificate_id = _as_layout_dict(source.get("certificate_id"))

    return {
        "showStudentName": _to_bool(
            source.get("showStudentName", source.get("show_name", student_name.get("visible"))),
            True,
        ),
        "showQR": _to_bool(source.get("showQR", source.get("show_qr", qr_code.get("visible"))), True),
        "showID": _to_bool(source.get("showID", source.get("show_id", certificate_id.get("visible"))), True),
        "placeholderField": str(source.get("placeholderField") or "STUDENT_NAME").strip().upper() or "STUDENT_NAME",
        "placeholderX": _to_float(source.get("placeholderX", source.get("nameX", student_name.get("x"))), 40),
        "placeholderY": _to_float(source.get("placeholderY", source.get("nameY", student_name.get("y"))), 36),
        "qrX": _to_float(source.get("qrX", source.get("qr_x", qr_code.get("x"))), 82),
        "qrY": _to_float(source.get("qrY", source.get("qr_y", qr_code.get("y"))), 76),
        "idX": _to_float(source.get("idX", source.get("id_x", certificate_id.get("x"))), 10),
        "idY": _to_float(source.get("idY", source.get("id_y", certificate_id.get("y"))), 88),
    }


def _resolve_template_render_context(
    template_id: str,
    user_id: str | None,
) -> tuple[dict[str, Any], dict[str, Any], str | None]:
    try:
        resp = (
            supabase.table("templates")
            .select("*")
            .eq("id", template_id)
            .single()
            .execute()
        )
        template = resp.data if hasattr(resp, "data") else None
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch template: {exc}") from exc

    if not template:
        raise HTTPException(status_code=404, detail="Template not found.")

    layout_config = _normalize_layout_config(template.get("layout_config") or {})
    file_url = template.get("file_url") or template.get("image_url")

    if user_id:
        workspace_rows = _workspace_template_rows(user_id, template_id)

        if workspace_rows:
            workspace_layout = _normalize_layout_config(workspace_rows[0].get("layout_config") or {})
            layout_config = {**layout_config, **workspace_layout}
            file_url = workspace_rows[0].get("custom_template_url") or file_url

    return template, layout_config, file_url


# ---------------------------------------------------------------------------
# Font helpers
# ---------------------------------------------------------------------------

_WINDOWS_FONTS = [
    r"C:\Windows\Fonts\calibri.ttf",
    r"C:\Windows\Fonts\arial.ttf",
    r"C:\Windows\Fonts\verdana.ttf",
]
_WINDOWS_SERIF_FONTS = [
    r"C:\Windows\Fonts\times.ttf",
    r"C:\Windows\Fonts\timesbd.ttf",
    r"C:\Windows\Fonts\georgia.ttf",
    r"C:\Windows\Fonts\cambria.ttc",
]
_LINUX_FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]
_LINUX_SERIF_FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
]
_MAC_FONTS = [
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial.ttf",
]
_MAC_SERIF_FONTS = [
    "/System/Library/Fonts/Times.ttc",
    "/Library/Fonts/Georgia.ttf",
]

_DOC_NAME_PT = 52
_CERT_ID_PT = 18
_QR_MM = 60
_DOC_DPI = 96


def _pt_to_px(value: int, dpi: int = _DOC_DPI) -> int:
    return max(1, round(value * dpi / 72))


def _mm_to_px(value: int, dpi: int = _DOC_DPI) -> int:
    return max(1, round(value * dpi / 25.4))


def _get_font(size: int = 28) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in _WINDOWS_FONTS + _LINUX_FONTS + _MAC_FONTS:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _get_serif_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in _WINDOWS_SERIF_FONTS + _LINUX_SERIF_FONTS + _MAC_SERIF_FONTS:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return _get_font(size)


def _get_sans_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    return _get_font(size)


# ---------------------------------------------------------------------------
# Image helpers
# ---------------------------------------------------------------------------


def _download_image(url: str) -> bytes:
    """Synchronously download a remote image. Raises HTTPException on failure."""
    try:
        with httpx.Client(timeout=30, follow_redirects=True) as client:
            resp = client.get(url)
            resp.raise_for_status()
            return resp.content
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to download template image (HTTP {exc.response.status_code}): {url}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to download template image: {exc}",
        ) from exc


def _make_qr(verify_url: str, size: int = 120) -> Image.Image:
    """Generate a square QR code image."""
    qr = qrcode.QRCode(box_size=4, border=2)
    qr.add_data(verify_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
    return img.resize((size, size))


def _persist_generated_certificate(
    *,
    template_id: str,
    student_id: str | None,
    created_by: str | None,
    certificate_id: str,
    student_name: str,
    file_url: str,
    verification_url: str,
) -> None:
    payload = {
        "student_id": student_id,
        "template_id": template_id,
        "certificate_id": certificate_id,
        "student_name": student_name,
        "file_url": file_url,
        "verification_url": verification_url,
    }
    if created_by:
        payload["created_by"] = created_by

    candidate_payloads = [
        payload,
        {key: value for key, value in payload.items() if key != "created_by"},
        {
            key: value
            for key, value in payload.items()
            if key not in {"created_by", "certificate_id", "student_name", "verification_url"}
        },
    ]

    last_error: Exception | None = None
    for candidate in candidate_payloads:
        try:
            supabase.table("generated_certificates").insert(candidate).execute()
            return
        except Exception as exc:
            last_error = exc

    if last_error is not None:
        raise last_error


def _get_existing_generated_certificate(certificate_id: str) -> dict[str, Any] | None:
    try:
        resp = (
            supabase.table("generated_certificates")
            .select("file_url")
            .eq("certificate_id", certificate_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        print(f"[generate_certificates] Skipping existing-certificate lookup: {exc}")
        return None

    rows = resp.data if hasattr(resp, "data") and resp.data else []
    return rows[0] if rows else None


def _local_generated_path(file_url: str | None) -> str | None:
    if not file_url:
        return None
    prefix = f"{API_BASE_URL}/uploads/generated/"
    if not file_url.startswith(prefix):
        return None
    file_name = file_url[len(prefix):]
    if not file_name:
        return None
    local_path = os.path.join(GENERATED_DIR, file_name)
    return local_path if os.path.exists(local_path) else None


def _workspace_template_rows(user_id: str, template_id: str) -> list[dict[str, Any]]:
    try:
        workspace_resp = (
            supabase.table("workspace_templates")
            .select("template_id, custom_template_url, layout_config")
            .eq("user_id", user_id)
            .eq("template_id", template_id)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        return workspace_resp.data if hasattr(workspace_resp, "data") and workspace_resp.data else []
    except Exception as exc:
        if "custom_template_url" not in str(exc):
            return []

    try:
        workspace_resp = (
            supabase.table("workspace_templates")
            .select("template_id, layout_config")
            .eq("user_id", user_id)
            .eq("template_id", template_id)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        return workspace_resp.data if hasattr(workspace_resp, "data") and workspace_resp.data else []
    except Exception:
        return []


def _upsert_generated_certificate(
    *,
    template_id: str,
    student_id: str | None,
    created_by: str | None,
    certificate_id: str,
    student_name: str,
    file_url: str,
    verification_url: str,
) -> None:
    payload = {
        "student_id": student_id,
        "template_id": template_id,
        "certificate_id": certificate_id,
        "student_name": student_name,
        "file_url": file_url,
        "verification_url": verification_url,
    }
    if created_by:
        payload["created_by"] = created_by

    try:
        existing_resp = (
            supabase.table("generated_certificates")
            .select("id")
            .eq("certificate_id", certificate_id)
            .limit(1)
            .execute()
        )
        existing_rows = existing_resp.data if hasattr(existing_resp, "data") and existing_resp.data else []
    except Exception:
        existing_rows = []

    if existing_rows:
        try:
            (
                supabase.table("generated_certificates")
                .update(payload)
                .eq("id", existing_rows[0]["id"])
                .execute()
            )
            return
        except Exception:
            pass

    _persist_generated_certificate(
        template_id=template_id,
        student_id=student_id,
        created_by=created_by,
        certificate_id=certificate_id,
        student_name=student_name,
        file_url=file_url,
        verification_url=verification_url,
    )


def _draw_centered_text(
    draw: ImageDraw.ImageDraw,
    *,
    text: str,
    x: int,
    y: int,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    fill: tuple[int, int, int],
) -> None:
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        draw.text(
            (x - text_width // 2, y - text_height // 2),
            text,
            fill=fill,
            font=font,
        )
    except Exception:
        draw.text((x, y), text, fill=fill, font=font)


# ---------------------------------------------------------------------------
# Core rendering
# ---------------------------------------------------------------------------


def _render_certificate(
    bg_master: Image.Image,
    student_name: str,
    certificate_id: str,
    layout_config: dict[str, Any],
) -> Image.Image:
    """Render one certificate PNG and return the finished Image."""
    bg = bg_master.copy().convert("RGBA")
    draw = ImageDraw.Draw(bg)
    width, height = bg.size

    # --- Resolve layout percentages ---
    # Support both nameX/nameY and placeholderX/placeholderY key aliases
    normalized_layout = _normalize_layout_config(layout_config)

    name_x_pct = normalized_layout["placeholderX"]
    name_y_pct = normalized_layout["placeholderY"]
    id_x_pct = normalized_layout["idX"]
    id_y_pct = normalized_layout["idY"]
    qr_x_pct = normalized_layout["qrX"]
    qr_y_pct = normalized_layout["qrY"]

    show_name = normalized_layout["showStudentName"]
    show_id = normalized_layout["showID"]
    show_qr = normalized_layout["showQR"]

    # --- Convert percent → pixel coordinates ---
    x_name = int(width * name_x_pct / 100)
    y_name = int(height * name_y_pct / 100)

    x_id = int(width * id_x_pct / 100)
    y_id = int(height * id_y_pct / 100)

    x_qr = int(width * qr_x_pct / 100)
    y_qr = int(height * qr_y_pct / 100)

    font_name = _get_serif_font(_pt_to_px(_DOC_NAME_PT))
    font_id = _get_sans_font(_pt_to_px(_CERT_ID_PT))

    # --- Render student name (centre-anchored to match preview) ---
    if show_name:
        _draw_centered_text(
            draw,
            text=student_name,
            x=x_name,
            y=y_name,
            fill=(20, 20, 80),
            font=font_name,
        )

    # --- Render certificate ID ---
    if show_id:
        id_text = f"ID: {certificate_id}"
        _draw_centered_text(
            draw,
            text=id_text,
            x=x_id,
            y=y_id,
            fill=(56, 56, 56),
            font=font_id,
        )

    # --- Generate and paste QR code ---
    if show_qr:
        qr_url = f"{QR_VERIFY_BASE}/{certificate_id}"
        qr_img = _make_qr(qr_url, size=_mm_to_px(_QR_MM))
        qr_half = qr_img.size[0] // 2
        qr_pos = (max(0, x_qr - qr_half), max(0, y_qr - qr_half))
        bg.paste(qr_img, qr_pos, mask=qr_img)

    return bg

@router.post("", response_model=GenerateResponse)
def post_generate_certificates(body: GenerateRequest, request: Request) -> GenerateResponse:
    """Generate PNG certificates for the provided student list.

    1. Loads template background image and layout_config from Supabase.
    2. Renders student_name, certificate_id, and QR code on each copy.
    3. Saves to uploads/generated/{certificate_id}.png.
    4. Packages all PNGs into a ZIP archive.
    5. Returns individual download URLs and a single ZIP download URL.
    """
    if not body.students:
        raise HTTPException(status_code=400, detail="No students provided.")

    cleanup_expired_generated_certificate_files()

    auth_header = request.headers.get("Authorization", "")
    token = auth_header.split(" ", 1)[1] if auth_header.lower().startswith("bearer ") else None
    user = get_current_user(token) if token else None
    user_id = _extract_user_id(user)
    user_email = _extract_user_email(user)

    # --- 1. Load template from Supabase ---
    template, layout_config, file_url = _resolve_template_render_context(
        body.template_id,
        user_id,
    )

    # --- 2. Load template background ---
    if not file_url:
        raise HTTPException(
            status_code=422,
            detail="Template has no file_url or image_url. Upload a background image first.",
        )

    img_bytes = _download_image(file_url)
    try:
        background = Image.open(io.BytesIO(img_bytes))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not open template image: {exc}")

    width, height = background.size

    # --- 4. Generate one certificate per student ---
    results: list[CertificateOut] = []
    generated_paths: list[str] = []

    for student in body.students:
        student_id = student.student_id.strip() if student.student_id else None
        cert_id = student.external_id.strip()
        student_name = student.student_name.strip()
        email = student.email.strip()
        qr_url = f"{QR_VERIFY_BASE}/{cert_id}"

        rendered = _render_certificate(background, student_name, cert_id, layout_config)

        # Save as RGB PNG
        out_name = f"{cert_id}.png"
        out_path = os.path.join(GENERATED_DIR, out_name)
        rendered.convert("RGB").save(out_path, "PNG")
        generated_paths.append(out_path)

        generated_path = f"{API_BASE_URL}/uploads/generated/{out_name}"

        # Persist generated certificate metadata in the generated_certificates table.
        try:
            _upsert_generated_certificate(
                template_id=template.get("id") or body.template_id,
                student_id=student_id,
                created_by=user_id,
                certificate_id=cert_id,
                student_name=student_name,
                file_url=generated_path,
                verification_url=qr_url,
            )
        except Exception as exc:
            print(f"[generate_certificates] Failed to save generated certificate record for {cert_id}: {exc}")

        results.append(
            CertificateOut(
                certificate_id=cert_id,
                student_name=student_name,
                url=generated_path,
            )
        )

    # --- 5. Package all generated PNGs into a ZIP archive ---
    zip_name = f"certificates_{uuid.uuid4().hex[:8]}.zip"
    zip_path = os.path.join(GENERATED_DIR, zip_name)
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
        for cert_path in generated_paths:
            zipf.write(cert_path, arcname=os.path.basename(cert_path))

    zip_url = f"{API_BASE_URL}/uploads/generated/{zip_name}"

    return GenerateResponse(certificates=results, zip_url=zip_url)


# ---------------------------------------------------------------------------
# Bulk endpoint — generate for all imported students for the authenticated user
# ---------------------------------------------------------------------------


class BulkGenerateRequest(BaseModel):
    template_id: str


@router.post("/all", response_model=GenerateResponse)
def post_generate_all_ready(body: BulkGenerateRequest, request: Request) -> GenerateResponse:
    """Generate certificates for every imported student owned by the caller.

    1. Authenticates the caller and fetches all imported students for that user.
    2. Loads the specified template background + layout_config from Supabase.
    3. Renders a certificate PNG per student.
    4. Packages all PNGs into a single ZIP archive.
    5. Returns individual download URLs and a ZIP download URL.
    """

    auth_header = request.headers.get("Authorization", "")
    token = auth_header.split(" ", 1)[1] if auth_header.lower().startswith("bearer ") else None
    user = get_current_user(token) if token else None
    user_id = _extract_user_id(user)
    user_email = _extract_user_email(user)

    cleanup_expired_generated_certificate_files()

    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # --- 1. Fetch all imported students for the authenticated user ---
    try:
        imported_students = list_students(user_id, user_email)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch students: {exc}")

    if not imported_students:
        raise HTTPException(
            status_code=404,
            detail="No imported students found for the authenticated user.",
        )

    invalid_students: list[str] = []
    valid_students: list[dict[str, Any]] = []
    for student in imported_students:
        student_name = (student.get("full_name") or "").strip()
        external_id = (student.get("external_id") or "").strip()
        if not student_name or not external_id:
            student_ref = (
                external_id
                or (student.get("email") or "").strip()
                or str(student.get("id") or "unknown")
            )
            missing_fields: list[str] = []
            if not student_name:
                missing_fields.append("full_name")
            if not external_id:
                missing_fields.append("external_id")
            invalid_students.append(f"{student_ref} missing {', '.join(missing_fields)}")
            continue
        valid_students.append(student)

    if invalid_students:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Some imported students cannot be used for certificate generation.",
                "invalid_students": invalid_students,
            },
        )

    # --- 2. Load template from Supabase ---
    template, layout_config, file_url = _resolve_template_render_context(
        body.template_id,
        user_id,
    )

    if not file_url:
        raise HTTPException(
            status_code=422,
            detail="Template has no file_url or image_url. Upload a background image first.",
        )

    img_bytes = _download_image(file_url)
    try:
        background = Image.open(io.BytesIO(img_bytes))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not open template image: {exc}")

    # --- 3. Render a certificate for each imported student ---
    results: list[CertificateOut] = []
    generated_files: list[str] = []

    for student in valid_students:
        student_name: str = (student.get("full_name") or "").strip()
        email: str = (student.get("email") or "").strip()
        student_id: str | None = student.get("id")
        cert_id: str = (student.get("external_id") or "").strip()
        qr_url = f"{QR_VERIFY_BASE}/{cert_id}"

        rendered = _render_certificate(background, student_name, cert_id, layout_config)

        out_name = f"{cert_id}.png"
        out_path = os.path.join(GENERATED_DIR, out_name)
        rendered.convert("RGB").save(out_path, "PNG")
        generated_files.append(out_path)

        generated_path = f"{API_BASE_URL}/uploads/generated/{out_name}"

        # Persist generated certificate metadata in the generated_certificates table.
        try:
            _upsert_generated_certificate(
                template_id=template.get("id") or body.template_id,
                student_id=student_id,
                created_by=user_id,
                certificate_id=cert_id,
                student_name=student_name,
                file_url=generated_path,
                verification_url=qr_url,
            )
        except Exception as exc:
            print(f"[generate_all] Failed to save generated certificate record for {cert_id}: {exc}")

        results.append(
            CertificateOut(
                certificate_id=cert_id,
                student_name=student_name,
                url=generated_path,
            )
        )

    # --- 4. Package all PNGs into a ZIP archive ---
    zip_name = f"certificates_{uuid.uuid4().hex[:8]}.zip"
    zip_path = os.path.join(GENERATED_DIR, zip_name)
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
        for file_path in generated_files:
            zipf.write(file_path, arcname=os.path.basename(file_path))

    zip_url = f"{API_BASE_URL}/uploads/generated/{zip_name}"

    return GenerateResponse(certificates=results, zip_url=zip_url)
