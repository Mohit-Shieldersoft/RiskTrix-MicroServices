"""Compatibility shim for the moved TPRM router."""

from app.modules.audit.api.tprm import router

__all__ = ["router"]
