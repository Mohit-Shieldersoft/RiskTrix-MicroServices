"""Compatibility shim for the moved vendors router."""

from app.modules.audit.api.vendors import router

__all__ = ["router"]
