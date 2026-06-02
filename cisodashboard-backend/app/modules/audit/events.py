"""Domain events for the Audit module.

These events represent significant occurrences in vendor compliance, TPRM,
exception management, and audit workflows.
"""
from dataclasses import dataclass
from typing import Optional
from app.core.events import DomainEvent


@dataclass(kw_only=True)
class VendorCreated(DomainEvent):
    """Published when a new vendor is created."""
    
    vendor_id: int
    vendor_name: str
    risk_level: Optional[str] = None
    
    @property
    def event_type(self) -> str:
        return "vendor.created"


@dataclass(kw_only=True)
class VendorUpdated(DomainEvent):
    """Published when a vendor is updated."""
    
    vendor_id: int
    vendor_name: str
    changes: dict  # Fields that were changed
    
    @property
    def event_type(self) -> str:
        return "vendor.updated"


@dataclass(kw_only=True)
class VendorDeleted(DomainEvent):
    """Published when a vendor is deleted."""
    
    vendor_id: int
    vendor_name: str
    
    @property
    def event_type(self) -> str:
        return "vendor.deleted"


@dataclass(kw_only=True)
class VendorComplianceUpdated(DomainEvent):
    """Published when vendor compliance status changes."""
    
    vendor_id: int
    vendor_name: str
    compliance_status: str
    standard: Optional[str] = None
    previous_status: Optional[str] = None
    
    @property
    def event_type(self) -> str:
        return "vendor.compliance_updated"


@dataclass(kw_only=True)
class CertificateCreated(DomainEvent):
    """Published when a vendor certificate is uploaded."""
    
    certificate_id: int
    vendor_id: int
    vendor_name: str
    certificate_type: str
    expiry_date: Optional[str] = None
    
    @property
    def event_type(self) -> str:
        return "certificate.created"


@dataclass(kw_only=True)
class CertificateExpiring(DomainEvent):
    """Published when a certificate is about to expire."""
    
    certificate_id: int
    vendor_id: int
    vendor_name: str
    certificate_type: str
    expiry_date: str
    days_until_expiry: int
    
    @property
    def event_type(self) -> str:
        return "certificate.expiring"


@dataclass(kw_only=True)
class ExceptionCreated(DomainEvent):
    """Published when a new exception is created."""
    
    exception_id: int
    title: str
    category: str
    severity: str
    status: str
    
    @property
    def event_type(self) -> str:
        return "exception.created"


@dataclass(kw_only=True)
class ExceptionUpdated(DomainEvent):
    """Published when an exception is updated."""
    
    exception_id: int
    title: str
    changes: dict  # Fields that were changed
    
    @property
    def event_type(self) -> str:
        return "exception.updated"


@dataclass(kw_only=True)
class ExceptionApproved(DomainEvent):
    """Published when an exception is approved."""
    
    exception_id: int
    title: str
    approved_by: Optional[int] = None
    approval_notes: Optional[str] = None
    
    @property
    def event_type(self) -> str:
        return "exception.approved"


@dataclass(kw_only=True)
class ExceptionRejected(DomainEvent):
    """Published when an exception is rejected."""
    
    exception_id: int
    title: str
    rejected_by: Optional[int] = None
    rejection_reason: Optional[str] = None
    
    @property
    def event_type(self) -> str:
        return "exception.rejected"


@dataclass(kw_only=True)
class ExceptionExpired(DomainEvent):
    """Published when an exception expires."""
    
    exception_id: int
    title: str
    expiry_date: str
    
    @property
    def event_type(self) -> str:
        return "exception.expired"


@dataclass(kw_only=True)
class AssessmentCreated(DomainEvent):
    """Published when a new assessment/assignment is created."""
    
    assessment_id: int
    assignment_id: int
    title: str
    assessment_type: str
    
    @property
    def event_type(self) -> str:
        return "assessment.created"


@dataclass(kw_only=True)
class AssessmentCompleted(DomainEvent):
    """Published when an assessment is completed."""
    
    assessment_id: int
    assignment_id: int
    title: str
    completion_status: str
    
    @property
    def event_type(self) -> str:
        return "assessment.completed"


@dataclass(kw_only=True)
class ComplianceRecordCreated(DomainEvent):
    """Published when a compliance record is created."""
    
    record_id: int
    standard: str
    status: str
    requirement: Optional[str] = None
    
    @property
    def event_type(self) -> str:
        return "compliance.record_created"


@dataclass(kw_only=True)
class VendorReminderSent(DomainEvent):
    """Published when a reminder is sent for a vendor."""
    
    reminder_id: int
    vendor_id: int
    vendor_name: str
    reminder_type: str
    recipients: list
    
    @property
    def event_type(self) -> str:
        return "vendor.reminder_sent"


@dataclass(kw_only=True)
class ExceptionReminderSent(DomainEvent):
    """Published when a reminder is sent for an exception."""
    
    reminder_id: int
    exception_id: int
    exception_title: str
    reminder_type: str
    recipients: list
    
    @property
    def event_type(self) -> str:
        return "exception.reminder_sent"
