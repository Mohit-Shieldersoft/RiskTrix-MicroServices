"""API v1 Endpoints"""

from .vendors import router as vendors_router
from .certificates import router as certificates_router
from .exceptions import router as exceptions_router
from .audit import router as audit_router
from .compliance import router as compliance_router
from .tprm import router as tprm_router
from .assignments import router as assignments_router
from .vendor_notifications import router as vendor_notifications_router

__all__ = [
    "vendors_router",
    "certificates_router",
    "exceptions_router",
    "audit_router",
    "compliance_router",
    "tprm_router",
    "assignments_router",
    "vendor_notifications_router",
]
