"""Public certificate verification endpoint.

GET /verify/{certificate_id}

Queries the students table by external_id and returns the imported student's
public certificate details. No authentication required.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.supabase_client import supabase

router = APIRouter(tags=["Verify"])


class CertificateVerification(BaseModel):
    valid: bool
    full_name: str
    email: str
    external_id: str
    organization_name: str
    created_at: str | None
    status: str


@router.get("/verify/{certificate_id}", response_model=CertificateVerification)
def get_verify_certificate(certificate_id: str) -> CertificateVerification:
    """Look up a certificate by external_id from the students table.

    Returns:
        full_name, email, external_id, created_at, status

    Raises:
        404 if no matching certificate is found.
        500 on unexpected database errors.
    """
    try:
        resp = (
            supabase.table("students")
            .select("full_name, email, external_id, organization_id, metadata, created_at")
            .eq("external_id", certificate_id)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Database error while verifying certificate: {exc}",
        )

    rows = resp.data if hasattr(resp, "data") else []

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"Certificate '{certificate_id}' not found.",
        )

    row = rows[0]

    metadata = row.get("metadata", {}) if row.get("metadata") else {}
    org_id = row.get("organization_id")
    org_name = ""
    if isinstance(metadata, dict):
        org_name = metadata.get("organization", "")
    if not org_name and org_id:
        try:
            org_resp = supabase.table("organizations").select("name").eq("id", org_id).single().execute()
            org_row = org_resp.data if hasattr(org_resp, "data") else {}
            org_name = org_row.get("name", "") if org_row else ""
        except:
            org_name = ""
    
    return CertificateVerification(
        valid=True,
        full_name=row.get("full_name", ""),
        email=row.get("email", ""),
        external_id=row.get("external_id", certificate_id),
        organization_name=org_name,
        created_at=row.get("created_at"),
        status="valid",
    )
