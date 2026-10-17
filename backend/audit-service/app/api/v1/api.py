"""
API Router aggregation for Audit Service
"""
from fastapi import APIRouter, Depends

from app.api.v1.endpoints import (
    vendors, certificates, exceptions, audit,
    compliance, tprm, assignments, vendor_notifications, reminders
)
from app.core.security import get_current_user

# Create main API router
api_router = APIRouter()

_auth = [Depends(get_current_user)]
api_router.include_router(vendors.router, prefix="/vendors", tags=["vendors"], dependencies=_auth)
api_router.include_router(certificates.router, prefix="/certificates", tags=["certificates"], dependencies=_auth)
api_router.include_router(exceptions.router, prefix="/exceptions", tags=["exceptions"], dependencies=_auth)
api_router.include_router(audit.router, prefix="/audit", tags=["audit"], dependencies=_auth)
api_router.include_router(compliance.router, prefix="/compliance", tags=["compliance"], dependencies=_auth)
api_router.include_router(tprm.router, prefix="/tprm", tags=["tprm"], dependencies=_auth)
api_router.include_router(assignments.router, prefix="/assignments", tags=["assignments"], dependencies=_auth)
api_router.include_router(vendor_notifications.router, prefix="/vendor-notifications", tags=["vendor-notifications"], dependencies=_auth)
api_router.include_router(reminders.router, prefix="/audit-reminders", tags=["reminders"], dependencies=_auth)

