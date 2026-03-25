from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..services.verify_service import verify_by_token

router = APIRouter()


@router.get("/verify/token/{qr_token}")
async def verify(qr_token: str) -> Dict[str, Any]:
    """Verify a certificate by QR token — PUBLIC endpoint.
    
    No authentication required. QR scans resolve to this endpoint to verify
    certificate authenticity.
    
    Args:
        qr_token: The QR token from the certificate
        
    Returns:
        {
            "valid": true/false,
            "template_id": "...",
            "student_id": "...",
            "issued_at": "2026-03-21T...",
            "status": "issued" or "revoked",
            "certificate_id": "..."
        }
        
    Returns 404 if certificate not found.
    """
    try:
        result = verify_by_token(qr_token)
        
        if not result:
            return {
                "valid": False,
                "message": "certificate not found",
                "template_id": None,
                "student_id": None,
                "issued_at": None,
                "status": None,
                "certificate_id": None
            }
        
        return result
    
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error verifying certificate: {str(exc)}")
