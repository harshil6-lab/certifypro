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

from concurrent.futures import ThreadPoolExecutor, as_completed
import io
import mimetypes
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

GENERATED_STORAGE_BUCKET = os.getenv("GENERATED_STORAGE_BUCKET", "certificate-templates")
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


def _load_font(paths: list[str], size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in paths:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


_DOC_NAME_PT = 52
_CERT_ID_PT = 18
_QR_MM = 60
_DOC_DPI = 96


def _pt_to_px(value: int, dpi: int = _DOC_DPI) -> int:
    return max(1, round(value * dpi / 72))


def _mm_to_px(value: int, dpi: int = _DOC_DPI) -> int:
    return max(1, round(value * dpi / 25.4))


_CACHED_NAME_FONT = _load_font(
    _WINDOWS_SERIF_FONTS + _LINUX_SERIF_FONTS + _MAC_SERIF_FONTS,
    _pt_to_px(_DOC_NAME_PT),
)
_CACHED_ID_FONT = _load_font(
    _WINDOWS_FONTS + _LINUX_FONTS + _MAC_FONTS,
    _pt_to_px(_CERT_ID_PT),
)


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


def _public_storage_url(storage_name: str) -> str:
    public_url = supabase.storage.from_(GENERATED_STORAGE_BUCKET).get_public_url(storage_name)
    if isinstance(public_url, str) and public_url:
        return public_url
    if isinstance(public_url, dict):
        nested = public_url.get("data")
        if isinstance(nested, dict):
            nested_url = nested.get("publicUrl") or nested.get("publicURL")
            if nested_url:
                return nested_url
        top_level_url = public_url.get("publicUrl") or public_url.get("publicURL")
        if top_level_url:
            return top_level_url

    for attr in ("public_url", "publicUrl", "publicURL"):
        value = getattr(public_url, attr, None)
        if value:
            return value

    raise HTTPException(status_code=500, detail=f"Could not build public URL for storage object: {storage_name}")


def _upload_to_supabase_storage(file_source: str | bytes, storage_name: str) -> str:
    """Upload file to Supabase storage bucket and return public URL."""
    if isinstance(file_source, str):
        with open(file_source, "rb") as file_handle:
            file_bytes = file_handle.read()
        content_type = mimetypes.guess_type(file_source)[0] or "application/octet-stream"
    else:
        file_bytes = file_source
        content_type = mimetypes.guess_type(storage_name)[0] or "application/octet-stream"

    try:
        result = supabase.storage.from_(GENERATED_STORAGE_BUCKET).upload(
            storage_name,
            file_bytes,
            {"content-type": content_type, "upsert": "true"},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to upload generated file to storage: {exc}") from exc

    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=500, detail=f"Failed to upload generated file to storage: {result.error}")
    if isinstance(result, dict) and result.get("error"):
        raise HTTPException(status_code=500, detail=f"Failed to upload generated file to storage: {result['error']}")

    return _public_storage_url(storage_name)


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
        "certificate_id": certificate_id,
        "student_id": student_id,
        "template_id": template_id,
        "student_name": student_name,
        "file_url": file_url,
        "verification_url": verification_url,
    }
    if created_by:
        payload["created_by"] = created_by

    try:
        supabase.table("generated_certificates").upsert(
            payload,
            on_conflict="certificate_id",
        ).execute()
    except Exception:
        try:
            fallback = {key: value for key, value in payload.items() if key != "created_by"}
            supabase.table("generated_certificates").upsert(
                fallback,
                on_conflict="certificate_id",
            ).execute()
        except Exception as exc2:
            print(f"[generate_certificates] Failed upsert for {certificate_id}: {exc2}")


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

    font_name = _CACHED_NAME_FONT
    font_id = _CACHED_ID_FONT

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


