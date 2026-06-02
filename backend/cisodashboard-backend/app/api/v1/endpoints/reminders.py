"""Compatibility shim for the moved reminders router."""

from app.modules.shared.api.reminders import router

__all__ = ["router"]
