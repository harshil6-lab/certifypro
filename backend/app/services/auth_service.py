"""Authentication helpers that wrap Supabase operations.

Provides a small abstraction for sending magic links and validating
tokens. Keep functions small and add comments explaining the security
considerations.
"""

from typing import Optional
from ..core.supabase_client import supabase
from ..core.config import get_settings
import requests

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


def get_current_user(token: str) -> Optional[dict]:
    """Validate the given JWT `token` and return the Supabase user record.

    Treat a missing or invalid token as unauthenticated.
    """
    if not token:
        return None

    if not supabase:
        # Fallback: call REST endpoint
        url = settings.SUPABASE_URL.rstrip("/") + "/auth/v1/user"
        headers = {"Authorization": f"Bearer {token}", "apikey": settings.SUPABASE_SERVICE_ROLE_KEY}
        r = requests.get(url, headers=headers)
        if r.ok:
            return r.json()
        return None

    try:
        user = supabase.auth.get_user(token)
        if isinstance(user, tuple) and len(user) >= 1:
            return user[0]
        return user
    except Exception:
        try:
            user = supabase.auth.api.get_user(token)
            return user
        except Exception:
            url = settings.SUPABASE_URL.rstrip("/") + "/auth/v1/user"
            headers = {"Authorization": f"Bearer {token}", "apikey": settings.SUPABASE_SERVICE_ROLE_KEY}
            r = requests.get(url, headers=headers)
            if r.ok:
                return r.json()
            return None
