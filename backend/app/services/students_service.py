from typing import Any, Dict, List

from app.core.supabase_client import supabase

from ._supabase_helpers import insert_table, select_table
import csv
import io


SUPER_ADMIN_EMAIL = "certifyprocare@gmail.com"


def _rows(resp: Any) -> list[dict[str, Any]]:
    return resp.data if hasattr(resp, "data") and resp.data else []


def _append_unique(target: list[str], value: str | None) -> None:
    if value and value not in target:
        target.append(value)


def _safe_metadata(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _safe_access_control(metadata: dict[str, Any]) -> dict[str, Any]:
    access_control = metadata.get("access_control")
    return access_control if isinstance(access_control, dict) else {}


def _normalize_org_name(value: str | None) -> str:
    if not value or not isinstance(value, str):
        return ""
    return " ".join(value.strip().split())


def _organization_key(value: str | None) -> str:
    normalized = _normalize_org_name(value).lower()
    if not normalized:
        return ""
    return "".join(ch for ch in normalized if ch.isalnum())


def _extract_org_name(metadata: dict[str, Any]) -> str:
    profile = metadata.get("profile") if isinstance(metadata.get("profile"), dict) else {}
    return _normalize_org_name(
        metadata.get("organization")
        or profile.get("organization")
        or profile.get("institution_name")
    )


def _extract_org_id(metadata: dict[str, Any]) -> str:
    access_control = _safe_access_control(metadata)
    profile = metadata.get("profile") if isinstance(metadata.get("profile"), dict) else {}
    org_id = access_control.get("organization_id") or metadata.get("organization_id") or profile.get("organization_id")
    return str(org_id).strip() if org_id else ""


def _extract_org_key(metadata: dict[str, Any]) -> str:
    access_control = _safe_access_control(metadata)
    key = access_control.get("organization_key") or metadata.get("organization_key")
    if key:
        return str(key).strip()
    return _organization_key(_extract_org_name(metadata))


def _resolve_actor_app_users(auth_user_id: str | None, auth_email: str | None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    candidate_filters: list[tuple[str, str]] = []

    if auth_user_id:
        candidate_filters.extend([
            ("id", auth_user_id),
            ("auth_uid", auth_user_id),
        ])
    if auth_email:
        candidate_filters.append(("email", auth_email.strip().lower()))

    for column, value in candidate_filters:
        try:
            resp = (
                supabase.table("app_users")
                .select("id, auth_uid, email, role, metadata")
                .eq(column, value)
                .execute()
            )
        except Exception:
            continue

        for row in _rows(resp):
            row_id = str(row.get("id") or row.get("auth_uid") or row.get("email") or "")
            if row_id and row_id not in seen_ids:
                seen_ids.add(row_id)
                rows.append(row)

    return rows


def resolve_student_scope(auth_user_id: str | None, auth_email: str | None) -> dict[str, Any]:
    actor_email = (auth_email or "").strip().lower()
    actor_rows = _resolve_actor_app_users(auth_user_id, actor_email)
    primary_row = actor_rows[0] if actor_rows else {}
    primary_metadata = _safe_metadata(primary_row.get("metadata"))

    organization = _extract_org_name(primary_metadata)
    organization_id = _extract_org_id(primary_metadata)
    organization_key = _extract_org_key(primary_metadata)

    if not organization and actor_email:
        try:
            response = (
                supabase.table("access_requests")
                .select("organization")
                .ilike("email", actor_email)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            latest_request = _rows(response)
            if latest_request:
                organization = _normalize_org_name(latest_request[0].get("organization"))
                if not organization_key:
                    organization_key = _organization_key(organization)
        except Exception:
            pass

    owner_ids: list[str] = []
    _append_unique(owner_ids, auth_user_id)
    for row in actor_rows:
        _append_unique(owner_ids, row.get("id"))
        _append_unique(owner_ids, row.get("auth_uid"))

    is_super_admin = actor_email == SUPER_ADMIN_EMAIL or str(primary_row.get("role") or "").strip().lower() == "super_admin"
    if is_super_admin:
        return {
            "is_super_admin": True,
            "owner_ids": owner_ids,
            "organization": organization,
            "organization_id": organization_id,
            "organization_key": organization_key,
        }

    if organization_id or organization_key or organization:
        try:
            resp = (
                supabase.table("app_users")
                .select("id, auth_uid, metadata")
                .execute()
            )
            for row in _rows(resp):
                metadata = _safe_metadata(row.get("metadata"))
                same_org = False
                row_org_id = _extract_org_id(metadata)
                row_org_key = _extract_org_key(metadata)
                row_org_name = _extract_org_name(metadata)
                if organization_id and row_org_id == organization_id:
                    same_org = True
                elif organization_key and row_org_key == organization_key:
                    same_org = True
                elif organization and row_org_name == organization:
                    same_org = True

                if same_org:
                    _append_unique(owner_ids, row.get("id"))
                    _append_unique(owner_ids, row.get("auth_uid"))
        except Exception:
            pass

    return {
        "is_super_admin": False,
        "owner_ids": owner_ids,
        "organization": organization,
        "organization_id": organization_id,
        "organization_key": organization_key,
    }


def _student_visible_to_scope(student: dict[str, Any], scope: dict[str, Any]) -> bool:
    if scope.get("is_super_admin"):
        return True

    owner_ids = scope.get("owner_ids") or []
    student_creator = str(student.get("created_by") or "").strip()
    if student_creator and student_creator in owner_ids:
        return True

    metadata = _safe_metadata(student.get("metadata"))
    student_org_id = _extract_org_id(metadata)
    student_org_key = _extract_org_key(metadata)
    student_org_name = _extract_org_name(metadata)

    scope_org_id = str(scope.get("organization_id") or "").strip()
    scope_org_key = str(scope.get("organization_key") or "").strip()
    scope_org_name = _normalize_org_name(scope.get("organization"))

    if scope_org_id and student_org_id == scope_org_id:
        return True
    if scope_org_key and student_org_key == scope_org_key:
        return True
    if scope_org_name and student_org_name == scope_org_name:
        return True

    return False


def build_student_metadata(scope: dict[str, Any], imported_by_email: str | None = None) -> dict[str, Any]:
    metadata: dict[str, Any] = {}
    organization = _normalize_org_name(scope.get("organization"))
    organization_id = str(scope.get("organization_id") or "").strip()
    organization_key = str(scope.get("organization_key") or "").strip()

    if organization:
        metadata["organization"] = organization
    if organization_id:
        metadata["organization_id"] = organization_id
    if organization_key:
        metadata["organization_key"] = organization_key
    if imported_by_email:
        metadata["imported_by_email"] = imported_by_email.strip().lower()

    return metadata


def list_students(auth_user_id: str | None = None, auth_email: str | None = None) -> List[Dict[str, Any]]:
    """
    List students visible to the authenticated user's organization.

    Filters students using three paths with deduplication:
    1. DB filter by organization_id (multi-tenant isolation)
    2. DB filter by created_by — ALWAYS runs (covers users without organization_id)
    3. Full scan + Python filter (legacy metadata-only records)

    Returns only students that belong to the current user's organization.
    """
    scope = resolve_student_scope(auth_user_id, auth_email)
    organization_id = str(scope.get("organization_id") or "").strip()
    owner_ids = [oid for oid in (scope.get("owner_ids") or []) if oid]

    # Super admins see all students
    if scope.get("is_super_admin"):
        try:
            return _rows(supabase.table("students").select("*").execute())
        except Exception:
            return []

    seen_ids: set[str] = set()
    result: list[dict[str, Any]] = []

    def _add(s):
        sid = str(s.get("id") or "")
        if sid and sid not in seen_ids:
            seen_ids.add(sid)
            result.append(s)

    # Path 1: DB filter by organization_id
    if organization_id:
        try:
            q = supabase.table("students").select("*").eq("organization_id", organization_id)
            if owner_ids:
                q = q.in_("created_by", owner_ids)
            for s in _rows(q.execute()):
                _add(s)
        except Exception:
            pass

    # Path 2: DB filter by created_by — ALWAYS run (covers no-org-id users)
    if owner_ids:
        try:
            for s in _rows(
                supabase.table("students").select("*").in_("created_by", owner_ids).execute()
            ):
                _add(s)
        except Exception:
            pass

    # Path 3: Full scan + Python filter (legacy metadata-only records)
    try:
        for s in _rows(supabase.table("students").select("*").execute()):
            if _student_visible_to_scope(s, scope):
                _add(s)
    except Exception:
        pass

    return result





def insert_students_bulk(students: List[Dict[str, Any]]):
    # Use the insert_table helper which uses supabase.insert
    data, err = insert_table("students", students)
    if err:
        raise RuntimeError(err)
    return data


def parse_students_csv(content: bytes):
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for r in reader:
        rows.append({
            "email": r.get("email") or r.get("Email") or None,
            "full_name": r.get("full_name") or r.get("name") or r.get("Name") or None,
            "external_id": r.get("id") or r.get("external_id") or None,
            "metadata": {},
        })
    return rows
