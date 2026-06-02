"""
Audit Service - Models

NOTE: Since we're sharing the database with the monolith during transition,
these models MUST match the models in cisodashboard-backend exactly.

These models represent the Audit domain:
- Vendor management
- Certificates
- Exceptions  
- Compliance standards
- Assignments and assessments
"""

from sqlalchemy import Boolean, Column, Integer, String, DateTime, Text, Enum as SQLEnum, ForeignKey, JSON, Numeric, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum

from app.db.session import Base


class RiskLevel(str, Enum):
    """Risk levels enumeration"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class ComplianceStatus(str, Enum):
    """Compliance status enumeration"""
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PENDING = "pending"
    EXCEPTION = "exception"
    NOT_APPLICABLE = "not_applicable"


class ExceptionCategory(str, Enum):
    """Exception category enumeration"""
    COMPLIANCE = "compliance"
    TECHNICAL = "technical"
    OPERATIONAL = "operational"
    OTHER = "other"


class ExceptionSeverity(str, Enum):
    """Exception severity enumeration"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ExceptionStatus(str, Enum):
    """Exception status enumeration"""
    ACTIVE = "active"
    EXPIRED = "expired"
    PENDING = "pending"


class TimestampMixin:
    """Mixin to add timestamp fields to models"""
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)


class Vendor(Base, TimestampMixin):
    """Vendor model for TPRM (Third Party Risk Management)"""
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)  # Software, Hardware, Service, etc.
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    website = Column(String(255), nullable=True)
    
    # Risk assessment
    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.MEDIUM, nullable=False)
    last_risk_assessment = Column(Date, nullable=True)
    next_risk_assessment = Column(Date, nullable=True)
    
    # Contract information
    contract_start_date = Column(Date, nullable=True)
    contract_end_date = Column(Date, nullable=True)
    contract_value = Column(Numeric(15, 2), nullable=True)
    
    # Certificate information (for quick access without joining certificates table)
    application_name = Column(String(255), nullable=True)
    certificate_type = Column(String(100), nullable=True)
    certificate_issue_date = Column(Date, nullable=True)
    certificate_expiry_date = Column(Date, nullable=True)
    
    # Compliance status
    compliance_status = Column(SQLEnum(ComplianceStatus), default=ComplianceStatus.PENDING, nullable=False)
    
    # Compliance metrics - calculated from assessments
    compliance_rate = Column(Numeric(5, 2), nullable=True)  # Percentage (0-100)
    compliant_controls = Column(Integer, default=0, nullable=False)
    non_compliant_controls = Column(Integer, default=0, nullable=False)
    last_compliance_check = Column(Date, nullable=True)
    
    # Foreign keys
    # organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)  # Cross-service reference
    
    # Relationships
    # organization = relationship("Organization", back_populates="vendors")  # Cross-service reference
    compliance_records = relationship("VendorComplianceRecord", back_populates="vendor")
    certificates = relationship("VendorCertificate", back_populates="vendor")


class VendorCertificate(Base, TimestampMixin):
    """Vendor certificates for compliance standards"""
    __tablename__ = "vendor_certificates"
    
    id = Column(Integer, primary_key=True, index=True)
    certificate_type = Column(String(100), nullable=False)  # ISO 27001, PCI-DSS, etc.
    certificate_number = Column(String(255), nullable=True)
    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    status = Column(SQLEnum(ComplianceStatus), default=ComplianceStatus.COMPLIANT, nullable=False)
    
    # Certificate details
    issuing_authority = Column(String(255), nullable=True)
    certificate_url = Column(String(500), nullable=True)
    scope = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Foreign keys
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    # application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)  # Cross-service reference
    
    # Relationships
    vendor = relationship("Vendor", back_populates="certificates")
    # application = relationship("Application", back_populates="certificates")  # Cross-service reference


class ComplianceStandard(Base, TimestampMixin):
    """Compliance standards model"""
    __tablename__ = "compliance_standards"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)  # ISO27001, PCI_DSS, etc.
    full_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    version = Column(String(20), nullable=True)
    authority = Column(String(255), nullable=True)  # ISO, PCI Council, etc.
    
    # Relationships
    requirements = relationship("ComplianceRequirement", back_populates="standard")
    compliance_records = relationship("ComplianceRecord", back_populates="standard")


