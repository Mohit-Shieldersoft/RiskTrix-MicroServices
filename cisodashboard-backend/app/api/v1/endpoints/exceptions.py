"""Compatibility shim for the moved exceptions router."""

from app.modules.audit.api.exceptions import router

__all__ = ["router"]
