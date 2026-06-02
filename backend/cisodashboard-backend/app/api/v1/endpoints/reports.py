"""Compatibility shim for the moved reports router."""

from app.modules.shared.api.reports import router

__all__ = ["router"]
