from typing import Any

from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from ..services import auth_service
from ..services.students_service import (
    build_student_metadata,
    insert_students_bulk,
    list_students,
    parse_students_csv,
    resolve_student_scope,
)

router = APIRouter()


def _require_auth(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing authorization header")
    token = auth.split(" ", 1)[1]
    user = auth_service.get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="invalid token")
    return user


def _extract_user_id(user: Any) -> str | None:
    if user is None:
        return None
    if isinstance(user, dict):
        nested = user.get("user")
        if isinstance(nested, dict) and nested.get("id"):
            return nested.get("id")
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


@router.post("/import")
async def import_students(request: Request, file: UploadFile = File(...)):
    """Import students via uploaded CSV file. CSV must contain `email` and `full_name` columns."""
    try:
        user = _require_auth(request)
        user_id = _extract_user_id(user)
        user_email = _extract_user_email(user)
        scope = resolve_student_scope(user_id, user_email)
        content = await file.read()
        rows = parse_students_csv(content)
        if not rows:
            raise HTTPException(status_code=400, detail="no rows parsed from CSV")
        for row in rows:
            row["metadata"] = build_student_metadata(scope, user_email)
            if user_id:
                row["created_by"] = user_id
        inserted = insert_students_bulk(rows)
        return {"inserted": inserted}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/")
async def get_students(request: Request):
    try:
        user = _require_auth(request)
        data = list_students(_extract_user_id(user), _extract_user_email(user))
        return {"students": data}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
