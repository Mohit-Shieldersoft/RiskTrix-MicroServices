from sqlalchemy import Column, Integer, String, DateTime, Boolean, UUID
from app.db.database import Base
import uuid
from datetime import datetime

class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hostname = Column(String, nullable=False)
    os = Column(String, nullable=False)
    arch = Column(String, nullable=False)
    ip_address = Column(String)
    agent_version = Column(String)
    status = Column(String, default="active")
    last_heartbeat = Column(DateTime)
    registered_at = Column(DateTime, default=datetime.utcnow)

class ScanRequest(Base):
    __tablename__ = "scan_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")  # pending, completed, failed
    completed_at = Column(DateTime)
    scan_type = Column(String, default="full")  # full, quick, custom