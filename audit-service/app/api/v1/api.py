"""
API Router aggregation for Audit Service
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    vendors, certificates, exceptions, audit,
    compliance, tprm, assignments, vendor_notifications, reminders
)

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(vendors.router, prefix="/vendors", tags=["vendors"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["certificates"])
api_router.include_router(exceptions.router, prefix="/exceptions", tags=["exceptions"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(compliance.router, prefix="/compliance", tags=["compliance"])
api_router.include_router(tprm.router, prefix="/tprm", tags=["tprm"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
api_router.include_router(vendor_notifications.router, prefix="/vendor-notifications", tags=["vendor-notifications"])
api_router.include_router(reminders.router, prefix="/audit-reminders", tags=["reminders"])

