from typing import Any, Dict, Optional
from ._supabase_helpers import select_where


def verify_by_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify a certificate by QR token and return certificate details.
    
    Looks up the certificate in the certificates table by qr_token.
    Returns only the verification-relevant fields:
    - valid: boolean indicating if certificate is issued and valid
    - template_id: UUID of the certificate template
    - student_id: UUID of the student
    - issued_at: timestamp when certificate was issued
    - status: certificate status (issued/revoked)
    
    Returns None if certificate not found.
    """
    data, err = select_where("certificates", {"qr_token": token})
    if err:
        raise RuntimeError(f"Error verifying certificate: {err}")
    
    if not data:
        return None
    
    # Extract first result if list
    cert = None
    if isinstance(data, list):
        if data:
            cert = data[0]
    elif isinstance(data, dict):
        cert = data
    
    if not cert:
        return None
    
    # Build response with only the required fields
    return {
        "valid": cert.get("status") == "issued",
        "template_id": cert.get("template_id"),
        "student_id": cert.get("student_id"),
        "issued_at": cert.get("issued_at"),
        "status": cert.get("status"),
        "certificate_id": cert.get("id")
    }
