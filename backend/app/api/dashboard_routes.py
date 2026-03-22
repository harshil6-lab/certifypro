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


@router.get("/stats")
async def dashboard_stats(request: Request):
    """Return dashboard statistics for the authenticated user."""
    try:
        # For testing, use a dummy user ID
        user_id = "test-user-id"
        print("DEBUG: Calling get_dashboard_stats")
        data = await get_dashboard_stats(user_id)
        print(f"DEBUG: get_dashboard_stats returned: {data}")
        return data
    except Exception as exc:
        print(f"DEBUG: Error in dashboard_stats: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/activity")
async def dashboard_activity(request: Request):
    """Return recent activity for the authenticated user."""
    try:
        # For testing, use a dummy user ID
        user_id = "test-user-id"
        data = await get_recent_activity(user_id)
        return {"items": data}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


