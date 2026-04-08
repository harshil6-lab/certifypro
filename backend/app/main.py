"""Main FastAPI app for CertifyPro backend.

Initializes the app, enables CORS for the frontend origins, mounts
API routers and registers the AuthMiddleware.
"""

import os
import sys
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api import (
    access_control_routes,
    auth_routes,
    certificates_routes,
    contact_routes,
    dashboard_routes,
    students_routes,
    templates_routes,
    user_routes,
    verify_routes,
)
from .api.generate_certificates import router as generate_certificates_router
from .api.generate_routes import router as generate_router
from .api.import_students import router as import_students_router
from .api.students_ready import router as students_ready_router
from .api.verify import router as public_verify_router
from .api.workspace_template import router as workspace_template_router
from .middleware.auth_middleware import AuthMiddleware
from .services.template_gallery_seed import seed_gallery_templates
from .services.templates_service import seed_default_templates

app = FastAPI(title="CertifyPro Backend")

# Windows: ensure asyncio subprocess support (required by Playwright/Chromium).
if sys.platform.startswith("win"):
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())  # type: ignore[attr-defined]
    except Exception:
        # If policy is unavailable, keep default.
        pass

allowed_origins_env = os.getenv("FRONTEND_ORIGINS", "")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()] or [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "https://certifypro-tau.vercel.app",
]


# Register auth middleware first, then CORS so cross-origin headers are still
# attached when protected routes return auth or validation errors.
app.add_middleware(AuthMiddleware, supabase_client=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router, prefix="/auth", tags=["auth"])
app.include_router(user_routes.router, prefix="/user", tags=["user"])
app.include_router(templates_routes.router)
app.include_router(dashboard_routes.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(students_routes.router, prefix="/students", tags=["students"])
app.include_router(certificates_routes.router, prefix="/certificates", tags=["certificates"])
app.include_router(verify_routes.router, prefix="", tags=["verify"])
app.include_router(generate_router)
app.include_router(import_students_router)
app.include_router(generate_certificates_router)
app.include_router(public_verify_router)
app.include_router(workspace_template_router)
app.include_router(students_ready_router)
app.include_router(access_control_routes.router)
app.include_router(contact_routes.router)

# Enable static file serving for uploaded templates
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.on_event("startup")
async def startup_event():
    """Run initialization tasks on FastAPI startup."""
    print("\n🚀 CertifyPro Backend Startup")
    print("=" * 60)

    seed_default_templates()
    seed_gallery_templates()

    print("=" * 60)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
