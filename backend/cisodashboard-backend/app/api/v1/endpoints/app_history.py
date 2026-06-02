"""Compatibility shim for the moved app history router."""

from app.modules.application.api.app_history_impl import router

__all__ = ["router"]
