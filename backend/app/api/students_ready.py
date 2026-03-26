"""Student listing routes used by generation and registry pages."""

from typing import Any

from fastapi import APIRouter, HTTPException, Request
from app.core.supabase_client import supabase
from app.services.students_service import list_students
from app.services.auth_service import get_current_user
from app.services.generated_certificate_retention_service import (
    cleanup_expired_generated_certificate_files,
    is_generated_certificate_expired,
)

router = APIRouter(prefix="/api", tags=["Students"])


def _extract_user_id(user: Any) -> str | None:
    if user is None:
        return None
    if isinstance(user, dict):
        return user.get("id")
    inner = getattr(user, "user", None)
    if inner is not None:
        return getattr(inner, "id", None)
    return getattr(user, "id", None)


def _extract_user_email(user: Any) -> str | None:
    if user is None:
        return None
    if isinstance(user, dict):
        nested = user.get("user")
        if isinstance(nested, dict) and nested.get("email"):
            return nested.get("email")
        return user.get("email")
    inner = getattr(user, "user", None)
    if inner is not None:
        return getattr(inner, "email", None)
    return getattr(user, "email", None)


def _resolve_app_user_ids(auth_user_id: str | None, auth_email: str | None) -> list[str]:
    resolved_ids: list[str] = []

    def _append(value: str | None) -> None:
        if value and value not in resolved_ids:
            resolved_ids.append(value)

    _append(auth_user_id)

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
                .select("id, auth_uid, email")
                .eq(column, value)
                .execute()
            )
        except Exception:
            continue

        rows = resp.data if hasattr(resp, "data") and resp.data else []
        for row in rows:
            _append(row.get("id"))
            _append(row.get("auth_uid"))

    return resolved_ids


def _resolve_template_ids(auth_user_id: str | None, owner_ids: list[str]) -> list[str]:
    template_ids: list[str] = []

    def _append(value: str | None) -> None:
        if value and value not in template_ids:
            template_ids.append(value)

    if auth_user_id:
        try:
            workspace_resp = (
                supabase.table("workspace_templates")
                .select("template_id")
                .eq("user_id", auth_user_id)
                .execute()
            )
            workspace_rows = workspace_resp.data if hasattr(workspace_resp, "data") and workspace_resp.data else []
            for row in workspace_rows:
                _append(row.get("template_id"))
        except Exception:
            pass

    for owner_id in owner_ids:
        try:
            template_resp = (
                supabase.table("templates")
                .select("id")
                .eq("created_by", owner_id)
                .execute()
            )
            template_rows = template_resp.data if hasattr(template_resp, "data") and template_resp.data else []
            for row in template_rows:
                _append(row.get("id"))
        except Exception:
            continue

    return template_ids


