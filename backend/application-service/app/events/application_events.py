"""Domain events for the Application Service.

These events represent significant occurrences in the application lifecycle
and vulnerability management workflows.
"""
from dataclasses import dataclass, field
from typing import Optional
from app.core.events import DomainEvent


@dataclass
class ApplicationCreated(DomainEvent):
    """Published when a new application is created."""
    
    application_id: int = field(kw_only=True)
    application_name: str = field(kw_only=True)
    application_type: Optional[str] = field(default=None, kw_only=True)
    risk_level: Optional[str] = field(default=None, kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "application.created"


@dataclass
class ApplicationUpdated(DomainEvent):
    """Published when an application is updated."""
    
    application_id: int = field(kw_only=True)
    application_name: str = field(kw_only=True)
    changes: dict = field(kw_only=True)  # Fields that were changed
    
    @property
    def event_type(self) -> str:
        return "application.updated"


@dataclass
class ApplicationDeleted(DomainEvent):
    """Published when an application is deleted."""
    
    application_id: int = field(kw_only=True)
    application_name: str = field(kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "application.deleted"


@dataclass
class VulnerabilityCreated(DomainEvent):
    """Published when a new vulnerability is created."""
    
    vulnerability_id: int = field(kw_only=True)
    application_id: int = field(kw_only=True)
    application_name: str = field(kw_only=True)
    cve_id: Optional[str] = field(default=None, kw_only=True)
    severity: Optional[str] = field(default=None, kw_only=True)
    status: Optional[str] = field(default=None, kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "vulnerability.created"


@dataclass
class VulnerabilityUpdated(DomainEvent):
    """Published when a vulnerability is updated."""
    
    vulnerability_id: int = field(kw_only=True)
    application_id: int = field(kw_only=True)
    application_name: str = field(kw_only=True)
    changes: dict = field(kw_only=True)  # Fields that were changed
    
    @property
    def event_type(self) -> str:
        return "vulnerability.updated"


@dataclass
class VulnerabilityClosed(DomainEvent):
    """Published when a vulnerability is marked as closed/resolved."""
    
    vulnerability_id: int = field(kw_only=True)
    application_id: int = field(kw_only=True)
    application_name: str = field(kw_only=True)
    cve_id: Optional[str] = field(default=None, kw_only=True)
    closure_reason: Optional[str] = field(default=None, kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "vulnerability.closed"


@dataclass
class ApplicationReminderSent(DomainEvent):
    """Published when a reminder is sent for an application."""
    
    reminder_id: int = field(kw_only=True)
    application_id: int = field(kw_only=True)
    application_name: str = field(kw_only=True)
    reminder_type: str = field(kw_only=True)
    recipients: list = field(kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "application.reminder_sent"
