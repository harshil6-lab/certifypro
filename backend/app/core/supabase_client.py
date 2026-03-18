"""Supabase client initialization.

This module creates a Supabase client using the service role key.

Why use the service role key here?
- The service role key has full privileges and is intended for backend-only
  operations where the server needs to perform privileged actions (for
  example, validating JWTs, or performing admin-level queries). It MUST
  never be exposed on the frontend or checked into source control.

Why backend handles auth verification?
- The backend can securely validate JWTs and fetch user information
  without exposing sensitive keys. This centralizes auth logic and lets
  the frontend call a single backend API instead of calling Supabase
  directly.
"""

from .config import get_settings
try:
    from supabase import create_client
except Exception:
    create_client = None

settings = get_settings()

# Only initialize the Supabase client when configuration values are present.
# This prevents startup failures in development when keys are not yet set.
if create_client and settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
  supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
else:
  supabase = None
