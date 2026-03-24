"""Main FastAPI app for CertifyPro backend.

Initializes the app, enables CORS for the frontend origins, mounts
API routers and registers the AuthMiddleware.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .core.config import get_settings
from .api import auth_routes, user_routes, templates_routes, dashboard_routes, students_routes, certificates_routes, verify_routes
from .middleware.auth_middleware import AuthMiddleware
from .services.templates_service import seed_default_templates
from .services.template_gallery_seed import seed_gallery_templates
from app.api.templates_routes import router as templates_router 

  # Include templates router for /api/templates routes

settings = get_settings()

app = FastAPI(title="CertifyPro Backend")

from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",  # frontend dev server
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8080",
    "http://192.168.56.1:8080"  ,
    "http://192.168.56.1:8081"# alternative frontend dev server port
]
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # temporary full access (safe for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Add auth middleware (protects routes under /user by default)
app.add_middleware(AuthMiddleware, supabase_client=None)

# Include routers
app.include_router(auth_routes.router, prefix="/auth", tags=["auth"])
app.include_router(user_routes.router, prefix="/user", tags=["user"])
app.include_router(templates_routes.router)
app.include_router(dashboard_routes.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(students_routes.router, prefix="/students", tags=["students"])
app.include_router(certificates_routes.router, prefix="/certificates", tags=["certificates"])
app.include_router(verify_routes.router, prefix="", tags=["verify"])

# Enable static file serving for uploaded templates
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.on_event("startup")
async def startup_event():
    """Run initialization tasks on FastAPI startup.
    
    Tasks:
    1. Seed basic default templates (5 templates)
    2. Seed official gallery templates (60 templates)
    """
    print("\n🚀 CertifyPro Backend Startup")
    print("=" * 60)
    
    # Seed basic templates first
    seed_default_templates()
    
    # Then seed official gallery templates
    seed_gallery_templates()
    
    print("=" * 60)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

