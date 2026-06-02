"""Compatibility shim for the moved assignments router."""

from app.modules.audit.api.assignments import router

__all__ = ["router"]
