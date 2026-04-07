from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Body
import os
from uuid import uuid4
from typing import Any
from pydantic import BaseModel
from ..services.templates_service import (
    list_templates,
    create_template,
    remove_template,
    create_template_from_url,
    VALID_CATEGORIES,
)
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
async def upload_template(
    file: UploadFile | None = File(None),
    payload: dict | None = Body(None),
    user=Depends(get_current_user),
):
    """Upload a template file or register an externally hosted image_url.

    - Multipart: { file } (existing flow)
    - JSON: { "image_url": "https://..." } (external images like Adobe exports)
    """
    try:
        user_id = None
        try:
            # get_current_user may return dict-like or object
            user_id = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)
        except Exception:
            user_id = None

        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")

        if payload and isinstance(payload, dict) and payload.get("image_url") and not file:
            image_url = str(payload.get("image_url") or "").strip()
            if not image_url.startswith("https://"):
                raise HTTPException(status_code=400, detail="image_url must start with https://")
            title = str(payload.get("title") or "External Template").strip() or "External Template"
            category = str(payload.get("category") or "Academic").strip().title()
            if category not in VALID_CATEGORIES:
                raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}")

            template = create_template_from_url(image_url=image_url, title=title, category=category, user_id=user_id)
            return {
                "template_id": template.get("id"),
                "file_url": image_url,
                "preview_url": image_url,
                "template": template,
            }

        if not file:
            raise HTTPException(status_code=400, detail="Either file (multipart) or image_url (json) is required.")

        uploaded = await upload_template_file(file, file.filename, user_id)

        base_name, _ = os.path.splitext(file.filename or "Uploaded Template")
        title = (base_name or "Uploaded Template").strip()
        template = create_template(
            {
                "slug": f"uploaded-{uuid4().hex[:12]}",
                "title": title,
                "category": "Custom",
                "description": f"Uploaded workspace template for {title}",
                "image_url": uploaded.get("preview_url") or uploaded.get("file_url"),
                "style_type": "custom",
                "editable_fields": [],
                "is_official": False,
                "created_by": user_id,
            }
        )

        return {
            **uploaded,
            "template_id": template.get("id"),
            "template": template,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/from-url")
async def create_template_from_url(payload: dict = Body(...), user=Depends(get_current_user)):
    """Create a custom template using an externally hosted image_url (e.g., Adobe exports)."""
    try:
        user_id = None
        try:
            user_id = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)
        except Exception:
            user_id = None

        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")

        image_url = str(payload.get("image_url") or "").strip()
        if not image_url.startswith("https://"):
            raise HTTPException(status_code=400, detail="Invalid image URL")

        title = str(payload.get("title") or "").strip() or "Adobe Certificate"
        category = str(payload.get("category") or "Custom").strip() or "Custom"

        template = create_template(
            {
                "slug": f"adobe-{uuid4().hex[:12]}",
                "title": title,
                "category": category,
                "description": "Imported from Adobe Express",
                "image_url": image_url,
                "style_type": "custom",
                "editable_fields": [],
                "is_official": False,
                "created_by": user_id,
            }
        )

        return {
            "template_id": template.get("id"),
            "file_url": image_url,
            "preview_url": image_url,
            "template": template,
        }
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


class SaveLayoutPayload(BaseModel):
    template_id: str
    layout_config: dict


@router.post("/save-layout")
async def post_save_layout(payload: SaveLayoutPayload):
    """Save layout_config JSON to the templates table for a given template_id."""
    try:
        return await save_template_layout(payload.template_id, payload.layout_config)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
