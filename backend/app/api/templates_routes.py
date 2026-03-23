from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import Any
from ..services.templates_service import list_templates, create_template, remove_template
from ..services.template_service import upload_template_file, save_template_layout
from app.services.auth_service import get_current_user

# Expose routes under /api/templates to match frontend requests
router = APIRouter(prefix="/api/templates", tags=["Templates"])


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


@router.post("/upload")
async def upload_template(file: UploadFile = File(...), user=Depends(get_current_user)):
    """Upload a template file to Supabase storage and create a templates row for current user."""
    try:
        user_id = None
        try:
            # get_current_user may return dict-like or object
            user_id = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)
        except Exception:
            user_id = None

        created = await upload_template_file(file, file.filename, user_id)
        return created
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/layout/{template_id}")
async def save_layout(template_id: str, layout: dict):
    """Save template placeholder layout settings to templates table."""
    try:
        return await save_template_layout(template_id, layout)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
