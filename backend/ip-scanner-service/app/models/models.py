import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, JSON
from app.db.session import Base


class IpScan(Base):
    __tablename__ = "ip_scans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    target = Column(String(255), nullable=False)
    label = Column(String(255), nullable=True)
    status = Column(String(50), default="COMPLETED")
    open_ports = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    risk_grade = Column(String(8), nullable=True)
    scan_options = Column(JSON, nullable=True)
    result = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class IpScheduledScan(Base):
    __tablename__ = "ip_scheduled_scans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=True)
    target = Column(String(255), nullable=False)
    cron = Column(String(100), default="0 2 * * *")
    enabled = Column(Boolean, default=True)
    scan_options = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class IpScanRange(Base):
    __tablename__ = "ip_scan_ranges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cidr = Column(String(64), nullable=False)
    label = Column(String(255), nullable=True)
    status = Column(String(50), default="PENDING")
    hosts_scanned = Column(Integer, default=0)
    scan_options = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
