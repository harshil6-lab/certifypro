"""Authentication helpers that wrap Supabase operations.

Provides a small abstraction for sending magic links and validating
tokens. Keep functions small and add comments explaining the security
considerations.
"""

from typing import Optional

import requests
from fastapi import Header

from ..core.config import get_settings
from ..core.supabase_client import supabase


settings = get_settings()


def send_magic_link(email: str) -> dict:
    """Send a magic-link (email OTP) to the given address.

    Security note: The backend simply forwards the request to Supabase.
    Supabase will send the email; the backend does not generate or send
    the token itself.
    """
    if not email:
        raise ValueError("email is required")

    if not supabase:
        return {"success": False, "error": "supabase client unavailable"}

    try:
        resp = supabase.auth.sign_in_with_otp({"email": email})
        return {"success": True, "data": resp}
    except Exception:
        try:
            resp = supabase.auth.sign_in(email=email)
            return {"success": True, "data": resp}
        except Exception as exc:
            return {"success": False, "error": str(exc)}





def get_current_user(authorization: Optional[str] = Header(default=None)) -> Optional[dict]:
    """Validate the Bearer token from the Authorization header and return the Supabase user record."""

    if not authorization or not authorization.lower().startswith("bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        return None

    if supabase:
        try:
            user = supabase.auth.get_user(token)
            if user:
                if isinstance(user, tuple) and len(user) >= 1:
                    return user[0]
                return user
        except Exception:
            pass

    # REST fallback when supabase client is unavailable
    try:
        url = settings.SUPABASE_URL.rstrip("/") + "/auth/v1/user"
        headers = {
            "Authorization": f"Bearer {token}",
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        }
        r = requests.get(url, headers=headers, timeout=10)
        if r.ok:
            return r.json()
    except Exception:
        pass

    return None


