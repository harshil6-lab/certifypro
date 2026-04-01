"""Certificate issuance pipeline service.

Handles creating certificates by looking up issuer, generating QR tokens,
and inserting certificate records into the database.
"""

from typing import Any, Dict, Optional
from uuid import uuid4
from ._supabase_helpers import select_where, insert_table
import logging

logger = logging.getLogger(__name__)


def lookup_issuer(issuer_auth_uid: str) -> Optional[Dict[str, Any]]:
    """Look up app_user by auth_uid.
    
    Returns the app_user record if found, None otherwise.
    """
    data, err = select_where("app_users", {"auth_uid": issuer_auth_uid})
    if err:
        logger.error(f"Error looking up issuer: {err}")
        return None
    
    if isinstance(data, list) and data:
        return data[0]
    elif isinstance(data, dict):
        return data
    
    return None


def generate_certificate(
    template_id: str,
    student_id: str,
    issuer_auth_uid: str
) -> str:
    """Generate a certificate for a student by an authenticated issuer.
    
    Flow:
    1. Look up issuer by auth_uid
    2. Create QR token using uuid4()
    3. Generate verification URL
    4. Insert into certificates table
    5. Return certificate ID
    
    Args:
        template_id: UUID of the certificate template
        student_id: UUID of the student
        issuer_auth_uid: Auth UID of the issuer (from Supabase auth)
    
    Returns:
        The newly created certificate ID
        
    Raises:
        ValueError: If issuer not found or required parameters missing
        RuntimeError: If database operation fails
    """
    
    # Step 1: Look up issuer by auth_uid
    if not issuer_auth_uid:
        raise ValueError("issuer_auth_uid is required")
    
    issuer = lookup_issuer(issuer_auth_uid)
    if not issuer:
        raise ValueError(f"Issuer with auth_uid '{issuer_auth_uid}' not found in app_users")
    
    issuer_id = issuer.get("id")
    if not issuer_id:
        raise ValueError("Issuer ID could not be retrieved")
    
    # Step 2: Create QR token using uuid4()
    qr_token = str(uuid4())
    
    # Step 3: Generate verification URL
    # Format: https://certifypro.vercel.app/verify/{qr_token}
    qr_url = f"https://certifypro.vercel.app/verify/{qr_token}"
    
    # Step 4: Insert into certificates table
    certificate_payload = {
        "template_id": template_id,
        "student_id": student_id,
        "issuer_id": issuer_id,
        "qr_token": qr_token,
        "qr_url": qr_url,
        "status": "issued",
        "issued_at": "now()"  # Supabase will convert this in the insert
    }
    
    data, err = insert_table("certificates", certificate_payload)
    if err:
        logger.error(f"Error inserting certificate: {err}")
        raise RuntimeError(f"Failed to create certificate: {err}")
    
    # Step 5: Return certificate ID
    if isinstance(data, list) and data:
        cert_id = data[0].get("id")
    elif isinstance(data, dict):
        cert_id = data.get("id")
    else:
        cert_id = data
    
    if not cert_id:
        raise RuntimeError("Certificate created but ID could not be retrieved")
    
    logger.info(f"Certificate {cert_id} created successfully by issuer {issuer_id}")
    return cert_id
