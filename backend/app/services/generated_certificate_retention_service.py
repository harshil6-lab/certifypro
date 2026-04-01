from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from app.core.supabase_client import supabase

RETENTION_DAYS = 7
_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GENERATED_DIR = os.path.join(_BACKEND_ROOT, "uploads", "generated")
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")


def is_generated_certificate_expired(created_at: str | None) -> bool:
    if not created_at:
        return False

    try:
        normalized = created_at.replace("Z", "+00:00")
        created = datetime.fromisoformat(normalized)
    except ValueError:
        return False

    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)

    return created <= datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)


def _local_generated_path(file_url: str | None) -> str | None:
    if not file_url:
        return None

    prefix = f"{API_BASE_URL}/uploads/generated/"
    if file_url.startswith(prefix):
        file_name = file_url[len(prefix):]
    else:
        file_name = os.path.basename(file_url)

    if not file_name:
        return None

    return os.path.join(GENERATED_DIR, file_name)


def cleanup_expired_generated_certificate_files() -> None:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)).isoformat()

    try:
        resp = (
            supabase.table("generated_certificates")
            .select("id, file_url, created_at")
            .lt("created_at", cutoff)
            .execute()
        )
    except Exception as exc:
        print(f"[generated-retention] Cleanup skipped: {exc}")
        return

    rows = resp.data if hasattr(resp, "data") and resp.data else []
    for row in rows:
        local_path = _local_generated_path(row.get("file_url"))
        if not local_path:
            continue
        try:
            if os.path.exists(local_path):
                os.remove(local_path)
        except OSError as exc:
            print(f"[generated-retention] Failed to remove {local_path}: {exc}")