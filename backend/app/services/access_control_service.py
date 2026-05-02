from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException

from app.core.supabase_client import supabase

SUPER_ADMIN_EMAIL = "certifyprocare@gmail.com"
ALL_COMPONENT_PERMISSIONS = [
    "dashboard",
    "templates",
    "import_students",
    "generate",
    "registry",
    "access_control",
]
ASSIGNABLE_COMPONENT_PERMISSIONS = [
    "dashboard",
    "templates",
    "import_students",
    "generate",
    "registry",
]


@dataclass
class AuthIdentity:
    auth_user_id: str
    email: str
    full_name: str | None = None
    organization: str | None = None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _rows(resp: Any) -> list[dict[str, Any]]:
    return resp.data if hasattr(resp, "data") and resp.data else []


def _single(resp: Any) -> dict[str, Any] | None:
    rows = _rows(resp)
    return rows[0] if rows else None


def _safe_metadata(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _safe_access_control(metadata: dict[str, Any]) -> dict[str, Any]:
    access_control = metadata.get("access_control")
    return access_control if isinstance(access_control, dict) else {}


def _normalize_org_name(value: str | None) -> str:
    if not value or not isinstance(value, str):
        return ""
    return " ".join(value.strip().split())


def _get_canonical_organization(metadata: dict[str, Any]) -> str:
    """Single source of truth for org name — reads in priority order."""
    ac = metadata.get("access_control") or {}
    profile = metadata.get("profile") or {}
    return (
        ac.get("organization_name")
        or profile.get("organization")
        or profile.get("institution_name")
        or metadata.get("organization")
        or ""
    ).strip()


def _organization_key(value: str | None) -> str:
    normalized = _normalize_org_name(value).lower()
    if not normalized:
        return ""
    return "".join(ch for ch in normalized if ch.isalnum())


def _extract_organization_id(metadata: dict[str, Any]) -> str:
    access_control = _safe_access_control(metadata)
    profile = metadata.get("profile") if isinstance(metadata.get("profile"), dict) else {}
    org_id = (
        access_control.get("organization_id")
        or metadata.get("organization_id")
        or profile.get("organization_id")
    )
    return str(org_id).strip() if org_id else ""


def _extract_profile_org(metadata: dict[str, Any]) -> str:
    """Legacy helper — now uses _get_canonical_organization."""
    return _get_canonical_organization(metadata)


def _resolve_identity_org(identity: AuthIdentity, metadata: dict[str, Any]) -> str:
    existing_org = _extract_profile_org(metadata)
    if existing_org:
        return existing_org

    hinted_org = _normalize_org_name(identity.organization)
    if hinted_org:
        return hinted_org

    try:
        response = (
            supabase.table("access_requests")
            .select("organization")
            .ilike("email", identity.email.strip().lower())
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        row = _single(response)
        if row:
            return _normalize_org_name(row.get("organization"))
    except Exception:
        pass

    return ""


def _merge_org_metadata(metadata: dict[str, Any], organization: str) -> dict[str, Any]:
    if not organization:
        return metadata

    profile = metadata.get("profile") if isinstance(metadata.get("profile"), dict) else {}
    return {
        **metadata,
        "organization": organization,
        "profile": {
            **profile,
            "organization": organization,
            "institution_name": profile.get("institution_name") or organization,
        },
    }


def _merge_org_id_metadata(metadata: dict[str, Any], organization_id: str | None) -> dict[str, Any]:
    if not organization_id:
        return metadata

    profile = metadata.get("profile") if isinstance(metadata.get("profile"), dict) else {}
    return {
        **metadata,
        "organization_id": organization_id,
        "profile": {
            **profile,
            "organization_id": organization_id,
        },
    }


def _resolve_or_create_organization(organization: str) -> tuple[str, str] | None:
    normalized_org = _normalize_org_name(organization)
    org_key = _organization_key(normalized_org)
    if not normalized_org or not org_key:
        return None

    try:
        response = (
            supabase.table("organizations")
            .select("id, name, organization_key")
            .eq("organization_key", org_key)
            .limit(1)
            .execute()
        )
        existing = _single(response)
        if existing and existing.get("id"):
            return str(existing.get("id")), _normalize_org_name(existing.get("name") or normalized_org)

        insert_resp = (
            supabase.table("organizations")
            .insert({"name": normalized_org, "organization_key": org_key})
            .execute()
        )
        inserted = _single(insert_resp)
        if inserted and inserted.get("id"):
            return str(inserted.get("id")), _normalize_org_name(inserted.get("name") or normalized_org)
    except Exception:
        # Handle race conditions or unique conflicts by reading the existing row.
        try:
            retry_resp = (
                supabase.table("organizations")
                .select("id, name, organization_key")
                .eq("organization_key", org_key)
                .limit(1)
                .execute()
            )
            existing = _single(retry_resp)
            if existing and existing.get("id"):
                return str(existing.get("id")), _normalize_org_name(existing.get("name") or normalized_org)
        except Exception:
            return None

    return None


def _display_name(email: str, full_name: str | None = None) -> str:
    if full_name and full_name.strip():
        return full_name.strip()
    local = (email.split("@", 1)[0] if "@" in email else email).replace(".", " ").replace("_", " ").strip()
    return local.title() if local else email


def _normalize_permissions(member_type: str, permissions: Any) -> list[str]:
    if member_type in {"super_admin", "admin"}:
        return list(ALL_COMPONENT_PERMISSIONS)

    if not isinstance(permissions, list):
        return []

    normalized: list[str] = []
    for permission in permissions:
        if permission in ASSIGNABLE_COMPONENT_PERMISSIONS and permission not in normalized:
            normalized.append(permission)
    return normalized


def _merge_access_control_metadata(
    metadata: dict[str, Any],
    *,
    member_type: str,
    status: str,
    permissions: list[str],
    invited_by_user_id: str | None,
    invited_by_email: str | None,
    organization_key: str | None = None,
    organization_id: str | None = None,
    existing_access_control: dict[str, Any] | None = None,
) -> dict[str, Any]:
    existing = existing_access_control or {}
    next_access_control = {
        **existing,
        "member_type": member_type,
        "status": status,
        "permissions": permissions,
        "invited_by_user_id": invited_by_user_id or existing.get("invited_by_user_id"),
        "invited_by_email": invited_by_email or existing.get("invited_by_email"),
        "organization_key": organization_key or existing.get("organization_key"),
        "organization_id": organization_id or existing.get("organization_id"),
        "updated_at": _now_iso(),
    }
    if not existing.get("created_at"):
        next_access_control["created_at"] = _now_iso()
    if status == "removed":
        next_access_control["removed_at"] = _now_iso()
    elif next_access_control.get("removed_at"):
        next_access_control.pop("removed_at", None)

    return {
        **metadata,
        "access_control": next_access_control,
    }


def _fetch_app_user_by_auth_or_email(auth_user_id: str | None, email: str | None) -> dict[str, Any] | None:
    if auth_user_id:
        try:
            response = (
                supabase.table("app_users")
                .select("*")
                .eq("auth_uid", auth_user_id)
                .limit(1)
                .execute()
            )
            row = _single(response)
            if row:
                return row
        except Exception:
            pass

    if email:
        try:
            response = (
                supabase.table("app_users")
                .select("*")
                .ilike("email", email)
                .limit(1)
                .execute()
            )
            row = _single(response)
            if row:
                return row
        except Exception:
            pass

    return None


def _fetch_app_user_by_id(app_user_id: str | None) -> dict[str, Any] | None:
    if not app_user_id:
        return None

    try:
        response = (
            supabase.table("app_users")
            .select("*")
            .eq("id", app_user_id)
            .limit(1)
            .execute()
        )
        return _single(response)
    except Exception:
        return None


def _persist_app_user(existing_row: dict[str, Any] | None, payload: dict[str, Any]) -> dict[str, Any]:
    if existing_row and existing_row.get("id"):
        (
            supabase.table("app_users")
            .update(payload)
            .eq("id", existing_row["id"])
            .execute()
        )
        row = _fetch_app_user_by_id(existing_row["id"])
        return row or {**existing_row, **payload}

    response = supabase.table("app_users").insert(payload).execute()
    row = _single(response)
    if row and row.get("id"):
        refreshed_row = _fetch_app_user_by_id(row.get("id"))
        if refreshed_row:
            return refreshed_row

    if not row and (payload.get("auth_uid") or payload.get("email")):
        row = _fetch_app_user_by_auth_or_email(payload.get("auth_uid"), payload.get("email"))

    if not row:
        raise HTTPException(status_code=500, detail="Failed to create access control member.")
    return row


def _serialize_member(row: dict[str, Any], current_auth_user_id: str | None = None) -> dict[str, Any]:
    metadata = _safe_metadata(row.get("metadata"))
    access_control = _safe_access_control(metadata)
    email = (row.get("email") or "").lower()
    organization = _extract_profile_org(metadata)
    organization_id = _extract_organization_id(metadata)
    organization_key = access_control.get("organization_key") or _organization_key(organization)
    member_type = access_control.get("member_type") or ("super_admin" if email == SUPER_ADMIN_EMAIL else "admin")
    status = access_control.get("status") or ("active" if row.get("auth_uid") else "invited")
    permissions = _normalize_permissions(member_type, access_control.get("permissions"))
    return {
        "id": row.get("id") or email,
        "app_user_id": row.get("id"),
        "auth_user_id": row.get("auth_uid"),
        "name": "CERTIFYPRO" if email == SUPER_ADMIN_EMAIL else _display_name(email, row.get("full_name")),
        "email": email,
        "member_type": member_type,
        "status": status,
        "permissions": permissions,
        "organization": organization,
        "organization_id": organization_id,
        "organization_key": organization_key,
        "joined_at": row.get("created_at") or access_control.get("created_at"),
        "invited_by_email": access_control.get("invited_by_email"),
        "is_current_user": bool(current_auth_user_id and row.get("auth_uid") == current_auth_user_id),
    }


def build_fallback_overview(identity: AuthIdentity) -> dict[str, Any]:
    email = identity.email.strip().lower()
    is_super_admin = email == SUPER_ADMIN_EMAIL

    current_actor = {
        "id": identity.auth_user_id or email,
        "app_user_id": None,
        "auth_user_id": identity.auth_user_id,
        "name": "CERTIFYPRO" if is_super_admin else _display_name(email, identity.full_name),
        "email": email,
        "member_type": "super_admin" if is_super_admin else "admin",
        "status": "active",
        "permissions": list(ALL_COMPONENT_PERMISSIONS),
        "joined_at": None,
        "invited_by_email": None,
        "is_current_user": True,
    }

    members = [
        {
            "id": "super-admin",
            "app_user_id": None,
            "auth_user_id": None,
            "name": "CERTIFYPRO",
            "email": SUPER_ADMIN_EMAIL,
            "member_type": "super_admin",
            "status": "active",
            "permissions": list(ALL_COMPONENT_PERMISSIONS),
            "joined_at": None,
            "invited_by_email": None,
            "is_current_user": is_super_admin,
        }
    ]
    if email and email != SUPER_ADMIN_EMAIL:
        members.append(current_actor)

    return {
        "current_actor": current_actor,
        "members": members,
        "permission_catalog": [
            {"key": "dashboard", "label": "Dashboard", "description": "View operational overview and live status."},
            {"key": "templates", "label": "Templates", "description": "Manage official and workspace templates."},
            {"key": "import_students", "label": "Import Students", "description": "Import and validate student batches."},
            {"key": "generate", "label": "Generate", "description": "Generate certificates in bulk."},
            {"key": "registry", "label": "Registry", "description": "Review certificate registry and downloads."},
            {"key": "access_control", "label": "Access Control", "description": "Manage admin and co-admin access."},
        ],
    }


def _send_auth_invite_email(
    email: str,
    *,
    redirect_to: str,
    member_type: str,
    permissions: list[str],
) -> tuple[bool, str]:
    try:
        supabase.auth.admin.invite_user_by_email(
            email,
            {
                "redirect_to": redirect_to,
                "data": {
                    "first_login_required": True,
                    "invited_member_type": member_type,
                    "invited_permissions": permissions,
                },
            },
        )
        return True, "invite_sent"
    except Exception as exc:
        message = str(exc).lower()
        if "already been registered" in message or "already registered" in message or "user already exists" in message:
            return False, "existing_user"
        raise HTTPException(
            status_code=503,
            detail="Access was saved, but the invite email could not be sent. Check Supabase Auth email configuration and outbound connectivity.",
        ) from exc


def ensure_actor_membership(identity: AuthIdentity) -> dict[str, Any]:
    email = identity.email.strip().lower()
    existing_row = _fetch_app_user_by_auth_or_email(identity.auth_user_id, email)
    metadata = _safe_metadata((existing_row or {}).get("metadata"))
    access_control = _safe_access_control(metadata)
    actor_org = _resolve_identity_org(identity, metadata)
    actor_org_record = _resolve_or_create_organization(actor_org)
    if actor_org_record:
        actor_org_id, canonical_org_name = actor_org_record
        actor_org = canonical_org_name
    else:
        # FIX: Always try to extract organization_id from metadata, but also fetch
        # it directly from the organizations table using the org name if metadata is empty
        actor_org_id = _extract_organization_id(metadata)
        if not actor_org_id and actor_org:
            # Try fetching the organization record using the org name
            org_record = _resolve_or_create_organization(actor_org)
            if org_record:
                actor_org_id, _ = org_record
    actor_org_key = _organization_key(actor_org)

    if email == SUPER_ADMIN_EMAIL:
        member_type = "super_admin"
        status = "active"
        permissions = list(ALL_COMPONENT_PERMISSIONS)
        role = "super_admin"
        full_name = "CERTIFYPRO"
    else:
        existing_type = access_control.get("member_type")
        existing_status = access_control.get("status")
        member_type = existing_type if existing_type in {"admin", "co_admin"} else "admin"
        status = existing_status if existing_status == "removed" else "active"
        permissions = _normalize_permissions(member_type, access_control.get("permissions"))
        if member_type == "co_admin" and not permissions:
            permissions = ["dashboard", "registry"]
        role = "user" if status == "removed" else "admin"
        full_name = existing_row.get("full_name") if existing_row else identity.full_name

    payload = {
        "auth_uid": identity.auth_user_id,
        "email": email,
        "role": role,
        "full_name": full_name or _display_name(email, identity.full_name),
        "metadata": _merge_access_control_metadata(
            _merge_org_id_metadata(_merge_org_metadata(metadata, actor_org), actor_org_id),
            member_type=member_type,
            status=status,
            permissions=permissions,
            invited_by_user_id=access_control.get("invited_by_user_id"),
            invited_by_email=access_control.get("invited_by_email"),
            organization_key=actor_org_key,
            organization_id=actor_org_id,
            existing_access_control=access_control,
        ),
    }

    return _persist_app_user(existing_row, payload)


def get_access_control_overview(identity: AuthIdentity) -> dict[str, Any]:
    actor_row = ensure_actor_membership(identity)
    actor_member = _serialize_member(actor_row, identity.auth_user_id)
    actor_email = identity.email.strip().lower()
    actor_org_key = actor_member.get("organization_key") or ""

    response = supabase.table("app_users").select("id, auth_uid, email, role, full_name, metadata, created_at").execute()
    rows = _rows(response)

    members: list[dict[str, Any]] = []
    seen_emails: set[str] = set()
    for row in rows:
        email = str(row.get("email") or "").lower()
        if not email:
            continue
        metadata = _safe_metadata(row.get("metadata"))
        access_control = _safe_access_control(metadata)
        if email != SUPER_ADMIN_EMAIL and row.get("role") not in {"admin", "super_admin"} and not access_control.get("member_type"):
            continue

        member = _serialize_member(row, identity.auth_user_id)
        if member["status"] == "removed":
            continue
        if actor_email != SUPER_ADMIN_EMAIL and email != SUPER_ADMIN_EMAIL:
            member_org_key = member.get("organization_key") or ""
            if not actor_org_key and not member.get("is_current_user"):
                continue
            if actor_org_key and member_org_key and member_org_key != actor_org_key:
                continue
            if actor_org_key and not member_org_key and not member.get("is_current_user"):
                continue
        if member["email"] in seen_emails:
            continue
        seen_emails.add(member["email"])
        members.append(member)

    if SUPER_ADMIN_EMAIL not in seen_emails:
        members.append(
            {
                "id": "super-admin",
                "app_user_id": None,
                "auth_user_id": None,
                "name": "CERTIFYPRO",
                "email": SUPER_ADMIN_EMAIL,
                "member_type": "super_admin",
                "status": "active",
                "permissions": list(ALL_COMPONENT_PERMISSIONS),
                "joined_at": None,
                "invited_by_email": None,
                "is_current_user": identity.email.strip().lower() == SUPER_ADMIN_EMAIL,
            }
        )

    members.sort(key=lambda member: (member["member_type"] != "super_admin", member["email"]))

    return {
        "current_actor": actor_member,
        "members": members,
        "permission_catalog": [
            {"key": "dashboard", "label": "Dashboard", "description": "View operational overview and live status."},
            {"key": "templates", "label": "Templates", "description": "Manage official and workspace templates."},
            {"key": "import_students", "label": "Import Students", "description": "Import and validate student batches."},
            {"key": "generate", "label": "Generate", "description": "Generate certificates in bulk."},
            {"key": "registry", "label": "Registry", "description": "Review certificate registry and downloads."},
            {"key": "access_control", "label": "Access Control", "description": "Manage admin and co-admin access."},
        ],
    }


def _require_manage_access(actor_member: dict[str, Any]) -> None:
    if actor_member.get("status") != "active":
        raise HTTPException(status_code=403, detail="Your administrator access has been removed.")
    if actor_member.get("member_type") not in {"super_admin", "admin"}:
        raise HTTPException(status_code=403, detail="Only admins can manage access control.")


def _load_member_by_email(email: str) -> dict[str, Any] | None:
    return _fetch_app_user_by_auth_or_email(None, email.strip().lower())


def invite_member(
    actor_identity: AuthIdentity,
    *,
    invite_email: str,
    target_member_type: str,
    permissions: list[str],
    redirect_to: str,
) -> dict[str, Any]:
    overview = get_access_control_overview(actor_identity)
    actor_member = overview["current_actor"]
    _require_manage_access(actor_member)

    actor_type = actor_member["member_type"]
    actor_org = _normalize_org_name(actor_member.get("organization"))
    actor_org_id = str(actor_member.get("organization_id") or "").strip()
    actor_org_key = actor_member.get("organization_key") or _organization_key(actor_org)
    invite_email = invite_email.strip().lower()
    if invite_email == SUPER_ADMIN_EMAIL and actor_type != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin email is reserved.")
    if target_member_type not in {"admin", "co_admin"}:
        raise HTTPException(status_code=400, detail="Invalid member type.")
    if actor_type == "admin" and target_member_type != "co_admin":
        raise HTTPException(status_code=403, detail="Admins can invite only co-admins.")
    if invite_email == actor_identity.email.strip().lower():
        raise HTTPException(status_code=400, detail="Use your current account instead of inviting yourself.")

    existing_row = _load_member_by_email(invite_email)
    metadata = _safe_metadata((existing_row or {}).get("metadata"))
    access_control = _safe_access_control(metadata)
    existing_org_id = _extract_organization_id(metadata)
    existing_org_key = access_control.get("organization_key") or _organization_key(_extract_profile_org(metadata))

    if actor_type != "super_admin" and not actor_org_key:
        raise HTTPException(status_code=400, detail="Your account is missing organization mapping. Complete access request/profile setup first.")
    if actor_type != "super_admin" and not actor_org_id:
        raise HTTPException(status_code=400, detail="Your account organization ID is missing. Re-login or complete profile bootstrap.")
    if actor_type != "super_admin" and existing_row and existing_org_key and existing_org_key != actor_org_key:
        raise HTTPException(status_code=403, detail="Cannot invite members from another organization.")
    if actor_type != "super_admin" and existing_row and existing_org_id and existing_org_id != actor_org_id:
        raise HTTPException(status_code=403, detail="Cannot invite members from another organization.")
    if actor_type == "super_admin" and not actor_org and existing_row:
        actor_org = _extract_profile_org(metadata)
        actor_org_key = existing_org_key or actor_org_key
        actor_org_id = existing_org_id or actor_org_id

    if actor_org and not actor_org_id:
        actor_org_record = _resolve_or_create_organization(actor_org)
        if actor_org_record:
            actor_org_id, canonical_org_name = actor_org_record
            actor_org = canonical_org_name
            actor_org_key = _organization_key(canonical_org_name)

    normalized_permissions = _normalize_permissions(target_member_type, permissions)
    if target_member_type == "co_admin" and not normalized_permissions:
        raise HTTPException(status_code=400, detail="Select at least one component permission for a co-admin.")

    payload = {
        "email": invite_email,
        "role": "admin" if target_member_type in {"admin", "co_admin"} else "user",
        "full_name": (existing_row or {}).get("full_name") or _display_name(invite_email),
        "metadata": _merge_access_control_metadata(
            _merge_org_id_metadata(_merge_org_metadata(metadata, actor_org), actor_org_id),
            member_type=target_member_type,
            status="active" if (existing_row or {}).get("auth_uid") else "invited",
            permissions=normalized_permissions,
            invited_by_user_id=actor_identity.auth_user_id,
            invited_by_email=actor_identity.email,
            organization_key=actor_org_key,
            organization_id=actor_org_id,
            existing_access_control=access_control,
        ),
    }
    if existing_row and existing_row.get("auth_uid"):
        payload["auth_uid"] = existing_row.get("auth_uid")

    member_row = _persist_app_user(existing_row, payload)
    member = _serialize_member(member_row, actor_identity.auth_user_id)

    email_sent = False
    email_status = "not_needed"
    if member["status"] == "invited":
        email_sent, email_status = _send_auth_invite_email(
            invite_email,
            redirect_to=redirect_to,
            member_type=target_member_type,
            permissions=normalized_permissions,
        )

    return {
        "member": member,
        "email_sent": email_sent,
        "email_status": email_status,
    }


def update_member_permissions(
    actor_identity: AuthIdentity,
    *,
    member_id: str,
    permissions: list[str],
) -> dict[str, Any]:
    overview = get_access_control_overview(actor_identity)
    actor_member = overview["current_actor"]
    _require_manage_access(actor_member)

    member_row_resp = (
        supabase.table("app_users")
        .select("*")
        .eq("id", member_id)
        .limit(1)
        .execute()
    )
    member_row = _single(member_row_resp)
    if not member_row:
        raise HTTPException(status_code=404, detail="Member not found.")

    member = _serialize_member(member_row)
    actor_type = actor_member.get("member_type")
    actor_org_key = actor_member.get("organization_key") or ""
    member_org_key = member.get("organization_key") or ""
    if actor_type != "super_admin" and not actor_org_key:
        raise HTTPException(status_code=403, detail="Your account organization is not configured.")
    if actor_type != "super_admin" and actor_org_key and member_org_key and actor_org_key != member_org_key:
        raise HTTPException(status_code=403, detail="Cannot manage members outside your organization.")
    if member["email"] == SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Super admin permissions are fixed.")
    if member["member_type"] != "co_admin":
        raise HTTPException(status_code=400, detail="Permissions are managed only for co-admins.")

    normalized_permissions = _normalize_permissions("co_admin", permissions)
    if not normalized_permissions:
        raise HTTPException(status_code=400, detail="Select at least one component permission.")

    metadata = _safe_metadata(member_row.get("metadata"))
    access_control = _safe_access_control(metadata)
    updated_row = _persist_app_user(
        member_row,
        {
            "metadata": _merge_access_control_metadata(
                metadata,
                member_type="co_admin",
                status=member["status"],
                permissions=normalized_permissions,
                invited_by_user_id=access_control.get("invited_by_user_id"),
                invited_by_email=access_control.get("invited_by_email"),
                organization_key=access_control.get("organization_key") or member_org_key,
                organization_id=access_control.get("organization_id") or _extract_organization_id(metadata),
                existing_access_control=access_control,
            ),
        },
    )
    return _serialize_member(updated_row, actor_identity.auth_user_id)


def remove_member(actor_identity: AuthIdentity, *, member_id: str) -> dict[str, Any]:
    overview = get_access_control_overview(actor_identity)
    actor_member = overview["current_actor"]
    _require_manage_access(actor_member)

    member_row_resp = (
        supabase.table("app_users")
        .select("*")
        .eq("id", member_id)
        .limit(1)
        .execute()
    )
    member_row = _single(member_row_resp)
    if not member_row:
        raise HTTPException(status_code=404, detail="Member not found.")

    member = _serialize_member(member_row)
    actor_type = actor_member["member_type"]
    actor_org_key = actor_member.get("organization_key") or ""
    member_org_key = member.get("organization_key") or ""
    if actor_type != "super_admin" and not actor_org_key:
        raise HTTPException(status_code=403, detail="Your account organization is not configured.")
    if actor_type != "super_admin" and actor_org_key and member_org_key and actor_org_key != member_org_key:
        raise HTTPException(status_code=403, detail="Cannot remove members outside your organization.")
    if member["email"] == SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Super admin cannot be removed.")
    if member["is_current_user"]:
        raise HTTPException(status_code=400, detail="Use another administrator account to remove your own access.")
    if actor_type == "admin" and member["member_type"] != "co_admin":
        raise HTTPException(status_code=403, detail="Admins can remove only co-admins.")

    metadata = _safe_metadata(member_row.get("metadata"))
    access_control = _safe_access_control(metadata)
    updated_row = _persist_app_user(
        member_row,
        {
            "role": "user",
            "metadata": _merge_access_control_metadata(
                metadata,
                member_type=member["member_type"],
                status="removed",
                permissions=[],
                invited_by_user_id=access_control.get("invited_by_user_id"),
                invited_by_email=access_control.get("invited_by_email"),
                organization_key=access_control.get("organization_key") or member_org_key,
                organization_id=access_control.get("organization_id") or _extract_organization_id(metadata),
                existing_access_control=access_control,
            ),
        },
    )
    return _serialize_member(updated_row, actor_identity.auth_user_id)