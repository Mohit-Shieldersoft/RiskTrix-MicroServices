"""API Router aggregation for Application Service"""
from fastapi import APIRouter

from app.api.v1.endpoints import applications, vulnerabilities, app_history, dashboard, reminders, eosl, auth

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(vulnerabilities.router, prefix="/vulnerabilities", tags=["vulnerabilities"])
api_router.include_router(app_history.router, prefix="/app-history", tags=["app-history"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["reminders"])
api_router.include_router(eosl.router, prefix="/eosl", tags=["eosl"])
