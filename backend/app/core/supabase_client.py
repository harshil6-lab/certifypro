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

def get_supabase_service_client():
    """Returns a Supabase client using the service role key (bypasses RLS)."""
    import os
    from supabase import create_client
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    return create_client(url, key)