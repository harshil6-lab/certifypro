from supabase import create_client, Client
import os
from dotenv import load_dotenv

_CORE_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(os.path.dirname(_CORE_DIR))
load_dotenv(os.path.join(_BACKEND_DIR, ".env"))
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL:
    raise Exception("Missing SUPABASE_URL")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise Exception("Missing SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)