def _generate_batch_with_progress(
    *,
    template_id: str,
    students: list[StudentIn],
    user_id: str | None,
    job_id: str,
    update_fn,
) -> dict[str, Any]:
    cleanup_expired_generated_certificate_files()

    template, layout_config, file_url = _resolve_template_render_context(
        template_id,
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

    rendered_certs: list[tuple[str, str, str, bytes, str | None, str]] = []
    total_students = len(students)
    update_fn(job_id, progress=0, total=total_students)

    for student in students:
        student_id = student.student_id.strip() if student.student_id else None
        cert_id = student.external_id.strip()
        student_name = student.student_name.strip()
        qr_url = f"{QR_VERIFY_BASE}/{cert_id}"
        out_name = f"{cert_id}.png"

        rendered = _render_certificate(background, student_name, cert_id, layout_config)
        png_buf = io.BytesIO()
        rendered.convert("RGB").save(png_buf, "PNG")
        png_bytes = png_buf.getvalue()
        rendered_certs.append(
            (cert_id, student_name, out_name, png_bytes, student_id, qr_url)
        )

    MAX_WORKERS = 10

    def _upload_one(
        args: tuple[str, str, str, bytes, str | None, str],
    ) -> tuple[str, str, str | None, str | None, str, str | None]:
        cert_id, student_name, out_name, png_bytes, student_id, qr_url = args
        storage_name = f"generated/{out_name}"
        try:
            result = supabase.storage.from_(GENERATED_STORAGE_BUCKET).upload(
                storage_name,
                png_bytes,
                {"content-type": "image/png", "upsert": "true"},
            )
            if hasattr(result, "error") and result.error:
                raise Exception(result.error)
            if isinstance(result, dict) and result.get("error"):
                raise Exception(result["error"])
            public_url = _public_storage_url(storage_name)
            return cert_id, student_name, public_url, student_id, qr_url, None
        except Exception as exc:
            return cert_id, student_name, None, student_id, qr_url, str(exc)

    upload_results: dict[str, tuple[str, str, str | None, str]] = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(_upload_one, args): args[0] for args in rendered_certs}
        for completed_count, future in enumerate(as_completed(futures), start=1):
            cert_id, student_name, url, student_id, qr_url, err = future.result()
            if err:
                print(f"[generate] Upload failed for {cert_id}: {err}")
            else:
                upload_results[cert_id] = (student_name, url, student_id, qr_url)
            update_fn(job_id, progress=completed_count, total=total_students)

    def _upsert_one(args: tuple[str, str, str, str | None, str]) -> None:
        cert_id, student_name, url, student_id, qr_url = args
        _upsert_generated_certificate(
            template_id=template.get("id") or template_id,
            student_id=student_id,
            created_by=user_id,
            certificate_id=cert_id,
            student_name=student_name,
            file_url=url,
            verification_url=qr_url,
        )

    upsert_args = [
        (cert_id, *upload_results[cert_id])
        for cert_id in upload_results
    ]
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        list(executor.map(_upsert_one, upsert_args))

    certificates: list[dict[str, str]] = []
    for cert_id, _, _, _, _, _ in rendered_certs:
        if cert_id in upload_results:
            student_name, url, _, _ = upload_results[cert_id]
            certificates.append(
                {
                    "certificate_id": cert_id,
                    "student_name": student_name,
                    "url": url,
                }
            )

    zip_name = f"certificates_{uuid.uuid4().hex[:8]}.zip"
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
        for _, _, out_name, png_bytes, _, _ in rendered_certs:
            zipf.writestr(out_name, png_bytes)
    zip_bytes = zip_buf.getvalue()

    storage_zip = f"generated/{zip_name}"
    try:
        result = supabase.storage.from_(GENERATED_STORAGE_BUCKET).upload(
            storage_zip,
            zip_bytes,
            {"content-type": "application/zip", "upsert": "true"},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to upload generated ZIP to storage: {exc}") from exc

    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=500, detail=f"Failed to upload generated ZIP to storage: {result.error}")
    if isinstance(result, dict) and result.get("error"):
        raise HTTPException(status_code=500, detail=f"Failed to upload generated ZIP to storage: {result['error']}")

    return {
        "certificates": certificates,
        "zip_url": _public_storage_url(storage_zip),
    }


@router.post("/start", response_model=dict[str, str])
def post_generate_certificates_async(body: GenerateRequest, request: Request):
    """Start async generation, return job_id immediately for polling."""
    from app.api.job_routes import create_job, run_generate_job

    auth_header = request.headers.get("Authorization", "")
    token = auth_header.split(" ", 1)[1] if auth_header.lower().startswith("bearer ") else None
    user = get_current_user(token) if token else None
    user_id = _extract_user_id(user)

    job_id = create_job()

    run_generate_job(
        job_id,
        _generate_batch_with_progress,
        template_id=body.template_id,
        students=body.students,
        user_id=user_id,
    )

    return {"job_id": job_id}

