from fastapi import APIRouter, Request, HTTPException
from ..services.user_service import get_user_profile

router = APIRouter()


@router.get("/profile")
async def profile(request: Request):
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
    return {"profile": profile}
