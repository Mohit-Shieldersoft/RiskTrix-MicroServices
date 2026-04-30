"""Compatibility shim for the moved users router."""

from app.modules.shared.api.users import router

__all__ = ["router"]
