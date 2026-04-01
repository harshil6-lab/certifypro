from typing import Any, Dict, List
from ._supabase_helpers import select_table
from app.core.supabase_client import supabase
from app.services.students_service import list_students, resolve_student_scope


def _rows(resp: Any) -> list[dict[str, Any]]:
    return resp.data if hasattr(resp, "data") and resp.data else []


def _append_unique(target: list[str], value: str | None) -> None:
    if value and value not in target:
        target.append(value)


def _resolve_app_user_ids(auth_user_id: str | None, auth_email: str | None) -> list[str]:
    resolved_ids: list[str] = []
    _append_unique(resolved_ids, auth_user_id)

    candidate_filters: list[tuple[str, str]] = []
    if auth_user_id:
        candidate_filters.extend([
            ("id", auth_user_id),
            ("auth_uid", auth_user_id),
        ])
    if auth_email:
        candidate_filters.append(("email", auth_email))

    for column, value in candidate_filters:
        try:
            resp = (
                supabase.table("app_users")
                .select("id, auth_uid")
                .eq(column, value)
                .execute()
            )
        except Exception:
            continue

        for row in _rows(resp):
            _append_unique(resolved_ids, row.get("id"))
            _append_unique(resolved_ids, row.get("auth_uid"))

    return resolved_ids


def _resolve_student_ids(owner_ids: list[str]) -> list[str]:
    if not owner_ids:
        return []
    try:
        resp = (
            supabase.table("students")
            .select("id")
            .in_("created_by", owner_ids)
            .execute()
        )
    except Exception:
        return []

    student_ids: list[str] = []
    for row in _rows(resp):
        _append_unique(student_ids, row.get("id"))
    return student_ids


def _resolve_template_ids(auth_user_id: str | None, owner_ids: list[str]) -> list[str]:
    template_ids: list[str] = []

    if auth_user_id:
        try:
            workspace_resp = (
                supabase.table("workspace_templates")
                .select("template_id")
                .eq("user_id", auth_user_id)
                .eq("is_active", True)
                .execute()
            )
            for row in _rows(workspace_resp):
                _append_unique(template_ids, row.get("template_id"))
        except Exception:
            pass

    if owner_ids:
        try:
            template_resp = (
                supabase.table("templates")
                .select("id")
                .in_("created_by", owner_ids)
                .execute()
            )
            for row in _rows(template_resp):
                _append_unique(template_ids, row.get("id"))
        except Exception:
            pass

    return template_ids


def _resolve_generated_certificate_ids(owner_ids: list[str], student_ids: list[str], template_ids: list[str]) -> list[str]:
    generated_ids: list[str] = []

    if owner_ids:
        try:
            resp = (
                supabase.table("generated_certificates")
                .select("id")
                .in_("created_by", owner_ids)
                .execute()
            )
            for row in _rows(resp):
                _append_unique(generated_ids, row.get("id"))
        except Exception:
            pass

    if student_ids:
        try:
            resp = (
                supabase.table("generated_certificates")
                .select("id")
                .in_("student_id", student_ids)
                .execute()
            )
            for row in _rows(resp):
                _append_unique(generated_ids, row.get("id"))
        except Exception:
            pass

    if template_ids:
        try:
            resp = (
                supabase.table("generated_certificates")
                .select("id")
                .in_("template_id", template_ids)
                .execute()
            )
            for row in _rows(resp):
                _append_unique(generated_ids, row.get("id"))
        except Exception:
            pass

    return generated_ids


def _count_admins() -> int:
    try:
        resp = supabase.table("app_users").select("id", count="exact").eq("role", "admin").execute()
        return resp.count if hasattr(resp, "count") and resp.count is not None else len(_rows(resp))
    except Exception:
        return 0


async def get_dashboard_stats(auth_user_id: str, auth_email: str | None = None) -> Dict[str, Any]:
    """Get dashboard statistics for a specific user."""
    scope = resolve_student_scope(auth_user_id, auth_email)
    owner_ids = scope.get("owner_ids") or _resolve_app_user_ids(auth_user_id, auth_email)
    student_ids = _resolve_student_ids(owner_ids)
    if not scope.get("is_super_admin"):
        student_ids = [
            str(student.get("id"))
            for student in list_students(auth_user_id, auth_email)
            if student.get("id")
        ]
    template_ids = _resolve_template_ids(auth_user_id, owner_ids)
    generated_ids = _resolve_generated_certificate_ids(owner_ids, student_ids, template_ids)

    result = {
        "templates": len(template_ids),
        "certificates": len(generated_ids),
        "students": len(student_ids),
        "admins": _count_admins(),
    }
    return result


async def get_recent_activity(auth_user_id: str, auth_email: str | None = None) -> List[Dict[str, Any]]:
    """Get recent activity for a specific user."""
    owner_ids = _resolve_app_user_ids(auth_user_id, auth_email)
    if not owner_ids:
        return []

    activity = (
        supabase.table("activities")
        .select("action, meta, created_at")
        .in_("user_id", owner_ids)
        .in_("action", [
            "template_created",
            "students_imported",
            "certificate_generated",
            "certificate.created",
        ])
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )

    return activity.data if hasattr(activity, "data") and activity.data else []


# Keep existing functions for backward compatibility
def get_stats() -> Dict[str, Any]:
    """Fetch aggregated dashboard stats from the `dashboard_stats` view."""
    data, err = select_table("dashboard_stats")
    if err:
        raise RuntimeError(err)
    # data may be a list with single row
    if isinstance(data, list) and len(data) > 0:
        return data[0]
    return data or {}


def get_activity(limit: int = 50) -> List[Dict[str, Any]]:
    """Return recent activity from `activities` table ordered desc."""
    data, err = select_table("activities")
    if err:
        raise RuntimeError(err)
    # Data may need sorting client-side if view returns unsorted
    if isinstance(data, list):
        return sorted(data, key=lambda r: r.get("created_at"), reverse=True)[:limit]
    return []
