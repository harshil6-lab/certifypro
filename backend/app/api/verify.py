"""Public certificate verification endpoint.

GET /api/verify/{certificate_id}

Queries the public_certificate_info table (populated at generation time) and
returns the certificate's public details.  No authentication required.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.supabase_client import supabase

router = APIRouter(prefix="/api/verify", tags=["Verify"])


class CertificateVerification(BaseModel):
    certificate_id: str
    student_name: str
    email: str
    issued_date: str | None
    status: str


@router.get("/{certificate_id}", response_model=CertificateVerification)
def get_verify_certificate(certificate_id: str) -> CertificateVerification:
    """Look up a certificate by ID from the public_certificate_info table.

    Returns:
        student_name, email, certificate_id, issued_date, status

    Raises:
        404 if no matching certificate is found.
        500 on unexpected database errors.
    """
    try:
        resp = (
            supabase.table("public_certificate_info")
            .select("*")
            .eq("certificate_id", certificate_id)
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

    return CertificateVerification(
        certificate_id=row.get("certificate_id", certificate_id),
        student_name=row.get("student_name", ""),
        email=row.get("email", ""),
        issued_date=row.get("issued_date") or row.get("created_at"),
        status=row.get("status", "issued"),
    )
