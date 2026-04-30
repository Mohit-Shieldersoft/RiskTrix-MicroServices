"""Compatibility shim for the moved certificates router."""

from app.modules.audit.api.certificates import router

__all__ = ["router"]
