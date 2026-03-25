"""Student listing routes used by generation and registry pages."""

from typing import Any

from fastapi import APIRouter, HTTPException, Request
from app.core.supabase_client import supabase
from app.services.students_service import list_students
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api", tags=["Students"])


def _extract_user_id(user: Any) -> str | None:
    if user is None:
        return None
    if isinstance(user, dict):
        return user.get("id")
    inner = getattr(user, "user", None)
    if inner is not None:
        return getattr(inner, "id", None)
    return getattr(user, "id", None)


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


@router.get("/my-certificates")
async def get_my_certificates(request: Request):
    """Return all generated certificates for the authenticated user."""
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.split(" ", 1)[1] if auth_header.lower().startswith("bearer ") else None
    user = get_current_user(token) if token else None
    user_id = _extract_user_id(user)

    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        resp = (
            supabase.table("students")
            .select("id, full_name, email, external_id, created_at")
            .eq("created_by", user_id)
            .execute()
        )
        students = resp.data if hasattr(resp, "data") and resp.data else []

        if not students:
            return {"certificates": []}

        student_ids = [student["id"] for student in students if student.get("id")]
        try:
            generated_resp = (
                supabase.table("generated_certificates")
                .select("*")
                .in_("student_id", student_ids)
                .order("created_at", desc=True)
                .execute()
            )
            generated_rows = (
                generated_resp.data if hasattr(generated_resp, "data") and generated_resp.data else []
            )
        except Exception as exc:
            # Keep the Registry page working when the live DB schema lags behind code.
            print(f"[my-certificates] Falling back to empty generated certificate list: {exc}")
            generated_rows = []

        students_by_id = {student["id"]: student for student in students if student.get("id")}

        certificates = []
        for generated in generated_rows:
            student_id = generated.get("student_id")
            student = students_by_id.get(student_id) or {}
            certificate_id = generated.get("certificate_id") or student.get("external_id") or ""
            student_name = generated.get("student_name") or student.get("full_name") or ""
            certificates.append(
                {
                    "id": generated.get("id"),
                    "template_id": generated.get("template_id"),
                    "full_name": student_name,
                    "email": student.get("email") or "",
                    "external_id": certificate_id,
                    "created_at": generated.get("created_at"),
                    "status": "issued",
                    "download_url": generated.get("file_url"),
                    "verification_url": generated.get("verification_url"),
                }
            )

        return {"certificates": certificates}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch certificates: {exc}")
