from fastapi import APIRouter, HTTPException
from ..services.verify_service import verify_by_token

router = APIRouter()


@router.get("/verify/{token}")
async def verify(token: str):
    """Verify a certificate by qr token using DB function `verify_certificate_by_token`.

    Returns a JSON payload with 'valid' and 'certificate' keys.
    """
    try:
        data = verify_by_token(token)
        if not data:
            raise HTTPException(status_code=404, detail="certificate not found")
        return data
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
