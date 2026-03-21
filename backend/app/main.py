"""Main FastAPI app for CertifyPro backend.

Initializes the app, enables CORS for the frontend origins, mounts
API routers and registers the AuthMiddleware.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import get_settings
from .api import auth_routes, user_routes, templates_routes, dashboard_routes, students_routes, certificates_routes, verify_routes
from .middleware.auth_middleware import AuthMiddleware
from .services.templates_service import seed_default_templates

settings = get_settings()

app = FastAPI(title="CertifyPro Backend")

from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",  # frontend dev server
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://192.168.56.1:8080"  # alternative frontend dev server port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Add auth middleware (protects routes under /user by default)
app.add_middleware(AuthMiddleware, supabase_client=None)

# Include routers
app.include_router(auth_routes.router, prefix="/auth", tags=["auth"])
app.include_router(user_routes.router, prefix="/user", tags=["user"])
app.include_router(templates_routes.router, prefix="/templates", tags=["templates"])
app.include_router(dashboard_routes.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(students_routes.router, prefix="/students", tags=["students"])
app.include_router(certificates_routes.router, prefix="/certificates", tags=["certificates"])
app.include_router(verify_routes.router, prefix="", tags=["verify"])


# Startup event: seed default templates if table is empty
@app.on_event("startup")
async def startup_event():
    """Run initialization tasks on FastAPI startup."""
    print("\n🚀 CertifyPro Backend Startup")
    print("=" * 50)
    seed_default_templates()
    print("=" * 50)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

