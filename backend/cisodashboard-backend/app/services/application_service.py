"""Compatibility shim for the moved application service."""

from app.modules.application.services.application_service import (
    ApplicationService,
    application_service,
)

__all__ = ["ApplicationService", "application_service"]
