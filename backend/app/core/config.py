import os
from typing import List

from dotenv import load_dotenv


_CONFIG_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(os.path.dirname(_CONFIG_DIR))
load_dotenv(os.path.join(_BACKEND_DIR, ".env"))
load_dotenv()


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
        self.SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
        self.SMTP_PORT = int(os.getenv("SMTP_PORT", "587") or "587")
        self.SMTP_USER = os.getenv("SMTP_USER", "").strip()
        self.SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
        self.SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", self.SMTP_USER).strip()
        self.CONTACT_DESTINATION_EMAIL = os.getenv("CONTACT_DESTINATION_EMAIL", "certifyprocare@gmail.com").strip()
        self.CONTACT_BRAND_NAME = os.getenv("CONTACT_BRAND_NAME", "ElevateX").strip() or "ElevateX"


def get_settings() -> Settings:
    return Settings()
