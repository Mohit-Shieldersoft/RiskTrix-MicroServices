"""Compatibility shim for the moved app history service."""

from app.modules.application.services.app_history_service import (
    AppHistoryService,
    app_history_service,
)

__all__ = ["AppHistoryService", "app_history_service"]
