from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float
from datetime import datetime
from app.db.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_uid = Column(String, default="")
    name = Column(String, nullable=False)
    platform = Column(String, nullable=False)
    os_version = Column(String, default="")
    serial_number = Column(String, default="")
    device_model = Column(String, default="")
    manufacturer = Column(String, default="")
    mac_address = Column(String, default="")
    status = Column(String, default="active")   # active | offline | inactive
    owner = Column(String, default="")
    department = Column(String, default="")
    enrollment_status = Column(String, default="unenrolled")
    risk_level = Column(String, default="low")
    created_at = Column(DateTime, default=datetime.utcnow)

    # ── Heartbeat / Agent fields ──────────────────────────
    last_seen = Column(DateTime, nullable=True)
    battery_level = Column(Integer, nullable=True)      # 0–100 %
    storage_used = Column(Float, nullable=True)         # GB
    storage_total = Column(Float, nullable=True)        # GB
    agent_version = Column(String, nullable=True)
    network_status = Column(String, nullable=True)      # wifi | cellular | ethernet | none
    ip_address = Column(String, nullable=True)
    online = Column(Boolean, default=False)


class PolicyDeviceAssignment(Base):
    __tablename__ = "policy_device_assignments"

    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, nullable=False)
    device_id = Column(Integer, nullable=False)
    assigned_by = Column(String, default="admin")
    assigned_at = Column(DateTime, default=datetime.utcnow)
    deployment_status = Column(String, default="pending")
    deployment_message = Column(String, default="")
    applied_at = Column(DateTime, nullable=True)
    last_checked_at = Column(DateTime, nullable=True)
    compliance_status = Column(String, default="unknown")
    compliance_score = Column(Integer, default=0)


class ComplianceViolation(Base):
    __tablename__ = "compliance_violations"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, nullable=False)
    policy_assignment_id = Column(Integer, nullable=False)
    violation_type = Column(String, nullable=False)
    severity = Column(String, default="medium")
    description = Column(Text, default="")
    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    old_values = Column(String, nullable=True)  # JSON stored as text
    new_values = Column(String, nullable=True)  # JSON stored as text
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    user_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DeviceActivity(Base):
    __tablename__ = "device_activities"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, nullable=False)
    event_type = Column(String, nullable=False)
    message = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class DeviceGroup(Base):
    __tablename__ = "device_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, default="")
    # static | smart
    group_type = Column(String, default="static")
    # smart rule stored as JSON string e.g. '{"field":"platform","op":"eq","value":"android"}'
    smart_rule = Column(Text, nullable=True)
    created_by = Column(String, default="admin")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DeviceGroupMember(Base):
    __tablename__ = "device_group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, nullable=False, index=True)
    device_id = Column(Integer, nullable=False, index=True)
    added_at = Column(DateTime, default=datetime.utcnow)


class GroupPolicyAssignment(Base):
    __tablename__ = "group_policy_assignments"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, nullable=False, index=True)
    policy_id = Column(Integer, nullable=False, index=True)
    assigned_by = Column(String, default="admin")
    assigned_at = Column(DateTime, default=datetime.utcnow)


class ComplianceResult(Base):
    """Per-check compliance results for each device+policy pair."""
    __tablename__ = "compliance_results"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, nullable=False, index=True)
    policy_id = Column(Integer, nullable=False, index=True)
    assignment_id = Column(Integer, nullable=False, index=True)

    # e.g. screen_lock, encryption, os_update, password_length,
    #      password_complexity, bluetooth, usb, wifi, password_expiry
    compliance_type = Column(String, nullable=False)
    status = Column(String, default="pass")     # pass | fail | warning
    severity = Column(String, default="medium") # low | medium | high | critical
    weight = Column(Integer, default=10)        # contribution to score (0-100 total)
    detail = Column(Text, default="")           # human-readable description
    remediation_required = Column(Boolean, default=False)
    checked_at = Column(DateTime, default=datetime.utcnow)