class ComplianceRequirement(Base, TimestampMixin):
    """Individual compliance requirements"""
    __tablename__ = "compliance_requirements"
    
    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(String(50), nullable=False, index=True)  # e.g., "A.5.1.1"
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    
    # Foreign keys
    standard_id = Column(Integer, ForeignKey("compliance_standards.id"), nullable=False)
    
    # Relationships
    standard = relationship("ComplianceStandard", back_populates="requirements")


class ComplianceRecord(Base, TimestampMixin):
    """Compliance records for applications"""
    __tablename__ = "compliance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    status = Column(SQLEnum(ComplianceStatus), nullable=False)
    assessment_date = Column(Date, nullable=False)
    next_assessment_date = Column(Date, nullable=True)
    evidence = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Foreign keys
    # application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)  # Cross-service reference
    standard_id = Column(Integer, ForeignKey("compliance_standards.id"), nullable=False)
    assessor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    # application = relationship("Application", back_populates="compliance_records")  # Cross-service reference
    standard = relationship("ComplianceStandard", back_populates="compliance_records")
    # assessor = relationship("User")  # Cross-service reference to shared users table


class VendorComplianceRecord(Base, TimestampMixin):
    """Compliance records for vendors"""
    __tablename__ = "vendor_compliance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    compliance_area = Column(String(255), nullable=False)  # Security, Privacy, etc.
    status = Column(SQLEnum(ComplianceStatus), nullable=False)
    assessment_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=True)
    certificate_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Foreign keys
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    assessor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    vendor = relationship("Vendor", back_populates="compliance_records")
    # assessor = relationship("User")  # Cross-service reference to shared users table


class Exception(Base, TimestampMixin):
    """Exception tracking model for compliance and operational exceptions"""
    __tablename__ = "exceptions"
    
    id = Column(Integer, primary_key=True, index=True)
    exception_name = Column(String(255), nullable=False, index=True)
    category = Column(SQLEnum(ExceptionCategory), nullable=False)
    severity = Column(SQLEnum(ExceptionSeverity), nullable=False)
    status = Column(SQLEnum(ExceptionStatus), nullable=False, default=ExceptionStatus.PENDING)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    comments = Column(Text, nullable=True)
    
    # Additional tracking fields
    risk_assessment = Column(Text, nullable=True)
    mitigation_plan = Column(Text, nullable=True)
    approval_status = Column(String(50), nullable=True, default="pending")  # pending, approved, rejected
    approved_by_id = Column(Integer, nullable=True)  # Cross-service ref to users
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Foreign keys (no FK constraint — users table lives in monolith)
    # organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)  # Cross-service reference
    created_by_id = Column(Integer, nullable=True)   # Cross-service ref to users
    assigned_to_id = Column(Integer, nullable=True)  # Cross-service ref to users
    
    # Relationships
    # organization = relationship("Organization", back_populates="exceptions")  # Cross-service reference
    # created_by = relationship("User", foreign_keys=[created_by_id])  # Cross-service reference
    # assigned_to = relationship("User", foreign_keys=[assigned_to_id])  # Cross-service reference
    # approved_by = relationship("User", foreign_keys=[approved_by_id])  # Cross-service reference


class Assignment(Base, TimestampMixin):
    """Assignment grouping for assessments (e.g., quarterly assessment)"""
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=True)  # open, in_progress, completed

    # Foreign keys
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    standard_id = Column(Integer, ForeignKey("compliance_standards.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_date = Column(Date, nullable=True)

    # Relationships
    vendor = relationship("Vendor")
    standard = relationship("ComplianceStandard")
    # created_by = relationship("User")  # Cross-service reference to shared users table
    assessments = relationship("Assessment", back_populates="assignment")


class Assessment(Base, TimestampMixin):
    """Assessment record per control under an assignment"""
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    # Link to a compliance requirement if available
    compliance_requirement_id = Column(Integer, ForeignKey("compliance_requirements.id"), nullable=True)
    control_identifier = Column(String(100), nullable=True)  # e.g., 'C1.1' or 'A5.1.1'
    compliant = Column(Boolean, default=False, nullable=False)
    remark = Column(Text, nullable=True)
    poc = Column(String(500), nullable=True)
    status = Column(String(50), nullable=True)  # implemented, notImplemented, notApplicable
    assessor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    assignment = relationship("Assignment", back_populates="assessments")
    vendor = relationship("Vendor")
    compliance_requirement = relationship("ComplianceRequirement")
    # assessor = relationship("User")  # Cross-service reference to shared users table
