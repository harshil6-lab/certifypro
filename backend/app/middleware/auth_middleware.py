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

        try:
            user = None
            if self.supabase:
                try:
                    user = self.supabase.auth.get_user(token)
                except Exception:
                    try:
                        user = self.supabase.auth.api.get_user(token)
                    except Exception:
                        user = None

            if not user:
                # Final fallback: call REST endpoint
                import requests
                from ..core.config import get_settings
                settings = get_settings()
                url = settings.SUPABASE_URL.rstrip("/") + "/auth/v1/user"
                headers = {"Authorization": f"Bearer {token}", "apikey": settings.SUPABASE_SERVICE_ROLE_KEY}
                r = requests.get(url, headers=headers)
                user = r.json() if r.ok else None

            if not user:
                return JSONResponse({"detail": "invalid token"}, status_code=401)

            request.state.user = user
            return await call_next(request)
        except Exception:
            return JSONResponse({"detail": "auth validation error"}, status_code=401)
