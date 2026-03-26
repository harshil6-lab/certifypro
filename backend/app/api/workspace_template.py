from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Any, Dict
from app.core.supabase_client import supabase
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api", tags=["Workspace"])


def _as_layout_dict(value: Any) -> Dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _to_bool(value: Any, fallback: bool) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "yes", "on"}:
            return True
        if normalized in {"false", "0", "no", "off"}:
            return False
    if isinstance(value, (int, float)):
        return value != 0
    return fallback


def _to_float(value: Any, fallback: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _normalize_layout_config(layout_config: Any) -> Dict[str, Any]:
    source = _as_layout_dict(layout_config)
    student_name = _as_layout_dict(source.get("student_name"))
    qr_code = _as_layout_dict(source.get("qr_code"))
    certificate_id = _as_layout_dict(source.get("certificate_id"))

    return {
        "showStudentName": _to_bool(
            source.get("showStudentName", source.get("show_name", student_name.get("visible"))),
            True,
        ),
        "showQR": _to_bool(source.get("showQR", source.get("show_qr", qr_code.get("visible"))), True),
        "showID": _to_bool(source.get("showID", source.get("show_id", certificate_id.get("visible"))), True),
        "placeholderField": str(source.get("placeholderField") or "STUDENT_NAME").strip().upper() or "STUDENT_NAME",
        "placeholderX": _to_float(source.get("placeholderX", source.get("nameX", student_name.get("x"))), 40),
        "placeholderY": _to_float(source.get("placeholderY", source.get("nameY", student_name.get("y"))), 36),
        "qrX": _to_float(source.get("qrX", source.get("qr_x", qr_code.get("x"))), 82),
        "qrY": _to_float(source.get("qrY", source.get("qr_y", qr_code.get("y"))), 76),
        "idX": _to_float(source.get("idX", source.get("id_x", certificate_id.get("x"))), 10),
        "idY": _to_float(source.get("idY", source.get("id_y", certificate_id.get("y"))), 88),
    }


def _is_missing_custom_template_url_column(exc: Exception) -> bool:
    message = str(exc)
    return "custom_template_url" in message and "schema cache" in message


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
    """Return the active workspace template for the authenticated user."""
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]

    user = get_current_user(token) if token else None
    user_id = _extract_user_id(user)

    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        try:
            workspace_template = (
                supabase.table("workspace_templates")
                .select("*")
                .eq("user_id", user_id)
                .eq("is_active", True)
                .single()
                .execute()
            )
            workspace_template_data = getattr(workspace_template, "data", None)
        except Exception:
            workspace_template_data = None

        if not workspace_template_data:
            return {
                "template": None,
                "template_id": None,
                "template_url": None,
                "file_url": None,
                "layout_config": None,
            }

        template = (
            supabase.table("templates")
            .select("*")
            .eq("id", workspace_template_data["template_id"])
            .single()
            .execute()
        )
        template_data = getattr(template, "data", None)
        if not template_data:
            raise HTTPException(status_code=404, detail="Template not found.")

        template_url = (
            workspace_template_data.get("custom_template_url")
            or template_data.get("file_url")
            or template_data.get("image_url")
        )

        return {
            "template": template_data.get("id"),
            "template_id": template_data.get("id"),
            "template_url": template_url,
            "file_url": template_url,
            "title": template_data.get("title"),
            "is_official": template_data.get("is_official"),
            "layout_config": _normalize_layout_config(workspace_template_data.get("layout_config")),
        }
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Save layout
# ---------------------------------------------------------------------------

class _SaveLayoutPayload(BaseModel):
    template_id: str
    layout_config: Dict[str, Any]
    custom_template_url: str | None = None


@router.post("/save-layout")
async def save_layout(payload: _SaveLayoutPayload, request: Request):
    """Persist the active layout config for the authenticated user.

    Steps:
    1. Deactivate all previous layouts for this user.
    2. Upsert the new active layout row into ``workspace_templates``.
    """
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.split(" ", 1)[1] if auth_header.lower().startswith("bearer ") else None
    user = get_current_user(token) if token else None
    user_id = _extract_user_id(user)

    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        normalized_layout_config = _normalize_layout_config(payload.layout_config)

        # Step 1: deactivate all previous active layouts for this user
        supabase.table("workspace_templates").update({"is_active": False}).eq("user_id", user_id).execute()

        base_payload = {
            "user_id": user_id,
            "template_id": payload.template_id,
            "layout_config": normalized_layout_config,
            "is_active": True,
        }

        # Step 2: upsert the new active layout. Retry without custom_template_url
        # when the live database schema has not been migrated yet.
        try:
            supabase.table("workspace_templates").upsert(
                {
                    **base_payload,
                    "custom_template_url": payload.custom_template_url,
                }
            ).execute()
        except Exception as exc:
            if not _is_missing_custom_template_url_column(exc):
                raise
            supabase.table("workspace_templates").upsert(base_payload).execute()

        return {"message": "Layout saved successfully."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
