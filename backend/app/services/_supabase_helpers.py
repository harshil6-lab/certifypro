"""Helper utilities to normalize supabase-py client calls and responses.

These helpers try multiple client method names to be compatible with
different supabase-py versions and normalize the returned data/error.
"""
from typing import Any, Dict, Tuple
from ..core.supabase_client import supabase


def _exec(method_call) -> Tuple[Any, Any]:
    """Execute a supabase method call and return (data, error).

    The supabase client may return different shapes (object with .data,
    dict with 'data'/'error', or a tuple). Normalize to (data, error).
    """
    try:
        res = method_call
        # If a callable was passed, call it
        if callable(res):
            res = res()
    except Exception as exc:
        return None, exc

    # Normalize
    if res is None:
        return None, None

    # Newer clients return a response object with .data and .error
    if hasattr(res, "data") or hasattr(res, "error"):
        data = getattr(res, "data", None)
        error = getattr(res, "error", None)
        return data, error

    # Some return a dict
    if isinstance(res, dict):
        return res.get("data"), res.get("error")

    # Some return a tuple (data, count)
    if isinstance(res, (list, tuple)):
        return res, None

    return res, None


def select_table(table: str, columns: str = "*"):
    """Return (data, error) selecting from a table/view."""
    # try common method names
    try:
        return _exec(lambda: supabase.table(table).select(columns).execute())
    except Exception:
        try:
            return _exec(lambda: supabase.from_(table).select(columns).execute())
        except Exception:
            # fallback to rpc selecting from view via raw SQL not exposed here
            return None, RuntimeError("Supabase client missing select method")


def select_where(table: str, filters: dict, columns: str = "*"):
    """Select with equality filters from a table. filters is a dict of column->value."""
    try:
        q = supabase.table(table).select(columns)
        for k, v in filters.items():
            q = q.eq(k, v)
        return _exec(lambda: q.execute())
    except Exception:
        try:
            q = supabase.from_(table).select(columns)
            for k, v in filters.items():
                q = q.eq(k, v)
            return _exec(lambda: q.execute())
        except Exception as exc:
            return None, exc


def insert_table(table: str, payload: Dict):
    try:
        return _exec(lambda: supabase.table(table).insert(payload).execute())
    except Exception:
        try:
            return _exec(lambda: supabase.from_(table).insert(payload).execute())
        except Exception as exc:
            return None, exc


def delete_table(table: str, key: str, value: Any):
    try:
        return _exec(lambda: supabase.table(table).delete().eq(key, value).execute())
    except Exception:
        try:
            return _exec(lambda: supabase.from_(table).delete().eq(key, value).execute())
        except Exception as exc:
            return None, exc


def call_rpc(fn_name: str, params: dict):
    try:
        return _exec(lambda: supabase.rpc(fn_name, params).execute())
    except Exception as exc:
        return None, exc
