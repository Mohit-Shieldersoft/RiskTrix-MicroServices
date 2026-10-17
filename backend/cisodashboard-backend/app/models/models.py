from sqlalchemy import Boolean, Column, Integer, String, DateTime, Text, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum
import enum

from app.db.session import Base


class UserRole(str, Enum):
    """User roles enumeration"""
    ADMIN = "ADMIN"
    CISO = "CISO"
    INFOSEC_MANAGER = "INFOSEC_MANAGER"
    EXTERNAL_AUDITOR = "EXTERNAL_AUDITOR"
    INTERNAL_AUDITOR = "INTERNAL_AUDITOR"
    SECURITY_ANALYST = "SECURITY_ANALYST"
    VIEWER = "VIEWER"


class TimestampMixin:
    """Mixin to add timestamp fields to models"""
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)


class User(Base, TimestampMixin):
    """User model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.VIEWER, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    phone = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True)
    # Profile-specific fields used by frontend
    profile_type = Column(String(100), nullable=True)  # e.g., ciso, vendor
    company = Column(String(255), nullable=True)
    privilege_level = Column(String(50), default='standard', nullable=False)
    clearance_level = Column(String(50), default='low', nullable=False)


class Organization(Base, TimestampMixin):
    """Organization model"""
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    industry = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)


class Invitation(Base, TimestampMixin):
    __tablename__ = "invitations"

    id = Column(String(36), primary_key=True)
    email = Column(String(255), nullable=False, index=True)
    role = Column(String(50), default="VIEWER", nullable=False)
    token = Column(String(64), unique=True, nullable=False, index=True)
    status = Column(String(50), default="PENDING", nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)


class IamRole(Base, TimestampMixin):
    __tablename__ = "iam_roles"

    id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    system = Column(Boolean, default=False, nullable=False)
    permissions = Column(Text, nullable=True)


class PlatformAuditLog(Base):
    __tablename__ = "platform_audit_logs"

    id = Column(String(36), primary_key=True)
    action = Column(String(50), nullable=False)
    detail = Column(Text, nullable=True)
    actor = Column(String(255), default="system")
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)


class ComplianceStandard(Base, TimestampMixin):
    __tablename__ = "compliance_standards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True)
    controls = Column(Integer, default=0)
    uploaded_on = Column(String(20), nullable=True)


class SmtpConfig(Base, TimestampMixin):
    __tablename__ = "smtp_configs"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    host = Column(String(255), nullable=False)
    username = Column(String(255), nullable=True)
    password = Column(String(255), nullable=True)
    port = Column(String(20), nullable=True)
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)

