"""Compatibility shim for the moved auth router."""

from app.modules.shared.api.auth import router

__all__ = ["router"]
