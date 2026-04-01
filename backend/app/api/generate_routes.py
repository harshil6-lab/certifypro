"""Generation routes

POST /api/generate/preview        — parse Excel, return rows with valid/error/duplicate status
POST /api/generate/certificates   — render PNG certificates from Excel + template + layout_config
"""

from __future__ import annotations

import json

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.supabase_client import supabase
from app.services.generate_service import generate_certificates, parse_excel

router = APIRouter(prefix="/api/generate", tags=["Generate"])


def _validate_rows(raw_rows: list[dict]) -> list[dict]:
    """Attach a ``status`` field to each row: valid / error / duplicate."""
    seen_emails: set[str] = set()
    duplicate_emails: set[str] = set()

    # First pass — find duplicate emails
    for row in raw_rows:
        email = str(row.get("email", "") or "").strip().lower()
        if email:
            if email in seen_emails:
                duplicate_emails.add(email)
            seen_emails.add(email)

    results = []
    for i, row in enumerate(raw_rows, start=1):
        name = str(row.get("student_name", "") or "").strip()
        email = str(row.get("email", "") or "").strip().lower()
        cert_id = str(row.get("certificate_id", "") or "").strip()

        errors: list[str] = []
        if not name:
            errors.append("missing student_name")

        if errors:
            status = "error"
            error_detail = "; ".join(errors)
        elif email in duplicate_emails:
            status = "duplicate"
            error_detail = "duplicate email"
        else:
            status = "valid"
            error_detail = ""

        results.append(
            {
                "row": i,
                "student_name": name or "",
                "email": email,
                "certificate_id": cert_id,
                "status": status,
                "error": error_detail,
            }
        )

    return results


@router.post("/preview")
async def post_preview_excel(excel_file: UploadFile = File(...)):
    """Parse an Excel file and return validated rows without generating certificates.

    Each row has: row, student_name, email, certificate_id, status (valid/error/duplicate), error.
    Summary counts are also returned.
    """
    excel_bytes = await excel_file.read()
    if not excel_bytes:
        raise HTTPException(status_code=400, detail="Excel file is empty")

    try:
        raw_rows = parse_excel(excel_bytes)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse Excel file: {exc}")

    rows = _validate_rows(raw_rows)

    valid = sum(1 for r in rows if r["status"] == "valid")
    errors = sum(1 for r in rows if r["status"] == "error")
    duplicates = sum(1 for r in rows if r["status"] == "duplicate")

    return {
        "rows": rows,
        "summary": {"valid": valid, "errors": errors, "duplicates": duplicates, "total": len(rows)},
    }


@router.post("/certificates")
async def post_generate_certificates(
    excel_file: UploadFile = File(...),
    layout_config: str = Form(...),
    template_id: str | None = Form(None),
    file_url: str | None = Form(None),
):
    """Generate PNG certificates for every valid student row in the uploaded Excel file."""

    resolved_url: str | None = file_url

    if template_id:
        try:
            resp = supabase.table("templates").select("file_url, image_url, layout_config").eq("id", template_id).single().execute()
            row = resp.data if hasattr(resp, "data") else None
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to fetch template: {exc}")

        if not row:
            raise HTTPException(status_code=404, detail="Template not found")

        resolved_url = row.get("file_url") or row.get("image_url")

        if not layout_config or layout_config.strip() in ("", "{}"):
            db_cfg = row.get("layout_config")
            if db_cfg:
                layout_config = json.dumps(db_cfg) if isinstance(db_cfg, dict) else str(db_cfg)

    if not resolved_url:
        raise HTTPException(
            status_code=400,
            detail="Provide either template_id or file_url to identify the template image.",
        )

    try:
        cfg: dict = json.loads(layout_config) if layout_config else {}
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid layout_config JSON: {exc}")

    excel_bytes = await excel_file.read()
    if not excel_bytes:
        raise HTTPException(status_code=400, detail="Excel file is empty")

    try:
        raw_rows = parse_excel(excel_bytes)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse Excel file: {exc}")

    if not raw_rows:
        raise HTTPException(status_code=400, detail="No student rows found in Excel file")

    # Only generate for valid rows
    validated = _validate_rows(raw_rows)
    students = [
        {"student_name": r["student_name"], "email": r["email"], "certificate_id": r["certificate_id"]}
        for r in validated
        if r["status"] == "valid"
    ]

    if not students:
        raise HTTPException(status_code=400, detail="No valid student rows to generate certificates for")

    try:
        results = await generate_certificates(
            template_url=resolved_url,
            layout_config=cfg,
            students=students,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Certificate generation failed: {exc}")

    return {"certificates": results}
