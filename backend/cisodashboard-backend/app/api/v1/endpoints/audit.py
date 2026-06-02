"""Compatibility shim for the moved audit router."""

from app.modules.audit.api.audit import router

__all__ = ["router"]
