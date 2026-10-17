"""API Router aggregation for Application Service"""
from fastapi import APIRouter, Depends

from app.api.v1.endpoints import applications, vulnerabilities, app_history, dashboard, reminders, eosl, auth
from app.core.security import get_current_user

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
_auth = [Depends(get_current_user)]
api_router.include_router(applications.router, prefix="/applications", tags=["applications"], dependencies=_auth)
api_router.include_router(vulnerabilities.router, prefix="/vulnerabilities", tags=["vulnerabilities"], dependencies=_auth)
api_router.include_router(app_history.router, prefix="/app-history", tags=["app-history"], dependencies=_auth)
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"], dependencies=_auth)
api_router.include_router(reminders.router, prefix="/reminders", tags=["reminders"], dependencies=_auth)
api_router.include_router(eosl.router, prefix="/eosl", tags=["eosl"], dependencies=_auth)
