"""Compatibility shim for the moved vendor notifications router."""

from app.modules.audit.api.vendor_notifications import router

__all__ = ["router"]
