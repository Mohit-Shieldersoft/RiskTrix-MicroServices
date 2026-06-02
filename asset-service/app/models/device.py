from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float
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
    owner = Column(String, default="")
    department = Column(String, default="")
    enrollment_status = Column(String, default="unenrolled")
    status = Column(String, default="active")
    risk_level = Column(String, default="low")
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    battery_level = Column(Integer, nullable=True)
    storage_used = Column(Float, nullable=True)
    storage_total = Column(Float, nullable=True)
    agent_version = Column(String, nullable=True)
    network_status = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    online = Column(Boolean, default=False)


class EnrollmentToken(Base):
    __tablename__ = "enrollment_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, nullable=False)
    platform = Column(String, nullable=False)
    created_by = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    used_by_device_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class DeviceEnrollment(Base):
    __tablename__ = "device_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, nullable=False)
    token_id = Column(Integer, nullable=False)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    enrolled_by = Column(String, default="")
    enrollment_method = Column(String, default="token")
    status = Column(String, default="active")


class DeviceCheckin(Base):
    __tablename__ = "device_checkins"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, nullable=False)
    battery = Column(Integer, nullable=True)
    network = Column(String, default="")
    ip_address = Column(String, default="")
    checked_in_at = Column(DateTime, default=datetime.utcnow)


class DeviceCommand(Base):
    __tablename__ = "device_commands"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, nullable=False)
    command = Column(String, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    executed_at = Column(DateTime, nullable=True)