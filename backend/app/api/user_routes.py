from fastapi import APIRouter, Request, HTTPException
from ..services.profile_service import get_user_profile, mark_first_login_complete
from pydantic import BaseModel

router = APIRouter()


class CompleteFirstLoginRequest(BaseModel):
    """Request body for completing first login setup."""
    pass


@router.get("/profile")
async def get_profile(request: Request):
    """Get current user's profile with role and organization."""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="unauthorized")

    user_id = None
    if isinstance(user, dict):
        user_id = user.get("id") or user.get("user", {}).get("id")
    else:
        user_id = getattr(user, "id", None)

    if not user_id:
        raise HTTPException(status_code=400, detail="invalid user payload")

    profile = get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")
    
    return {"success": True, "profile": profile}


@router.post("/profile/complete-first-login")
async def complete_first_login(request: Request, payload: CompleteFirstLoginRequest):
    """Mark first login as complete for the current user."""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="unauthorized")

    user_id = None
    if isinstance(user, dict):
        user_id = user.get("id") or user.get("user", {}).get("id")
    else:
        user_id = getattr(user, "id", None)

    if not user_id:
        raise HTTPException(status_code=400, detail="invalid user payload")

    success = mark_first_login_complete(user_id)
    if not success:
        raise HTTPException(status_code=500, detail="failed to update profile")
    
    return {
        "success": True,
        "message": "first login marked complete",
        "redirect": "/dashboard"
    }
