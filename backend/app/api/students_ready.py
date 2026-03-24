"""Students Ready route

GET /api/students-ready  — return all imported students as a flat array,
ready for the Generate wizard to consume without transformation.
"""

from fastapi import APIRouter, HTTPException
from app.services.students_service import list_students

router = APIRouter(prefix="/api", tags=["Students"])


@router.get("/students-ready")
async def get_students_ready():
    """Return all students from the database as a flat array.

    Each entry contains: id, full_name, email, external_id (certificate_id), metadata.
    """
    try:
        students = list_students()
        return students  # plain list — frontend sets this directly via setStudents(res.data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
