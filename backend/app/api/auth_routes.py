from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from ..services.auth_service import send_magic_link, get_current_user
from ..core.supabase_client import get_supabase_service_client
from fastapi import Path

router = APIRouter()


class LoginIn(BaseModel):
    email: EmailStr


@router.post("/login")
async def login(payload: LoginIn):
    result = send_magic_link(payload.email)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error") or "failed to send magic link")
    return {"message": "magic link requested"}


@router.get("/me")
async def me(request: Request):
    auth = request.headers.get("Authorization")
    token = None
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1]

    user = None
    if token:
        user = get_current_user(token)

    if not user:
        return {"user": None}
    return {"user": user}


@router.post("/logout")
async def logout():
    return {"message": "logged out (client-side)"}

# Task 4: Admin endpoint to delete Supabase auth user (triggers cascade + cleanup)
@router.delete("/admin/delete-user/{auth_uid}")
async def admin_delete_user(auth_uid: str = Path(..., description="Supabase auth.users.id")):
    """Super admin only: Delete auth user → triggers app_users CASCADE + cleanup trigger"""
    auth = request.headers.get("Authorization")
    token = auth.split(" ", 1)[1] if auth and auth.lower().startswith("bearer ") else None
    user = get_current_user(token)
    if not user or user.get("email") != "certifyprocare@gmail.com":
        raise HTTPException(status_code=403, detail="Super admin only")
    
    supabase = get_supabase_service_client()
    result = supabase.auth.admin.delete_user(auth_uid)
    return {"success": True, "deleted_auth_uid": auth_uid}
