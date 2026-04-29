from typing import Any, Dict, List
from ._supabase_helpers import select_table
from app.core.supabase_client import supabase
from app.services.students_service import list_students, resolve_student_scope


def _rows(resp: Any) -> list[dict[str, Any]]:
    return resp.data if hasattr(resp, "data") and resp.data else []


def _append_unique(target: list[str], value: str | None) -> None:
    if value and value not in target:
        target.append(value)


def _safe_metadata(metadata: Any) -> dict[str, Any]:
    """Safely extract metadata dictionary."""
    if isinstance(metadata, dict):
        return metadata
    return {}


def _safe_access_control(metadata: dict[str, Any]) -> dict[str, Any]:
    """Safely extract access_control dict from metadata."""
    ac = metadata.get("access_control")
    if isinstance(ac, dict):
        return ac
    return {}


def _extract_organization_id(metadata: dict[str, Any]) -> str:
    """Extract organization_id from app_users metadata."""
    access_control = _safe_access_control(metadata)
    profile = metadata.get("profile") if isinstance(metadata.get("profile"), dict) else {}
    org_id = (
        access_control.get("organization_id")
        or metadata.get("organization_id")
        or profile.get("organization_id")
    )
    return str(org_id).strip() if org_id else ""


def _resolve_organization_member_ids(organization_id: str) -> list[str]:
    """Get all app_users IDs that belong to the same organization."""
    if not organization_id:
        return []
    
    try:
        resp = (
            supabase.table("app_users")
            .select("id")
            .execute()
        )
        member_ids: list[str] = []
        for row in _rows(resp):
            row_metadata = _safe_metadata(row.get("metadata"))
            row_org_id = _extract_organization_id(row_metadata)
            if row_org_id == organization_id:
                row_id = row.get("id")
                if row_id:
                    member_ids.append(str(row_id))
        return member_ids
    except Exception:
        return []


def _resolve_app_user_ids(auth_user_id: str | None, auth_email: str | None) -> tuple[list[str], str]:
    """
    Resolve app_user IDs and their organization_id.
    Returns (list of app_user IDs, organization_id of the authenticated user).
    """
    resolved_ids: list[str] = []
    organization_id = ""
    
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
                .select("id, auth_uid, metadata")
                .eq(column, value)
                .execute()
            )
        except Exception:
            continue

        for row in _rows(resp):
            _append_unique(resolved_ids, row.get("id"))
            _append_unique(resolved_ids, row.get("auth_uid"))
            # Extract organization_id from the authenticated user's record
            if not organization_id and column in ["id", "auth_uid", "email"]:
                row_metadata = _safe_metadata(row.get("metadata"))
                org_id = _extract_organization_id(row_metadata)
                if org_id:
                    organization_id = org_id

    return resolved_ids, organization_id


def _resolve_student_ids(owner_ids: list[str], organization_id: str = "") -> list[str]:
    """
    Resolve student IDs created by organization members.
    If organization_id is provided, filter by organization_id + created_by.
    """
    if not owner_ids:
        return []
    
    # If organization_id is provided, get all members of that organization
    org_member_ids = owner_ids
    if organization_id:
        org_member_ids = _resolve_organization_member_ids(organization_id)
        if not org_member_ids:
            return []
    
    try:
        query = supabase.table("students").select("id").in_("created_by", org_member_ids)
        if organization_id:
            query = query.eq("organization_id", organization_id)
        resp = query.execute()
    except Exception:
        return []

    student_ids: list[str] = []
    for row in _rows(resp):
        _append_unique(student_ids, row.get("id"))
    return student_ids


def _resolve_template_ids(auth_user_id: str | None, owner_ids: list[str], organization_id: str = "") -> list[str]:
    """
    Resolve template IDs (workspace and created templates).
    If organization_id is provided, filter by organization members only.
    """
    template_ids: list[str] = []

    # Get organization member IDs if org filtering is needed
    org_member_ids = owner_ids
    if organization_id:
        org_member_ids = _resolve_organization_member_ids(organization_id)

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

    if org_member_ids:
        try:
            template_resp = (
                supabase.table("templates")
                .select("id")
                .in_("created_by", org_member_ids)
                .execute()
            )
            for row in _rows(template_resp):
                _append_unique(template_ids, row.get("id"))
        except Exception:
            pass

    return template_ids


def _resolve_generated_certificate_ids(owner_ids: list[str], student_ids: list[str], template_ids: list[str], organization_id: str = "") -> list[str]:
    """
    Resolve generated certificate IDs for organization members.
    If organization_id is provided, filter by organization members only.
    """
    generated_ids: list[str] = []

    # Get organization member IDs if org filtering is needed
    org_member_ids = owner_ids
    if organization_id:
        org_member_ids = _resolve_organization_member_ids(organization_id)

    if org_member_ids:
        try:
            resp = (
                supabase.table("generated_certificates")
                .select("id")
                .in_("created_by", org_member_ids)
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


def _count_admins(organization_id: str = "") -> int:
    """
    Count admins/co-admins in the organization.
    If organization_id is provided, count only org members with admin role.
    """
    if not organization_id:
        # Fallback: count all admins (only if no org context)
        try:
            resp = supabase.table("app_users").select("id", count="exact").eq("role", "admin").execute()
            return resp.count if hasattr(resp, "count") and resp.count is not None else len(_rows(resp))
        except Exception:
            return 0
    
    # Count admins/co-admins in the same organization
    try:
        resp = supabase.table("app_users").select("id, metadata").eq("role", "admin").execute()
        count = 0
        for row in _rows(resp):
            row_metadata = _safe_metadata(row.get("metadata"))
            row_org_id = _extract_organization_id(row_metadata)
            if row_org_id == organization_id:
                count += 1
        return count
    except Exception:
        return 0


async def get_dashboard_stats(auth_user_id: str, auth_email: str | None = None) -> Dict[str, Any]:
    """Get dashboard statistics scoped to the user's organization."""
    scope = resolve_student_scope(auth_user_id, auth_email)
    
    # Resolve owner IDs and organization context
    owner_ids, organization_id = _resolve_app_user_ids(auth_user_id, auth_email)
    
    # Resolve student IDs with organization filtering
    student_ids = _resolve_student_ids(owner_ids, organization_id)
    
    # If not a super admin, use the filtered student list
    if not scope.get("is_super_admin"):
        student_ids = [
            str(student.get("id"))
            for student in list_students(auth_user_id, auth_email)
            if student.get("id")
        ]
    
    # Resolve template IDs with organization filtering
    template_ids = _resolve_template_ids(auth_user_id, owner_ids, organization_id)
    
    # Resolve generated certificate IDs with organization filtering
    generated_ids = _resolve_generated_certificate_ids(owner_ids, student_ids, template_ids, organization_id)

    result = {
        "templates": len(template_ids),
        "certificates": len(generated_ids),
        "students": len(student_ids),
        "admins": _count_admins(organization_id),
    }
    return result


async def get_recent_activity(auth_user_id: str, auth_email: str | None = None) -> List[Dict[str, Any]]:
    """Get recent activity scoped to the user's organization."""
    owner_ids, organization_id = _resolve_app_user_ids(auth_user_id, auth_email)
    
    if not owner_ids:
        return []

    # If org context exists, include all org members' activities
    activity_user_ids = owner_ids
    if organization_id:
        activity_user_ids = _resolve_organization_member_ids(organization_id)
        if not activity_user_ids:
            return []

    activity = (
        supabase.table("activities")
        .select("action, meta, created_at")
        .in_("user_id", activity_user_ids)
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
