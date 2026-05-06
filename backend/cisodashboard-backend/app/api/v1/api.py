from fastapi import APIRouter

from app.modules.shared.api import (
    auth,
    users,
)
from app.api.v1.endpoints.health import router as health_router

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
