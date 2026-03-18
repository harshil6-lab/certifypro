from fastapi import APIRouter, HTTPException
from ..services.dashboard_service import get_stats, get_activity

router = APIRouter()


@router.get("/stats")
async def stats():
    """Return aggregated dashboard statistics from `dashboard_stats` view."""
    try:
        data = get_stats()
        return data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/activity")
async def activity(limit: int = 50):
    """Return recent activity entries from `activities` table."""
    try:
        data = get_activity(limit=limit)
        return {"items": data}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
