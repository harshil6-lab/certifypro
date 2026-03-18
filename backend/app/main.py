"""Main FastAPI app for CertifyPro backend.

Initializes the app, enables CORS for the frontend origins, mounts
API routers and registers the AuthMiddleware.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import get_settings
from .api import auth_routes, user_routes, templates_routes, dashboard_routes, students_routes, certificates_routes, verify_routes
from .middleware.auth_middleware import AuthMiddleware

settings = get_settings()

app = FastAPI(title="CertifyPro Backend")

# Enable CORS for the configured frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