def _group_latest_certificate_by_student(
    certificate_rows: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    latest_by_student: dict[str, dict[str, Any]] = {}
    for row in certificate_rows:
        student_id = row.get("student_id")
        if not student_id:
            continue

        previous = latest_by_student.get(student_id)
        previous_stamp = (previous or {}).get("issued_at") or (previous or {}).get("created_at") or ""
        current_stamp = row.get("issued_at") or row.get("created_at") or ""
        if previous is None or str(current_stamp) >= str(previous_stamp):
            latest_by_student[student_id] = row

    return latest_by_student


def _normalize_registry_rows(
    generated_rows: list[dict[str, Any]],
    certificate_rows: list[dict[str, Any]],
    students_by_id: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    certificates: list[dict[str, Any]] = []
    seen_keys: set[str] = set()
    latest_certificate_by_student = _group_latest_certificate_by_student(certificate_rows)

    for generated in generated_rows:
        student_id = generated.get("student_id")
        student = students_by_id.get(student_id) or {}
        certificate_row = latest_certificate_by_student.get(student_id) or {}
        certificate_id = generated.get("certificate_id") or student.get("external_id") or ""
        is_expired = is_generated_certificate_expired(generated.get("created_at"))
        row_key = str(generated.get("id") or certificate_id or student_id or "")
        if row_key and row_key in seen_keys:
            continue
        if row_key:
            seen_keys.add(row_key)

        certificates.append(
            {
                "id": generated.get("id"),
                "template_id": generated.get("template_id"),
                "full_name": generated.get("student_name") or student.get("full_name") or "",
                "email": student.get("email") or "",
                "external_id": certificate_id,
                "created_at": generated.get("created_at") or certificate_row.get("issued_at") or certificate_row.get("created_at"),
                "status": "archived" if is_expired else (certificate_row.get("status") or generated.get("status") or "issued"),
                "download_url": None if is_expired else generated.get("file_url"),
                "verification_url": generated.get("verification_url") or certificate_row.get("qr_url"),
                "retention_note": "Certificate is removed after 1 week" if is_expired else None,
            }
        )

    for certificate_row in certificate_rows:
        student_id = certificate_row.get("student_id")
        student = students_by_id.get(student_id) or {}
        certificate_id = student.get("external_id") or str(certificate_row.get("id") or "")
        row_key = f"cert::{certificate_row.get('id') or certificate_id or student_id or ''}"
        if row_key in seen_keys:
            continue
        seen_keys.add(row_key)

        certificates.append(
            {
                "id": certificate_row.get("id"),
                "template_id": certificate_row.get("template_id"),
                "full_name": student.get("full_name") or "",
                "email": student.get("email") or "",
                "external_id": certificate_id,
                "created_at": certificate_row.get("issued_at") or certificate_row.get("created_at"),
                "status": certificate_row.get("status") or "inactive",
                "download_url": None,
                "verification_url": certificate_row.get("qr_url"),
                "retention_note": None,
            }
        )

    return sorted(
        certificates,
        key=lambda row: str(row.get("created_at") or ""),
        reverse=True,
    )


@router.get("/students-ready")
async def get_students_ready():
    """Return all students from the database as a flat array.

    Each entry contains: id, full_name, email, external_id (certificate_id), metadata.
    """
    try:
        students = list_students()
        return students  # plain list — frontend sets this directly via setStudents(res.data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/my-certificates")
async def get_my_certificates(request: Request):
    """Return all generated certificates for the authenticated user."""
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.split(" ", 1)[1] if auth_header.lower().startswith("bearer ") else None
    user = get_current_user(token) if token else None
    user_id = _extract_user_id(user)
    user_email = _extract_user_email(user)

    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        cleanup_expired_generated_certificate_files()

        owner_ids = _resolve_app_user_ids(user_id, user_email)
        template_ids = _resolve_template_ids(user_id, owner_ids)

        students: list[dict[str, Any]] = []
        for owner_id in owner_ids:
            try:
                resp = (
                    supabase.table("students")
                    .select("id, full_name, email, external_id, created_at")
                    .eq("created_by", owner_id)
                    .execute()
                )
            except Exception:
                continue

            rows = resp.data if hasattr(resp, "data") and resp.data else []
            students.extend(rows)

        deduped_students: dict[str, dict[str, Any]] = {}
        for student in students:
            student_id = student.get("id")
            if student_id:
                deduped_students[student_id] = student

        students = list(deduped_students.values())
        students_by_id = {student["id"]: student for student in students if student.get("id")}

        generated_rows: list[dict[str, Any]] = []
        certificate_rows: list[dict[str, Any]] = []

        for owner_id in owner_ids:
            try:
                direct_resp = (
                    supabase.table("generated_certificates")
                    .select("*")
                    .eq("created_by", owner_id)
                    .order("created_at", desc=True)
                    .execute()
                )
                generated_rows.extend(
                    direct_resp.data if hasattr(direct_resp, "data") and direct_resp.data else []
                )
            except Exception as exc:
                print(f"[my-certificates] Falling back to student-owned lookup: {exc}")

            try:
                cert_resp = (
                    supabase.table("certificates")
                    .select("id, template_id, student_id, issuer_id, qr_url, status, created_at, issued_at")
                    .eq("issuer_id", owner_id)
                    .order("issued_at", desc=True)
                    .execute()
                )
                certificate_rows.extend(
                    cert_resp.data if hasattr(cert_resp, "data") and cert_resp.data else []
                )
            except Exception as exc:
                print(f"[my-certificates] Issuer-owned certificate lookup failed: {exc}")

        if template_ids:
            try:
                template_generated_resp = (
                    supabase.table("generated_certificates")
                    .select("*")
                    .in_("template_id", template_ids)
                    .order("created_at", desc=True)
                    .execute()
                )
                generated_rows.extend(
                    template_generated_resp.data if hasattr(template_generated_resp, "data") and template_generated_resp.data else []
                )
            except Exception as exc:
                print(f"[my-certificates] Template-owned generated lookup failed: {exc}")

            try:
                template_cert_resp = (
                    supabase.table("certificates")
                    .select("id, template_id, student_id, issuer_id, qr_url, status, created_at, issued_at")
                    .in_("template_id", template_ids)
                    .order("issued_at", desc=True)
                    .execute()
                )
                certificate_rows.extend(
                    template_cert_resp.data if hasattr(template_cert_resp, "data") and template_cert_resp.data else []
                )
            except Exception as exc:
                print(f"[my-certificates] Template-owned certificate lookup failed: {exc}")

        if students:
            student_ids = [student_id for student_id in students_by_id]
            try:
                generated_resp = (
                    supabase.table("generated_certificates")
                    .select("*")
                    .in_("student_id", student_ids)
                    .order("created_at", desc=True)
                    .execute()
                )
                generated_rows.extend(
                    generated_resp.data if hasattr(generated_resp, "data") and generated_resp.data else []
                )
            except Exception as exc:
                print(f"[my-certificates] Student-owned generated lookup failed: {exc}")

            try:
                cert_resp = (
                    supabase.table("certificates")
                    .select("id, template_id, student_id, issuer_id, qr_url, status, created_at, issued_at")
                    .in_("student_id", student_ids)
                    .order("issued_at", desc=True)
                    .execute()
                )
                certificate_rows.extend(
                    cert_resp.data if hasattr(cert_resp, "data") and cert_resp.data else []
                )
            except Exception as exc:
                print(f"[my-certificates] Student-owned certificate lookup failed: {exc}")

        deduped_generated_rows: dict[str, dict[str, Any]] = {}
        for row in generated_rows:
            row_id = str(row.get("id") or row.get("certificate_id") or row.get("student_id") or "")
            if row_id:
                deduped_generated_rows[row_id] = row

        deduped_certificate_rows: dict[str, dict[str, Any]] = {}
        for row in certificate_rows:
            row_id = str(row.get("id") or "")
            if row_id:
                deduped_certificate_rows[row_id] = row

        missing_student_ids = {
            str(row.get("student_id"))
            for row in list(deduped_generated_rows.values()) + list(deduped_certificate_rows.values())
            if row.get("student_id") and str(row.get("student_id")) not in students_by_id
        }

        if missing_student_ids:
            try:
                missing_students_resp = (
                    supabase.table("students")
                    .select("id, full_name, email, external_id, created_at")
                    .in_("id", list(missing_student_ids))
                    .execute()
                )
                missing_students = (
                    missing_students_resp.data
                    if hasattr(missing_students_resp, "data") and missing_students_resp.data
                    else []
                )
                for student in missing_students:
                    student_id = student.get("id")
                    if student_id:
                        students_by_id[student_id] = student
            except Exception as exc:
                print(f"[my-certificates] Missing student lookup failed: {exc}")

        certificates = _normalize_registry_rows(
            list(deduped_generated_rows.values()),
            list(deduped_certificate_rows.values()),
            students_by_id,
        )

        return {"certificates": certificates}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch certificates: {exc}")
