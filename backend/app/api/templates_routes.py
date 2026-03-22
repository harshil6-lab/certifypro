from fastapi import APIRouter, HTTPException
from typing import Any
from ..services.templates_service import list_templates, create_template, remove_template

router = APIRouter()


@router.get("/")
async def get_templates(official: bool | None = None, category: str | None = None):
    """List templates from templates table with optional filtering.

    Query params:
      - official=true  : return only is_official templates
      - category=Academic|Corporate|Internship|Event|Compliance|Training : category filter
    """
    try:
        data = list_templates(official=official, category=category)
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
