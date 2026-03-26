import os
from typing import List


class Settings:
    """Simple settings container that reads values from environment.

    Avoids a hard dependency on pydantic for simpler local runs and tests.
    For production, teams may replace this with a pydantic `BaseSettings`
    implementation if desired.
    """

    def __init__(self):
        self.SUPABASE_URL = os.getenv("SUPABASE_URL", "")
        self.SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173")
        # allow comma-separated list
        self.FRONTEND_ORIGINS = [o.strip() for o in origins.split(",") if o.strip()]
        self.ACCESS_INVITE_REDIRECT_URL = os.getenv("ACCESS_INVITE_REDIRECT_URL", "").strip()


def get_settings() -> Settings:
    return Settings()
