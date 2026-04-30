"""Compatibility shim for the moved compliance router."""

from app.modules.audit.api.compliance import router

__all__ = ["router"]
