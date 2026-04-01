from typing import Any

from fastapi import APIRouter, HTTPException, Request
from ..services.dashboard_service import (
    get_dashboard_stats,
    get_recent_activity,
    get_stats,
    get_activity
)
from ..services import auth_service

router = APIRouter()


def _require_auth(request: Request):
    """Extract bearer token and validate user."""
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


@router.get("/stats")
async def dashboard_stats(request: Request):
    """Return dashboard statistics for the authenticated user."""
    try:
        user = _require_auth(request)
        user_id = _extract_user_id(user)
        user_email = _extract_user_email(user)
        if not user_id:
            raise HTTPException(status_code=401, detail="invalid token")
        data = await get_dashboard_stats(user_id, user_email)
        return data
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/activity")
async def dashboard_activity(request: Request):
    """Return recent activity for the authenticated user."""
    try:
        user = _require_auth(request)
        user_id = _extract_user_id(user)
        user_email = _extract_user_email(user)
        if not user_id:
            raise HTTPException(status_code=401, detail="invalid token")
        data = await get_recent_activity(user_id, user_email)
        return {"items": data}
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(exc))