@router.post("", response_model=GenerateResponse)
def post_generate_certificates(body: GenerateRequest, request: Request) -> GenerateResponse:
    """Generate PNG certificates for the provided student list.

    1. Loads template background image and layout_config from Supabase.
    2. Renders student_name, certificate_id, and QR code on each copy.
    3. Saves local PNG files, uploads them to Supabase Storage, and records public URLs.
    4. Packages all PNGs into a ZIP archive and uploads the ZIP to Supabase Storage.
    5. Returns individual download URLs and a single ZIP download URL.
    """
    if not body.students:
        raise HTTPException(status_code=400, detail="No students provided.")

    MAX_BATCH_SIZE = 500
    if len(body.students) > MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Batch size {len(body.students)} exceeds maximum of {MAX_BATCH_SIZE}. "
            f"Split into smaller batches or use the /all endpoint for large datasets.",
        )

    import threading
    threading.Thread(
        target=cleanup_expired_generated_certificate_files,
        daemon=True
    ).start()

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

    # --- 4. Render all certificates sequentially ---
    rendered_certs: list[tuple[str, str, str, bytes, str | None, str]] = []

    for student in body.students:
        student_id = student.student_id.strip() if student.student_id else None
        cert_id = student.external_id.strip()
        student_name = student.student_name.strip()
        qr_url = f"{QR_VERIFY_BASE}/{cert_id}"
        out_name = f"{cert_id}.png"

        rendered = _render_certificate(background, student_name, cert_id, layout_config)

        png_buf = io.BytesIO()
        rendered.convert("RGB").save(png_buf, "PNG")
        png_bytes = png_buf.getvalue()
        rendered_certs.append(
            (cert_id, student_name, out_name, png_bytes, student_id, qr_url)
        )

    # --- 5. Upload all PNGs in parallel ---
    MAX_WORKERS = 10

    def _upload_one(
        args: tuple[str, str, str, bytes, str | None, str],
    ) -> tuple[str, str, str | None, str | None, str, str | None]:
        cert_id, student_name, out_name, png_bytes, student_id, qr_url = args
        storage_name = f"generated/{out_name}"
        try:
            result = supabase.storage.from_(GENERATED_STORAGE_BUCKET).upload(
                storage_name,
                png_bytes,
                {"content-type": "image/png", "upsert": "true"},
            )
            if hasattr(result, "error") and result.error:
                raise Exception(result.error)
            if isinstance(result, dict) and result.get("error"):
                raise Exception(result["error"])
            public_url = _public_storage_url(storage_name)
            return cert_id, student_name, public_url, student_id, qr_url, None
        except Exception as exc:
            return cert_id, student_name, None, student_id, qr_url, str(exc)

    upload_results: dict[str, tuple[str, str, str | None, str]] = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(_upload_one, args): args[0] for args in rendered_certs}
        for future in as_completed(futures):
            cert_id, student_name, url, student_id, qr_url, err = future.result()
            if err:
                print(f"[generate] Upload failed for {cert_id}: {err}")
            else:
                upload_results[cert_id] = (student_name, url, student_id, qr_url)

    # --- 6. Upsert generated certificate records in parallel ---
    def _upsert_one(args: tuple[str, str, str, str | None, str]) -> None:
        cert_id, student_name, url, student_id, qr_url = args
        _upsert_generated_certificate(
            template_id=template.get("id") or body.template_id,
            student_id=student_id,
            created_by=user_id,
            certificate_id=cert_id,
            student_name=student_name,
            file_url=url,
            verification_url=qr_url,
        )

    upsert_args = [
        (cert_id, *upload_results[cert_id])
        for cert_id in upload_results
    ]
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        list(executor.map(_upsert_one, upsert_args))

    results: list[CertificateOut] = []
    for cert_id, _, _, _, _, _ in rendered_certs:
        if cert_id in upload_results:
            student_name, url, _, _ = upload_results[cert_id]
            results.append(
                CertificateOut(
                    certificate_id=cert_id,
                    student_name=student_name,
                    url=url,
                )
            )

    # --- 7. Build ZIP in memory and upload it ---
    zip_name = f"certificates_{uuid.uuid4().hex[:8]}.zip"
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
        for _, _, out_name, png_bytes, _, _ in rendered_certs:
            zipf.writestr(out_name, png_bytes)
    zip_bytes = zip_buf.getvalue()

    storage_zip = f"generated/{zip_name}"
    try:
        result = supabase.storage.from_(GENERATED_STORAGE_BUCKET).upload(
            storage_zip,
            zip_bytes,
            {"content-type": "application/zip", "upsert": "true"},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to upload generated ZIP to storage: {exc}") from exc

    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=500, detail=f"Failed to upload generated ZIP to storage: {result.error}")
    if isinstance(result, dict) and result.get("error"):
        raise HTTPException(status_code=500, detail=f"Failed to upload generated ZIP to storage: {result['error']}")

    zip_url = _public_storage_url(storage_zip)

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

    import threading
    threading.Thread(
        target=cleanup_expired_generated_certificate_files,
        daemon=True
    ).start()

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

    # --- 3. Render all certificates sequentially ---
    rendered_certs: list[tuple[str, str, str, bytes, str | None, str]] = []

    for student in valid_students:
        student_name: str = (student.get("full_name") or "").strip()
        student_id: str | None = student.get("id")
        cert_id: str = (student.get("external_id") or "").strip()
        qr_url = f"{QR_VERIFY_BASE}/{cert_id}"
        out_name = f"{cert_id}.png"

        rendered = _render_certificate(background, student_name, cert_id, layout_config)

        png_buf = io.BytesIO()
        rendered.convert("RGB").save(png_buf, "PNG")
        png_bytes = png_buf.getvalue()
        rendered_certs.append(
            (cert_id, student_name, out_name, png_bytes, student_id, qr_url)
        )

    # --- 4. Upload all PNGs in parallel ---
    MAX_WORKERS = 10

    def _upload_one(
        args: tuple[str, str, str, bytes, str | None, str],
    ) -> tuple[str, str, str | None, str | None, str, str | None]:
        cert_id, student_name, out_name, png_bytes, student_id, qr_url = args
        storage_name = f"generated/{out_name}"
        try:
            result = supabase.storage.from_(GENERATED_STORAGE_BUCKET).upload(
                storage_name,
                png_bytes,
                {"content-type": "image/png", "upsert": "true"},
            )
            if hasattr(result, "error") and result.error:
                raise Exception(result.error)
            if isinstance(result, dict) and result.get("error"):
                raise Exception(result["error"])
            public_url = _public_storage_url(storage_name)
            return cert_id, student_name, public_url, student_id, qr_url, None
        except Exception as exc:
            return cert_id, student_name, None, student_id, qr_url, str(exc)

    upload_results: dict[str, tuple[str, str, str | None, str]] = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(_upload_one, args): args[0] for args in rendered_certs}
        for future in as_completed(futures):
            cert_id, student_name, url, student_id, qr_url, err = future.result()
            if err:
                print(f"[generate] Upload failed for {cert_id}: {err}")
            else:
                upload_results[cert_id] = (student_name, url, student_id, qr_url)

    # --- 5. Upsert generated certificate records in parallel ---
    def _upsert_one(args: tuple[str, str, str, str | None, str]) -> None:
        cert_id, student_name, url, student_id, qr_url = args
        _upsert_generated_certificate(
            template_id=template.get("id") or body.template_id,
            student_id=student_id,
            created_by=user_id,
            certificate_id=cert_id,
            student_name=student_name,
            file_url=url,
            verification_url=qr_url,
        )

    upsert_args = [
        (cert_id, *upload_results[cert_id])
        for cert_id in upload_results
    ]
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        list(executor.map(_upsert_one, upsert_args))

    results: list[CertificateOut] = []
    for cert_id, _, _, _, _, _ in rendered_certs:
        if cert_id in upload_results:
            student_name, url, _, _ = upload_results[cert_id]
            results.append(
                CertificateOut(
                    certificate_id=cert_id,
                    student_name=student_name,
                    url=url,
                )
            )

    # --- 6. Build ZIP in memory and upload it ---
    zip_name = f"certificates_{uuid.uuid4().hex[:8]}.zip"
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
        for _, _, out_name, png_bytes, _, _ in rendered_certs:
            zipf.writestr(out_name, png_bytes)
    zip_bytes = zip_buf.getvalue()

    storage_zip = f"generated/{zip_name}"
    try:
        result = supabase.storage.from_(GENERATED_STORAGE_BUCKET).upload(
            storage_zip,
            zip_bytes,
            {"content-type": "application/zip", "upsert": "true"},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to upload generated ZIP to storage: {exc}") from exc

    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=500, detail=f"Failed to upload generated ZIP to storage: {result.error}")
    if isinstance(result, dict) and result.get("error"):
        raise HTTPException(status_code=500, detail=f"Failed to upload generated ZIP to storage: {result['error']}")

    zip_url = _public_storage_url(storage_zip)

    return GenerateResponse(certificates=results, zip_url=zip_url)
