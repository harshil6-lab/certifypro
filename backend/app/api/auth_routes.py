from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from ..services.auth_service import send_magic_link, get_current_user

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
