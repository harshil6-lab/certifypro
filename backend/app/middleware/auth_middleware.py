"""Middleware to protect selected routes by validating Supabase tokens.

This middleware inspects requests for an Authorization header and, when
the path is protected, validates the token with Supabase and attaches
the user object to `request.state.user`.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from typing import Callable, Iterable
from ..core.supabase_client import supabase


class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, supabase_client=None, protected_prefixes: Iterable[str] = ("/user",)):
        super().__init__(app)
        self.supabase = supabase_client or supabase
        self.protected_prefixes = tuple(protected_prefixes)

    async def dispatch(self, request: Request, call_next: Callable):
        path = request.url.path

        # Skip protection for public auth endpoints and open docs
        if path.startswith("/auth") or path.startswith("/docs") or path.startswith("/openapi.json"):
            return await call_next(request)

        # If the path is not one of the protected prefixes, continue
        if not any(path.startswith(p) for p in self.protected_prefixes):
            return await call_next(request)

        auth = request.headers.get("Authorization")
        if not auth or not auth.lower().startswith("bearer "):
            return JSONResponse({"detail": "missing or invalid authorization header"}, status_code=401)

        token = auth.split(" ", 1)[1]

        user_data = None
        if self.supabase:
            try:
                user_response = self.supabase.auth.get_user(token)
                # Normalize: handle both object and dict
                if hasattr(user_response, "user") and user_response.user:
                    u = user_response.user
                    user_data = {
                        "id": str(u.id) if hasattr(u, "id") else str(u.get("id", "")),
                        "email": u.email if hasattr(u, "email") else u.get("email", ""),
                    }
                elif isinstance(user_response, dict) and user_response.get("id"):
                    user_data = {"id": user_response["id"], "email": user_response.get("email", "")}
            except Exception:
                pass

        if not user_data:
            # REST fallback
            import requests as _requests
            from ..core.config import get_settings
            settings = get_settings()
            _url = settings.SUPABASE_URL.rstrip("/") + "/auth/v1/user"
            _headers = {"Authorization": f"Bearer {token}", "apikey": settings.SUPABASE_SERVICE_ROLE_KEY}
            _r = _requests.get(_url, headers=_headers)
            if _r.ok:
                raw = _r.json()
                if raw.get("id"):
                    user_data = {"id": raw["id"], "email": raw.get("email", "")}

        if not user_data or not user_data.get("id"):
            return JSONResponse({"detail": "invalid token"}, status_code=401)

        request.state.user = user_data

        # Auto-create app_users row and set user_id on state
        try:
            from app.services.access_control_service import AuthIdentity, ensure_actor_membership
            identity = AuthIdentity(
                auth_user_id=user_data["id"],
                email=user_data.get("email", "")
            )
            app_user = ensure_actor_membership(identity)
            request.state.app_user_id = app_user["id"]
            request.state.user_id = app_user["id"]
        except Exception:
            pass  # Non-critical

        return await call_next(request)
