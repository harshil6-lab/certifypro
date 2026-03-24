"""Generate Certificates route

POST /api/generate-certificates  — generate PNG certificates for a list of
validated students using a Supabase template's background image and layout_config.

Expected JSON body:
    {
        "template_id": "<uuid>",
        "students": [
            {"student_name": "Alice", "email": "alice@example.com", "certificate_id": "CERT001"},
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
from fastapi import APIRouter, HTTPException
from PIL import Image, ImageDraw, ImageFont
from pydantic import BaseModel, Field

from app.core.supabase_client import supabase

router = APIRouter(prefix="/api/generate-certificates", tags=["Generate Certificates"])

# ---------------------------------------------------------------------------
# Output directory
# ---------------------------------------------------------------------------

_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GENERATED_DIR = os.path.join(_BACKEND_ROOT, "uploads", "generated")
os.makedirs(GENERATED_DIR, exist_ok=True)

API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
QR_VERIFY_BASE = "https://certifypro.app/verify"

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class StudentIn(BaseModel):
    student_name: str
    email: str = ""
    certificate_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())


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


# ---------------------------------------------------------------------------
# Font helpers
# ---------------------------------------------------------------------------

_WINDOWS_FONTS = [
    r"C:\Windows\Fonts\calibri.ttf",
    r"C:\Windows\Fonts\arial.ttf",
    r"C:\Windows\Fonts\verdana.ttf",
]
_LINUX_FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]
_MAC_FONTS = [
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial.ttf",
]


def _get_font(size: int = 28) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in _WINDOWS_FONTS + _LINUX_FONTS + _MAC_FONTS:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


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
    name_x_pct = float(layout_config.get("nameX", layout_config.get("placeholderX", 40)))
    name_y_pct = float(layout_config.get("nameY", layout_config.get("placeholderY", 36)))
    id_x_pct   = float(layout_config.get("idX", 10))
    id_y_pct   = float(layout_config.get("idY", 88))
    qr_x_pct   = float(layout_config.get("qrX", 82))
    qr_y_pct   = float(layout_config.get("qrY", 76))

    show_name = bool(layout_config.get("showStudentName", True))
    show_id   = bool(layout_config.get("showID", True))
    show_qr   = bool(layout_config.get("showQR", True))

    # --- Convert percent → pixel coordinates ---
    x_name = int(width * name_x_pct / 100)
    y_name = int(height * name_y_pct / 100)

    x_id = int(width * id_x_pct / 100)
    y_id = int(height * id_y_pct / 100)

    x_qr = int(width * qr_x_pct / 100)
    y_qr = int(height * qr_y_pct / 100)

    font_name = _get_font(max(24, width // 30))
    font_id   = _get_font(max(14, width // 60))

    # --- Render student name (horizontally centred on x_name) ---
    if show_name:
        try:
            bbox = draw.textbbox((0, 0), student_name, font=font_name)
            text_w = bbox[2] - bbox[0]
            draw.text(
                (x_name - text_w // 2, y_name),
                student_name,
                fill=(20, 20, 80),
                font=font_name,
            )
        except Exception:
            draw.text((x_name, y_name), student_name, fill=(20, 20, 80))

    # --- Render certificate ID ---
    if show_id:
        id_text = f"ID: {certificate_id}"
        try:
            draw.text((x_id, y_id), id_text, fill=(80, 80, 80), font=font_id)
        except Exception:
            draw.text((x_id, y_id), id_text, fill=(80, 80, 80))

    # --- Generate and paste QR code ---
    if show_qr:
        qr_url = f"{QR_VERIFY_BASE}/{certificate_id}"
        qr_img = _make_qr(qr_url, size=min(120, width // 8))
        qr_half = qr_img.size[0] // 2
        qr_pos = (max(0, x_qr - qr_half), max(0, y_qr - qr_half))
        bg.paste(qr_img, qr_pos, mask=qr_img)

    return bg


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("", response_model=GenerateResponse)
def post_generate_certificates(body: GenerateRequest) -> GenerateResponse:
    """Generate PNG certificates for the provided student list.

    1. Loads template background image and layout_config from Supabase.
    2. Renders student_name, certificate_id, and QR code on each copy.
    3. Saves to uploads/generated/{certificate_id}.png.
    4. Packages all PNGs into a ZIP archive.
    5. Returns individual download URLs and a single ZIP download URL.
    """
    if not body.students:
        raise HTTPException(status_code=400, detail="No students provided.")

    # --- 1. Load template from Supabase ---
    try:
        resp = (
            supabase.table("templates")
            .select("file_url, image_url, layout_config")
            .eq("id", body.template_id)
            .single()
            .execute()
        )
        template = resp.data if hasattr(resp, "data") else None
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch template: {exc}")

    if not template:
        raise HTTPException(status_code=404, detail="Template not found.")

    # --- 2. Extract layout_config ---
    layout_config: dict[str, Any] = template.get("layout_config") or {}

    # --- 3. Load template background ---
    file_url: str | None = template.get("file_url") or template.get("image_url")
    if not file_url:
        raise HTTPException(
            status_code=422,
            detail="Template has no file_url. Upload a background image first.",
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
        cert_id = student.certificate_id or str(uuid.uuid4())[:8].upper()
        student_name = student.student_name.strip()
        email = student.email.strip()
        qr_url = f"{QR_VERIFY_BASE}/{cert_id}"

        rendered = _render_certificate(background, student_name, cert_id, layout_config)

        # Save as RGB PNG
        out_name = f"{cert_id}.png"
        out_path = os.path.join(GENERATED_DIR, out_name)
        rendered.convert("RGB").save(out_path, "PNG")
        generated_paths.append(out_path)

        download_url = f"{API_BASE_URL}/uploads/generated/{out_name}"

        # --- Persist certificate info for public verification ---
        try:
            supabase.table("public_certificate_info").insert(
                {
                    "certificate_id": cert_id,
                    "student_name": student_name,
                    "email": email,
                    "template_id": body.template_id,
                    "verification_url": qr_url,
                }
            ).execute()
        except Exception as exc:
            # Non-fatal: log but continue so the PNG is still returned
            print(f"[generate_certificates] Failed to save public_certificate_info for {cert_id}: {exc}")

        results.append(
            CertificateOut(
                certificate_id=cert_id,
                student_name=student_name,
                url=download_url,
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
# Bulk endpoint — generate for all "ready" students in the DB
# ---------------------------------------------------------------------------


class BulkGenerateRequest(BaseModel):
    template_id: str


@router.post("/all", response_model=GenerateResponse)
def post_generate_all_ready(body: BulkGenerateRequest) -> GenerateResponse:
    """Generate certificates for every student whose status is 'ready'.

    1. Fetches all students with status='ready' from the students table.
    2. Loads the specified template background + layout_config from Supabase.
    3. Renders a certificate PNG per student.
    4. Packages all PNGs into a single ZIP archive.
    5. Returns individual download URLs and a ZIP download URL.
    """

    # --- 1. Fetch all ready students ---
    try:
        students_resp = (
            supabase.table("students")
            .select("id, full_name, email, external_id, metadata")
            .eq("status", "ready")
            .execute()
        )
        ready_students: list[dict[str, Any]] = (
            students_resp.data if hasattr(students_resp, "data") and students_resp.data else []
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch students: {exc}")

    if not ready_students:
        raise HTTPException(
            status_code=404,
            detail="No students with status='ready' found. Import and validate students first.",
        )

    # --- 2. Load template from Supabase ---
    try:
        template_resp = (
            supabase.table("templates")
            .select("file_url, image_url, layout_config")
            .eq("id", body.template_id)
            .single()
            .execute()
        )
        template = template_resp.data if hasattr(template_resp, "data") else None
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch template: {exc}")

    if not template:
        raise HTTPException(status_code=404, detail="Template not found.")

    layout_config: dict[str, Any] = template.get("layout_config") or {}

    file_url: str | None = template.get("file_url") or template.get("image_url")
    if not file_url:
        raise HTTPException(
            status_code=422,
            detail="Template has no file_url. Upload a background image first.",
        )

    img_bytes = _download_image(file_url)
    try:
        background = Image.open(io.BytesIO(img_bytes))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not open template image: {exc}")

    # --- 3. Render a certificate for each ready student ---
    results: list[CertificateOut] = []
    generated_files: list[str] = []

    for student in ready_students:
        student_name: str = (student.get("full_name") or "").strip()
        email: str = (student.get("email") or "").strip()
        # Use external_id (certificate_id from import) or generate one
        cert_id: str = (student.get("external_id") or "").strip() or str(uuid.uuid4())[:8].upper()
        qr_url = f"{QR_VERIFY_BASE}/{cert_id}"

        rendered = _render_certificate(background, student_name, cert_id, layout_config)

        out_name = f"{cert_id}.png"
        out_path = os.path.join(GENERATED_DIR, out_name)
        rendered.convert("RGB").save(out_path, "PNG")
        generated_files.append(out_path)

        download_url = f"{API_BASE_URL}/uploads/generated/{out_name}"

        # Persist verification record (non-fatal)
        try:
            supabase.table("public_certificate_info").insert(
                {
                    "certificate_id": cert_id,
                    "student_name": student_name,
                    "email": email,
                    "template_id": body.template_id,
                    "verification_url": qr_url,
                }
            ).execute()
        except Exception as exc:
            print(f"[generate_all] Failed to save public_certificate_info for {cert_id}: {exc}")

        results.append(
            CertificateOut(
                certificate_id=cert_id,
                student_name=student_name,
                url=download_url,
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
