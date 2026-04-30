"""Compatibility shim for the moved applications router."""

from app.modules.application.api.applications_impl import router

__all__ = ["router"]
