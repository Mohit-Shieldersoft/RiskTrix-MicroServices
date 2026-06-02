from fastapi import APIRouter, Depends

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
from app.modules.automation.api import automation
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
from app.modules.shared.api.auth import get_current_user, admin_required, require_roles

# Create main API router
api_router = APIRouter()

# Auth routes are public (no auth dependency)
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# User management: admin only
api_router.include_router(
    users.router, prefix="/users", tags=["users"],
    dependencies=[Depends(admin_required)]
)

# All remaining routes require a valid authenticated user
_auth = [Depends(get_current_user)]

api_router.include_router(applications.router, prefix="/applications", tags=["applications"], dependencies=_auth)
api_router.include_router(vulnerabilities.router, prefix="/vulnerabilities", tags=["vulnerabilities"], dependencies=_auth)
api_router.include_router(vendors.router, prefix="/vendors", tags=["vendors"], dependencies=_auth)
api_router.include_router(compliance.router, prefix="/compliance", tags=["compliance"], dependencies=_auth)
api_router.include_router(assignments.router, prefix="/assignments", tags=["assignments"], dependencies=_auth)
api_router.include_router(certificates.router, prefix="/certificates", tags=["certificates"], dependencies=_auth)
api_router.include_router(exceptions.router, prefix="/exceptions", tags=["exceptions"], dependencies=_auth)
api_router.include_router(eosl.router, prefix="/eosl", tags=["eosl"], dependencies=_auth)
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"], dependencies=_auth)
api_router.include_router(reports.router, prefix="/reports", tags=["reports"], dependencies=_auth)
api_router.include_router(audit.router, prefix="/audit", tags=["audit"], dependencies=_auth)
api_router.include_router(reminders.router, prefix="/reminders", tags=["reminders"], dependencies=_auth)
api_router.include_router(tprm.router, prefix="/tprm", tags=["tprm"], dependencies=_auth)
api_router.include_router(app_history.router, prefix="/app-history", tags=["app-history"], dependencies=_auth)
api_router.include_router(yourboard.router, prefix="/yourboard", tags=["yourboard"], dependencies=_auth)
api_router.include_router(vendor_notifications.router, prefix="/vendor-notifications", tags=["vendor-notifications"], dependencies=_auth)
api_router.include_router(intelligence.router, prefix="", tags=["intelligence"], dependencies=_auth)
api_router.include_router(activities.router, prefix="", tags=["activities"], dependencies=_auth)
# Automation: view = admin/ciso/infosec_manager; write operations add further checks inside the router
_automation_auth = [Depends(get_current_user), Depends(require_roles("admin", "ciso", "infosec_manager"))]
api_router.include_router(automation.router, prefix="/automation", tags=["automation"], dependencies=_automation_auth)
