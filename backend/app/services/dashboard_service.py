from typing import Any, Dict, List
from ._supabase_helpers import select_table


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
