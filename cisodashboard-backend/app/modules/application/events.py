"""Domain events for the Application module.

These events represent significant occurrences in the application lifecycle
and vulnerability management workflows.
"""
from dataclasses import dataclass
from typing import Optional
from app.core.events import DomainEvent


@dataclass
class ApplicationCreated(DomainEvent):
    """Published when a new application is created."""
    
    application_id: int
    application_name: str
    application_type: Optional[str] = None
    risk_level: Optional[str] = None
    
    @property
    def event_type(self) -> str:
        return "application.created"


@dataclass
class ApplicationUpdated(DomainEvent):
    """Published when an application is updated."""
    
    application_id: int
    application_name: str
    changes: dict  # Fields that were changed
    
    @property
    def event_type(self) -> str:
        return "application.updated"


@dataclass
class ApplicationDeleted(DomainEvent):
    """Published when an application is deleted."""
    
    application_id: int
    application_name: str
    
    @property
    def event_type(self) -> str:
        return "application.deleted"


@dataclass
class VulnerabilityCreated(DomainEvent):
    """Published when a new vulnerability is created."""
    
    vulnerability_id: int
    application_id: int
    application_name: str
    cve_id: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    
    @property
    def event_type(self) -> str:
        return "vulnerability.created"


@dataclass
class VulnerabilityUpdated(DomainEvent):
    """Published when a vulnerability is updated."""
    
    vulnerability_id: int
    application_id: int
    application_name: str
    changes: dict  # Fields that were changed
    
    @property
    def event_type(self) -> str:
        return "vulnerability.updated"


@dataclass
class VulnerabilityClosed(DomainEvent):
    """Published when a vulnerability is marked as closed/resolved."""
    
    vulnerability_id: int
    application_id: int
    application_name: str
    cve_id: Optional[str] = None
    closure_reason: Optional[str] = None
    
    @property
    def event_type(self) -> str:
        return "vulnerability.closed"


@dataclass
class ApplicationReminderSent(DomainEvent):
    """Published when a reminder is sent for an application."""
    
    reminder_id: int
    application_id: int
    application_name: str
    reminder_type: str
    recipients: list
    
    @property
    def event_type(self) -> str:
        return "application.reminder_sent"
