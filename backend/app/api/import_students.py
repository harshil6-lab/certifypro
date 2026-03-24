"""Import Students route

POST /api/import-students/validate  — validate an Excel upload before certificate generation
POST /api/import-students/save      — persist validated student rows into the students table
"""

from __future__ import annotations

import io

import pandas as pd
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Any, List, Optional

from app.core.supabase_client import supabase
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/import-students", tags=["Import Students"])

REQUIRED_COLUMNS = {"student_name", "email", "certificate_id"}


@router.post("/validate")
async def validate_student_excel(file: UploadFile = File(...)):
    """Validate an Excel file before certificate generation.

    Checks:
    - All required columns are present (student_name, email, certificate_id).
    - No rows have a missing student_name value.

    Returns valid rows on success, or a descriptive error response on failure.
    """
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=422,
            detail="Uploaded file must be an Excel file (.xlsx or .xls).",
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        import io
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse Excel file: {exc}")

    # Normalise column names: strip whitespace, lower-case
    df.columns = [str(col).strip().lower() for col in df.columns]

    # --- Column presence check ---
    missing_columns = REQUIRED_COLUMNS - set(df.columns)
    if missing_columns:
        return JSONResponse(
            status_code=422,
            content={
                "status": "error",
                "message": f"Missing required column(s): {', '.join(sorted(missing_columns))}",
            },
        )

    # --- Build valid rows (validate each cell) ---
    valid_rows = []
    error_rows = []
    for idx, row in df.iterrows():
        name = str(row.get("student_name", "") or "").strip()
        email = str(row.get("email", "") or "").strip().lower()
        cert_id = str(row.get("certificate_id", "") or "").strip()
        row_num = int(idx) + 2  # 1-based + header

        missing = []
        if not name:
            missing.append("student_name")
        if not email:
            missing.append("email")
        if not cert_id:
            missing.append("certificate_id")

        if missing:
            error_rows.append({"row": row_num, "missing": missing})
        else:
            valid_rows.append({"student_name": name, "email": email, "certificate_id": cert_id})

    return {
        "status": "ok" if not error_rows else "partial",
        "message": f"{len(valid_rows)} valid row(s), {len(error_rows)} rejected.",
        "valid_rows": valid_rows,
        "rejected_rows": error_rows,
        "total": len(df),
    }


class _StudentRow(BaseModel):
    student_name: str
    email: str
    certificate_id: str


class _SavePayload(BaseModel):
    rows: List[_StudentRow]


def _extract_user_id(user: Any) -> Optional[str]:
    """Safely pull the UUID from various shapes returned by get_current_user."""
    if user is None:
        return None
    if isinstance(user, dict):
        return user.get("id")
    inner = getattr(user, "user", None)
    if inner is not None:
        return getattr(inner, "id", None)
    return getattr(user, "id", None)


@router.post("/save")
async def save_students(payload: _SavePayload, request: Request):
    """Persist student rows into the students table with per-row validation.

    Each row is individually validated for email, student_name, and
    certificate_id. Rows that pass are inserted into the students table;
    rows that fail are collected and returned in ``rejected_rows`` so the
    frontend can highlight them without blocking valid rows.
    """
    if not payload.rows:
        raise HTTPException(status_code=400, detail="No rows provided.")

    # Resolve caller's user id from Bearer token (optional — saves without it)
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.split(" ", 1)[1] if auth_header.lower().startswith("bearer ") else None
    user = get_current_user(token) if token else None
    user_id = _extract_user_id(user)

    accepted: list[dict] = []
    rejected: list[dict] = []

    for i, row in enumerate(payload.rows, start=1):
        name = row.student_name.strip()
        email = row.email.strip().lower()
        cert_id = row.certificate_id.strip()

        missing = []
        if not name:
            missing.append("student_name")
        if not email:
            missing.append("email")
        if not cert_id:
            missing.append("certificate_id")

        if missing:
            rejected.append({"row": i, "student_name": row.student_name, "missing": missing})
            continue

        record: dict = {
            "full_name": name,
            "email": email,
            "external_id": cert_id,
            "metadata": {},
        }
        if user_id:
            record["created_by"] = user_id

        try:
            supabase.table("students").insert(record).execute()
            accepted.append(record)
        except Exception as exc:
            rejected.append({"row": i, "student_name": row.student_name, "error": str(exc)})

    return {
        "saved": len(accepted),
        "rejected": len(rejected),
        "rejected_rows": rejected,
        "message": f"{len(accepted)} student(s) saved, {len(rejected)} rejected.",
    }
