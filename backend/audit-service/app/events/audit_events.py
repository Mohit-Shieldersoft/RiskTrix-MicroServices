"""Domain events for the Audit Service.

These events represent significant occurrences in vendor compliance, TPRM,
exception management, and audit workflows.
"""
from dataclasses import dataclass, field
from typing import Optional
from app.core.events import DomainEvent


@dataclass
class VendorCreated(DomainEvent):
    """Published when a new vendor is created."""
    
    vendor_id: int = field(kw_only=True)
    vendor_name: str = field(kw_only=True)
    risk_level: Optional[str] = field(default=None, kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "vendor.created"


@dataclass
class VendorUpdated(DomainEvent):
    """Published when a vendor is updated."""
    
    vendor_id: int = field(kw_only=True)
    vendor_name: str = field(kw_only=True)
    changes: dict = field(kw_only=True)  # Fields that were changed
    
    @property
    def event_type(self) -> str:
        return "vendor.updated"


@dataclass
class VendorDeleted(DomainEvent):
    """Published when a vendor is deleted."""
    
    vendor_id: int = field(kw_only=True)
    vendor_name: str = field(kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "vendor.deleted"


@dataclass
class VendorComplianceUpdated(DomainEvent):
    """Published when vendor compliance status changes."""
    
    vendor_id: int = field(kw_only=True)
    vendor_name: str = field(kw_only=True)
    compliance_status: str = field(kw_only=True)
    standard: Optional[str] = field(default=None, kw_only=True)
    previous_status: Optional[str] = field(default=None, kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "vendor.compliance_updated"


@dataclass
class CertificateCreated(DomainEvent):
    """Published when a vendor certificate is uploaded."""
    
    certificate_id: int = field(kw_only=True)
    vendor_id: int = field(kw_only=True)
    vendor_name: str = field(kw_only=True)
    certificate_type: str = field(kw_only=True)
    expiry_date: Optional[str] = field(default=None, kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "certificate.created"


@dataclass
class CertificateExpiring(DomainEvent):
    """Published when a certificate is about to expire."""
    
    certificate_id: int = field(kw_only=True)
    vendor_id: int = field(kw_only=True)
    vendor_name: str = field(kw_only=True)
    certificate_type: str = field(kw_only=True)
    expiry_date: str = field(kw_only=True)
    days_until_expiry: int = field(kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "certificate.expiring"


@dataclass
class ExceptionCreated(DomainEvent):
    """Published when a new exception is created."""
    
    exception_id: int = field(kw_only=True)
    title: str = field(kw_only=True)
    category: str = field(kw_only=True)
    severity: str = field(kw_only=True)
    status: str = field(kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "exception.created"


@dataclass
class ExceptionUpdated(DomainEvent):
    """Published when an exception is updated."""
    
    exception_id: int = field(kw_only=True)
    title: str = field(kw_only=True)
    changes: dict = field(kw_only=True)  # Fields that were changed
    
    @property
    def event_type(self) -> str:
        return "exception.updated"


@dataclass
class ExceptionApproved(DomainEvent):
    """Published when an exception is approved."""
    
    exception_id: int = field(kw_only=True)
    title: str = field(kw_only=True)
    approved_by: Optional[int] = field(default=None, kw_only=True)
    approval_notes: Optional[str] = field(default=None, kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "exception.approved"


@dataclass
class ExceptionRejected(DomainEvent):
    """Published when an exception is rejected."""
    
    exception_id: int = field(kw_only=True)
    title: str = field(kw_only=True)
    rejected_by: Optional[int] = field(default=None, kw_only=True)
    rejection_reason: Optional[str] = field(default=None, kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "exception.rejected"


@dataclass
class ComplianceAssessmentCreated(DomainEvent):
    """Published when a new compliance assessment is initiated."""
    
    assessment_id: int = field(kw_only=True)
    vendor_id: int = field(kw_only=True)
    standard: str = field(kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "compliance.assessment_created"


@dataclass
class ComplianceAssessmentCompleted(DomainEvent):
    """Published when a compliance assessment is completed."""
    
    assessment_id: int = field(kw_only=True)
    vendor_id: int = field(kw_only=True)
    standard: str = field(kw_only=True)
    compliance_rate: float = field(kw_only=True)
    
    @property
    def event_type(self) -> str:
        return "compliance.assessment_completed"

