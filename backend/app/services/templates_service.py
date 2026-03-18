from typing import Any, Dict, List
from ._supabase_helpers import select_table, insert_table, delete_table


def list_templates() -> List[Dict[str, Any]]:
    data, err = select_table("templates")
    if err:
        raise RuntimeError(err)
    return data or []


def create_template(payload: Dict[str, Any]) -> Dict[str, Any]:
    data, err = insert_table("templates", payload)
    if err:
        raise RuntimeError(err)
    # supabase insert returns inserted row(s)
    if isinstance(data, list) and data:
        return data[0]
    return data


def remove_template(template_id: str):
    data, err = delete_table("templates", "id", template_id)
    if err:
        raise RuntimeError(err)
    return data
