from fastapi import APIRouter, HTTPException, Request
from typing import Any
from ..services.certificates_service import generate_certificate, list_certificates
from ..services import _supabase_helpers
from ..services import auth_service

router = APIRouter()


def _require_admin(request: Request):
    """Extract bearer token and ensure the calling user is an admin in app_users."""
    auth = request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing authorization header")
    token = auth.split(" ", 1)[1]
    user = auth_service.get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="invalid token")

    # Try to find corresponding app_user by auth_uid or email
    auth_uid = None
    if isinstance(user, dict):
        auth_uid = user.get("id") or user.get("user", {}).get("id")
        email = user.get("email") or user.get("user", {}).get("email")
    else:
        auth_uid = getattr(user, "id", None)
        email = getattr(user, "email", None)

    app_user_data, err = _supabase_helpers.select_where("app_users", {"auth_uid": auth_uid})
    if err:
        # fallback to lookup by email
        app_user_data, err = _supabase_helpers.select_where("app_users", {"email": email})
        if err:
            raise HTTPException(status_code=500, detail=str(err))

    app_user = None
    if isinstance(app_user_data, list) and app_user_data:
        app_user = app_user_data[0]
    elif isinstance(app_user_data, dict):
        app_user = app_user_data

    if not app_user or app_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="admin role required")

    return app_user


@router.post("/generate")
async def post_generate(request: Request, payload: Any):
    """Generate a certificate — admin-only.

    Calls the DB RPC `create_certificate` which generates a certificate row,
    a secure `qr_token`, and records activity. Input expects `template_id` and `student_id`.
    """
    try:
        app_user = _require_admin(request)
        template_id = payload.get("template_id")
        student_id = payload.get("student_id")
        if not template_id or not student_id:
            raise HTTPException(status_code=400, detail="template_id and student_id required")

        # payload.data may include additional fields for certificate data
        cert_payload = payload.get("data") or {}
        cert_id = generate_certificate(template_id, student_id, app_user.get("id"), cert_payload)
        return {"certificate_id": cert_id}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/")
async def get_certs():
    try:
        data = list_certificates()
        return {"certificates": data}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
