"""Application Service Data Models.

This module defines the database models owned by the Application Service.
Uses shared database with main monolith during transition phase.
"""
from sqlalchemy import Boolean, Column, Integer, String, DateTime, Text, Enum as SQLEnum, ForeignKey, JSON, Numeric, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum

from app.db.session import Base


class RiskLevel(str, Enum):
    """Risk levels enumeration"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class VulnerabilityStatus(str, Enum):
    """Vulnerability status enumeration"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"
    FALSE_POSITIVE = "false_positive"
    ACCEPTED_RISK = "accepted_risk"


class ApplicationType(str, Enum):
    """Application type enumeration"""
    WEB_APPLICATION = "web_application"
    MOBILE_APPLICATION = "mobile_application"
    DESKTOP_APPLICATION = "desktop_application"
    API_SERVICE = "api_service"
    DATABASE = "database"
    INFRASTRUCTURE = "infrastructure"
    THIRD_PARTY = "third_party"


class TimestampMixin:
    """Mixin to add timestamp fields to models"""
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)


class User(Base, TimestampMixin):
    """Minimal User model for auth — maps to the shared users table."""
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    role = Column(String(50), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    phone = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True)
    profile_type = Column(String(100), nullable=True)
    company = Column(String(255), nullable=True)
    privilege_level = Column(String(50), default="standard", nullable=False)
    clearance_level = Column(String(50), default="low", nullable=False)


class Organization(Base, TimestampMixin):
    """Minimal Organization model — stub so SQLAlchemy can resolve FK from applications.organization_id."""
    __tablename__ = "organizations"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)


class Vendor(Base, TimestampMixin):
    """Minimal Vendor model — stub so SQLAlchemy can resolve FK from vulnerabilities.vendor_id."""
    __tablename__ = "vendors"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)


class Application(Base, TimestampMixin):
    """Application model - owned by Application Service"""
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    application_type = Column(SQLEnum(ApplicationType), nullable=False)
    version = Column(String(50), nullable=True)
    url = Column(String(500), nullable=True)
    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.MEDIUM, nullable=False)
    business_criticality = Column(String(50), nullable=True)
    data_classification = Column(String(50), nullable=True)
    
    # Owner and vendor information (string fields for simple data entry)
    owner = Column(String(255), nullable=True)  # Owner name/email
    vendor_name = Column(String(255), nullable=True)  # Vendor name if third-party
    
    # Foreign keys (references to shared tables)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    # Technical details
    technology_stack = Column(JSON, nullable=True)  # Store as JSON
    environment = Column(String(50), nullable=True)  # dev, staging, production
    hosting_type = Column(String(50), nullable=True)  # cloud, on-premise, hybrid
    
    # Compliance and security
    compliance_requirements = Column(JSON, nullable=True)  # List of compliance standards
    last_security_review = Column(Date, nullable=True)
    next_security_review = Column(Date, nullable=True)
    
    # Relationships (minimal for service boundary)
    vulnerabilities = relationship("Vulnerability", back_populates="application", cascade="all, delete-orphan")


class Vulnerability(Base, TimestampMixin):
    """Vulnerability model - owned by Application Service"""
    __tablename__ = "vulnerabilities"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=True)
    cve_id = Column(String(20), nullable=True, index=True)  # CVE-2023-1234
    severity = Column(SQLEnum(RiskLevel), nullable=False)
    status = Column(SQLEnum(VulnerabilityStatus), default=VulnerabilityStatus.OPEN, nullable=False, index=True)
    
    # Discovery information
    discovered_date = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    source = Column(String(100), nullable=True)  # Scanner, Manual, External report, etc.
    
    # Risk scoring
    cvss_score = Column(Numeric(3, 1), nullable=True)  # 0.0 to 10.0
    cvss_vector = Column(String(200), nullable=True)
    exploit_available = Column(Boolean, default=False, nullable=False)
    
    # Remediation
    remediation_plan = Column(Text, nullable=True)
    remediation_deadline = Column(Date, nullable=True)
    remediation_completed = Column(DateTime(timezone=True), nullable=True)
    
    # Closure tracking fields
    remarks = Column(Text, nullable=True)
    impact = Column(Text, nullable=True)
    poc_file_path = Column(String(500), nullable=True)
    
    # Foreign keys
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)  # Reference only
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Reference only
    
    # Relationships
    application = relationship("Application", back_populates="vulnerabilities")


class EOSLRecord(Base, TimestampMixin):
    """End of Service Life tracking - mapped to shared eosl_records table"""
    __tablename__ = "eosl_records"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(255), nullable=False, index=True)
    vendor_name = Column(String(255), nullable=False)
    version = Column(String(100), nullable=True)
    category = Column(String(100), nullable=True)

    # EOSL dates
    end_of_sale_date = Column(Date, nullable=True)
    end_of_support_date = Column(Date, nullable=True)
    end_of_extended_support_date = Column(Date, nullable=True)

    # Risk and impact
    risk_level = Column(SQLEnum(RiskLevel), nullable=False)
    business_impact = Column(Text, nullable=True)
    remediation_plan = Column(Text, nullable=True)
    remediation_deadline = Column(Date, nullable=True)

    # Foreign keys (reference only)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
