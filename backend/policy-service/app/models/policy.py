from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime
from app.db.database import Base

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    category = Column(String, default="device_security")  # device_security, app_control, network
    platform = Column(String, default="all")              # all, android, windows, ios, macos

    # Device Security Controls
    require_screen_lock = Column(Boolean, default=False)
    min_password_length = Column(Integer, default=0)
    password_complexity = Column(Boolean, default=False)
    password_expiry_days = Column(Integer, default=0)

    # Connectivity Controls
    bluetooth_disabled = Column(Boolean, default=False)
    usb_disabled = Column(Boolean, default=False)
    wifi_restricted = Column(Boolean, default=False)

    # OS Controls
    os_update_required = Column(Boolean, default=False)
    min_os_version = Column(String, default="")

    # Encryption
    encryption_required = Column(Boolean, default=False)

    status = Column(String, default="active")  # active, draft, archived
    created_at = Column(DateTime, default=datetime.utcnow)