"""Compatibility shim for the moved dashboard router."""

from app.modules.shared.api.dashboard import router

__all__ = ["router"]
