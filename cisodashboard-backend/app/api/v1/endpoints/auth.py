"""Compatibility shim for the moved auth router."""

from app.modules.shared.api.auth import router, admin_required

__all__ = ["router", "admin_required"]
