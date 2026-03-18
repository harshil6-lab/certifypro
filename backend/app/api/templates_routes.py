from fastapi import APIRouter, HTTPException
from typing import Any
from ..services.templates_service import list_templates, create_template, remove_template

router = APIRouter()


@router.get("/")
async def get_templates():
    """List templates from `templates` table."""
    try:
        data = list_templates()
        return {"templates": data}
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
from fastapi import APIRouter, HTTPException
from pathlib import Path
import json

router = APIRouter()


@router.get("/templates")
async def list_templates():
    """Return the official certificate templates JSON.

    The templates file is sourced from the frontend package so teams can
    continue editing example templates in one place. The backend exposes
    it via a simple API to replace hardcoded frontend imports.
    """
    # Compute repo root relative to this file
    repo_root = Path(__file__).resolve().parents[3]
    templates_path = repo_root / "frontend" / "src" / "data" / "certificateTemplates.json"

    if not templates_path.exists():
        raise HTTPException(status_code=500, detail="templates source not found")

    with templates_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    return data
