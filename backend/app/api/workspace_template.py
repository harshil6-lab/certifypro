from fastapi import APIRouter, HTTPException, Request
from app.core.supabase_client import supabase
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api", tags=["Workspace"])


def _extract_user_id(user) -> str | None:
    """Safely extract the UUID from various shapes returned by get_current_user."""
    if user is None:
        return None
    if isinstance(user, dict):
        return user.get("id")
    # supabase-py UserResponse wraps a User object
    inner = getattr(user, "user", None)
    if inner is not None:
        return getattr(inner, "id", None)
    return getattr(user, "id", None)


@router.get("/workspace-template")
async def get_workspace_template(request: Request):
    """Return the most recently updated template created by the authenticated user.

    Used by the Generate wizard to auto-load the workspace template without
    relying on localStorage.
    """
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]

    user = get_current_user(token) if token else None
    user_id = _extract_user_id(user)

    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        resp = (
            supabase.table("templates")
            .select("id")
            .eq("created_by", user_id)
            .order("updated_at", desc=True)
            .limit(1)
            .execute()
        )
        data = getattr(resp, "data", None) or []
        template_id = data[0]["id"] if data else None
        return {"template": template_id}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
