"""Import Students route

POST /api/import-students/validate  — validate an Excel upload before certificate generation
POST /api/import-students/save      — persist validated student rows into the students table
"""

from __future__ import annotations

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List

from app.services.students_service import insert_students_bulk

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

    # --- Missing student_name value check ---
    missing_rows = df[df["student_name"].isnull() | (df["student_name"].astype(str).str.strip() == "")]

    if not missing_rows.empty:
        return JSONResponse(
            status_code=422,
            content={
                "status": "error",
                "message": "Missing student_name column values",
                "affected_rows": (missing_rows.index + 2).tolist(),  # +2: 1-based + header row
            },
        )

    # --- Build valid rows ---
    valid_rows = df[["student_name", "email", "certificate_id"]].copy()
    valid_rows["student_name"] = valid_rows["student_name"].astype(str).str.strip()
    valid_rows["email"] = valid_rows["email"].astype(str).str.strip().str.lower()
    valid_rows["certificate_id"] = valid_rows["certificate_id"].astype(str).str.strip()

    return {
        "status": "ok",
        "message": f"All {len(valid_rows)} row(s) are valid.",
        "valid_rows": valid_rows.to_dict(orient="records"),
        "total": len(valid_rows),
    }


class _StudentRow(BaseModel):
    student_name: str
    email: str
    certificate_id: str


class _SavePayload(BaseModel):
    rows: List[_StudentRow]


@router.post("/save")
async def save_students(payload: _SavePayload):
    """Persist validated student rows into the students table.

    Accepts the same row shape returned by /validate so the frontend can
    pass rows directly without transformation.
    """
    if not payload.rows:
        raise HTTPException(status_code=400, detail="No rows provided.")

    students = [
        {
            "full_name": row.student_name,
            "email": row.email,
            "external_id": row.certificate_id,
            "metadata": {},
        }
        for row in payload.rows
    ]

    try:
        result = insert_students_bulk(students)
        saved_count = len(result) if isinstance(result, list) else len(students)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"saved": saved_count, "message": f"{saved_count} student(s) saved successfully."}
