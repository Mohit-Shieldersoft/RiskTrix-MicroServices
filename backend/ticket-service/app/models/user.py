from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    CISO = "ciso"
    INFOSEC_MANAGER = "infosec_manager"
    EXTERNAL_AUDITOR = "external_auditor"
    INTERNAL_AUDITOR = "internal_auditor"
    SECURITY_ANALYST = "security_analyst"
    VIEWER = "viewer"