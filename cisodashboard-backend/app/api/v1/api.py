from fastapi import APIRouter

from app.modules.shared.api import (
    auth,
    users,
    eosl,
    dashboard,
    reports,
    reminders,
    yourboard,
    activities,
    intelligence,
)
from app.modules.application.api import applications, vulnerabilities, app_history
from app.modules.audit.api import (
    vendors,
    compliance,
    assignments,
    certificates,
    exceptions,
    audit,
    tprm,
    vendor_notifications,
)

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(vulnerabilities.router, prefix="/vulnerabilities", tags=["vulnerabilities"])
api_router.include_router(vendors.router, prefix="/vendors", tags=["vendors"])
api_router.include_router(compliance.router, prefix="/compliance", tags=["compliance"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["certificates"])
api_router.include_router(exceptions.router, prefix="/exceptions", tags=["exceptions"])
api_router.include_router(eosl.router, prefix="/eosl", tags=["eosl"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["reminders"])
api_router.include_router(tprm.router, prefix="/tprm", tags=["tprm"])
api_router.include_router(app_history.router, prefix="/app-history", tags=["app-history"])
api_router.include_router(yourboard.router, prefix="/yourboard", tags=["yourboard"])
api_router.include_router(vendor_notifications.router, prefix="/vendor-notifications", tags=["vendor-notifications"])

api_router.include_router(intelligence.router, prefix="", tags=["intelligence"])

# Activity logs endpoint
api_router.include_router(activities.router, prefix="", tags=["activities"])
