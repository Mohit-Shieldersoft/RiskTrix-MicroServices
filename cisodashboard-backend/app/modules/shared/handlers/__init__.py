"""Event handlers for shared cross-cutting concerns."""

from app.modules.shared.handlers.activity_handlers import register_activity_log_handlers

__all__ = ["register_activity_log_handlers"]
