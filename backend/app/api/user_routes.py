
from typing import Any

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from ..services.access_control_service import AuthIdentity, ensure_actor_membership
from ..services.profile_service import get_user_profile, mark_first_login_complete, update_user_profile

router = APIRouter()


class CompleteFirstLoginRequest(BaseModel):
    """Request body for completing first login setup."""
    pass


class NotificationPreferencesPayload(BaseModel):
    email_alerts: bool = False
    security_alerts: bool = False


class UpdateProfileRequest(BaseModel):
    full_name: str
    phone: str = ""
    department: str = ""
    designation: str = ""
    institution_name: str = ""
    institution_logo: str = ""
    address: str = ""
    domain: str = ""
    organization: str = ""
    notification_preferences: NotificationPreferencesPayload


def _extract_user_value(user: Any, key: str) -> Any:
    if isinstance(user, dict):
        if key in user:
            return user.get(key)
        nested = user.get("user")
        if isinstance(nested, dict):
            return nested.get(key)
        return None
    if hasattr(user, key):
        return getattr(user, key)
    nested = getattr(user, "user", None)
    if nested is not None:
        return getattr(nested, key, None)
    return None


def _extract_identity(user: Any) -> AuthIdentity:
    user_id = _extract_user_value(user, "id")
    email = _extract_user_value(user, "email")

    full_name = None
    organization = None
    if isinstance(user, dict):
        nested = user.get("user") if isinstance(user.get("user"), dict) else {}
        metadata = nested.get("user_metadata") if isinstance(nested.get("user_metadata"), dict) else {}
        outer_metadata = user.get("user_metadata") if isinstance(user.get("user_metadata"), dict) else {}
        full_name = metadata.get("full_name") or user.get("full_name")
        organization = metadata.get("organization") or outer_metadata.get("organization") or metadata.get("institution_name")
    else:
        nested = getattr(user, "user", None)
        metadata = getattr(nested, "user_metadata", None) if nested is not None else None
        if isinstance(metadata, dict):
            full_name = metadata.get("full_name")
            organization = metadata.get("organization") or metadata.get("institution_name")
        else:
            full_name = getattr(user, "full_name", None)

    if not user_id or not email:
        raise HTTPException(status_code=400, detail="invalid user payload")

    return AuthIdentity(
        auth_user_id=str(user_id),
        email=str(email),
        full_name=full_name,
        organization=organization,
    )


def _get_or_bootstrap_profile(user: Any, app_user_id: str | None = None) -> dict[str, Any]:
    identity = _extract_identity(user)
    target_user_id = app_user_id or identity.auth_user_id
    ensure_actor_membership(identity)
    profile = get_user_profile(target_user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")
    return profile


@router.get("/profile")
async def get_profile(request: Request):
    """Get current user's profile with role and organization."""
    app_user_id = getattr(request.state, "app_user_id", None) or getattr(request.state, "user_id", None)
    user = getattr(request.state, "user", None)
    if not app_user_id and not user:
        raise HTTPException(status_code=401, detail="unauthorized")

    profile = _get_or_bootstrap_profile(user, app_user_id)

    profile["last_login_at"] = _extract_user_value(user, "last_sign_in_at")
    profile["email"] = profile.get("email") or _extract_user_value(user, "email")
    
    return {"success": True, "profile": profile}


@router.put("/profile")
async def update_profile(request: Request, payload: UpdateProfileRequest):
    """Update current user's editable profile fields."""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="unauthorized")

    user_id = _extract_user_value(user, "id")
    if not user_id:
        raise HTTPException(status_code=400, detail="invalid user payload")

    _get_or_bootstrap_profile(user, None)

    payload_data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    profile = update_user_profile(user_id, payload_data)
    if not profile:
        raise HTTPException(status_code=500, detail="failed to update profile")

    profile["last_login_at"] = _extract_user_value(user, "last_sign_in_at")
    profile["email"] = profile.get("email") or _extract_user_value(user, "email")
    return {"success": True, "profile": profile}


@router.post("/profile/complete-first-login")
async def complete_first_login(request: Request, payload: CompleteFirstLoginRequest):
    """Mark first login as complete for the current user."""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="unauthorized")

    user_id = _extract_user_value(user, "id")

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
