from fastapi import APIRouter, HTTPException
from typing import Any
from ..services.templates_service import list_templates, create_template, remove_template

router = APIRouter()


@router.get("/")
async def get_templates():
    """List all templates from templates table.
    
    Returns:
        Array of template objects sorted by created_at (newest first)
    """
    try:
        data = list_templates()
        # Return as plain array for frontend compatibility
        return data if isinstance(data, list) else []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/")
async def post_template(payload: Any):
    """Create a new template. Expects JSON payload matching templates table."""
    try:
        created = create_template(payload)
        return {"template": created}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/{template_id}")
async def delete_template(template_id: str):
    """Delete template by id."""
    try:
        res = remove_template(template_id)
        return {"deleted": True, "result": res}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
