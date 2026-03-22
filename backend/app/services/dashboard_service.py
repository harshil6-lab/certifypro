from typing import Any, Dict, List
from ._supabase_helpers import select_table
from app.core.supabase_client import supabase


async def get_dashboard_stats(user_id: str) -> Dict[str, Any]:
    """Get dashboard statistics for a specific user."""
    print(f"DEBUG: get_dashboard_stats called with user_id: {user_id}")

    # For now, return total counts (since we don't have real user data)
    # Count all templates
    templates_result = supabase.table("templates").select("id", count="exact").execute()
    templates_count = templates_result.count if hasattr(templates_result, 'count') else 0

    # Count all certificates
    certificates_result = supabase.table("certificates").select("id", count="exact").execute()
    certificates_count = certificates_result.count if hasattr(certificates_result, 'count') else 0

    # Count all students
    students_result = supabase.table("students").select("id", count="exact").execute()
    students_count = students_result.count if hasattr(students_result, 'count') else 0

    # Count total admins
    admins_result = supabase.table("app_users").select("id", count="exact").execute()
    admins_count = admins_result.count if hasattr(admins_result, 'count') else 0

    result = {
        "templates": templates_count,
        "certificates": certificates_count,
        "students": students_count,
        "admins": admins_count
    }
    print(f"DEBUG: get_dashboard_stats returning: {result}")
    return result


async def get_recent_activity(user_id: str) -> List[Dict[str, Any]]:
    """Get recent activity for a specific user."""

    activity = supabase.table("activities") \
        .select("action, meta, created_at") \
        .eq("user_id", user_id) \
        .in_("action", [
            "template_created",
            "students_imported",
            "certificate_generated"
        ]) \
        .order("created_at", desc=True) \
        .limit(5) \
        .execute()

    return activity.data


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
