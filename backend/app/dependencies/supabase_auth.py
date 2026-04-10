import requests
from jose import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from ..core.config import get_settings

settings = get_settings()
SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_JWKS_URL = f"{SUPABASE_URL}/auth/v1/keys"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

_jwks_cache = None

def get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        resp = requests.get(SUPABASE_JWKS_URL)
        resp.raise_for_status()
        _jwks_cache = resp.json()
    return _jwks_cache

def verify_supabase_token(token: str):
    jwks = get_jwks()
    header = jwt.get_unverified_header(token)
    key = next((k for k in jwks["keys"] if k["kid"] == header["kid"]), None)
    if not key:
        raise HTTPException(status_code=401, detail="Invalid token: key not found")
    try:
        return jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience="authenticated"
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token decode error: {str(e)}")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_supabase_token(token)
    return payload
