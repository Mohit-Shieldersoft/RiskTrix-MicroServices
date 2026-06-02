"""Compatibility shim for the moved yourboard router."""

from app.modules.shared.api.yourboard import router

__all__ = ["router"]
