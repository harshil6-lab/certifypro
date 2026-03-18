from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List
from ..services.students_service import parse_students_csv, insert_students_bulk, list_students

router = APIRouter()


@router.post("/import")
async def import_students(file: UploadFile = File(...)):
    """Import students via uploaded CSV file. CSV must contain `email` and `full_name` columns."""
    try:
        content = await file.read()
        rows = parse_students_csv(content)
        if not rows:
            raise HTTPException(status_code=400, detail="no rows parsed from CSV")
        inserted = insert_students_bulk(rows)
        return {"inserted": inserted}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/")
async def get_students():
    try:
        data = list_students()
        return {"students": data}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
