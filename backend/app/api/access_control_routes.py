from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from app.core.config import get_settings
from app.services import auth_service
from app.services.access_control_service import (
    ASSIGNABLE_COMPONENT_PERMISSIONS,
    AuthIdentity,
    build_fallback_overview,
    get_access_control_overview,
    invite_member,
    remove_member,
    update_member_permissions,
)

router = APIRouter(prefix="/api/access-control", tags=["Access Control"])
settings = get_settings()


def _extract_identity(user: Any) -> AuthIdentity:
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if isinstance(user, dict):
        nested = user.get("user") if isinstance(user.get("user"), dict) else {}
        nested_metadata = nested.get("user_metadata") if isinstance(nested.get("user_metadata"), dict) else {}
        user_metadata = user.get("user_metadata") if isinstance(user.get("user_metadata"), dict) else {}
        auth_user_id = nested.get("id") or user.get("id")
        email = nested.get("email") or user.get("email")
        full_name = nested_metadata.get("full_name") or user.get("full_name")
        organization = (
            nested_metadata.get("organization")
            or user_metadata.get("organization")
            or nested_metadata.get("institution_name")
        )
    else:
        nested = getattr(user, "user", None)
        auth_user_id = getattr(nested, "id", None) or getattr(user, "id", None)
        email = getattr(nested, "email", None) or getattr(user, "email", None)
        metadata = getattr(nested, "user_metadata", None) if nested else None
        metadata_get = metadata.get if isinstance(metadata, dict) else (lambda *_: None)
        full_name = metadata_get("full_name") if nested else None
        organization = metadata_get("organization") if nested else None

    if not auth_user_id or not email:
        raise HTTPException(status_code=401, detail="Invalid authenticated user payload")

    return AuthIdentity(
        auth_user_id=str(auth_user_id),
        email=str(email),
        full_name=full_name,
        organization=organization,
    )


def _require_identity(request: Request) -> AuthIdentity:
    auth = request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = auth.split(" ", 1)[1]
    user = auth_service.get_current_user(token)
    return _extract_identity(user)


def _resolve_invite_redirect(request: Request) -> str:
    if settings.ACCESS_INVITE_REDIRECT_URL:
        return settings.ACCESS_INVITE_REDIRECT_URL

    origin = (request.headers.get("Origin") or "").strip().rstrip("/")
    if origin:
        return f"{origin}/reset-password?type=invite"

    if settings.FRONTEND_ORIGINS:
        return f"{settings.FRONTEND_ORIGINS[0].rstrip('/')}/reset-password?type=invite"

    return "http://localhost:8080/reset-password?type=invite"


class InviteMemberPayload(BaseModel):
    email: EmailStr
    member_type: str = Field(pattern="^(admin|co_admin)$")
    permissions: list[str] = []
    organizationId: str | None = None


class UpdatePermissionsPayload(BaseModel):
    permissions: list[str]


@router.get("/overview")
async def access_control_overview(request: Request):
    identity = _require_identity(request)
    try:
        overview = await asyncio.wait_for(
            asyncio.to_thread(get_access_control_overview, identity),
            timeout=4,
        )
        management_available = True
    except Exception:
        overview = build_fallback_overview(identity)
        management_available = False
    return {
        **overview,
        "assignable_permissions": ASSIGNABLE_COMPONENT_PERMISSIONS,
        "management_available": management_available,
    }


@router.post("/invite")
async def invite_access_member(request: Request, payload: InviteMemberPayload):
    identity = _require_identity(request)
    redirect_to = _resolve_invite_redirect(request)
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                invite_member,
                identity,
                invite_email=payload.email,
                target_member_type=payload.member_type,
                permissions=payload.permissions,
                redirect_to=redirect_to,
                organization_id=payload.organizationId,
            ),
            timeout=4,
        )
    except asyncio.TimeoutError as exc:
        raise HTTPException(status_code=503, detail="Access control storage is temporarily unavailable.") from exc
    return {
        **result,
        "message": (
            f"Invitation email sent to {result['member']['email']}."
            if result.get("email_sent")
            else (
                f"{result['member']['name']} already has login access. Permissions were updated without sending a new invite email."
                if result.get("email_status") == "existing_user"
                else f"{result['member']['name']} access was updated."
            )
        ),
    }


@router.patch("/members/{member_id}/permissions")
async def patch_member_permissions(request: Request, member_id: str, payload: UpdatePermissionsPayload):
    identity = _require_identity(request)
    try:
        member = await asyncio.wait_for(
            asyncio.to_thread(update_member_permissions, identity, member_id=member_id, permissions=payload.permissions),
            timeout=4,
        )
    except asyncio.TimeoutError as exc:
        raise HTTPException(status_code=503, detail="Access control storage is temporarily unavailable.") from exc
    return {"member": member}


@router.delete("/members/{member_id}")
async def delete_member(request: Request, member_id: str):
    identity = _require_identity(request)
    try:
        member = await asyncio.wait_for(
            asyncio.to_thread(remove_member, identity, member_id=member_id),
            timeout=4,
        )
    except asyncio.TimeoutError as exc:
        raise HTTPException(status_code=503, detail="Access control storage is temporarily unavailable.") from exc
    return {"member": member}