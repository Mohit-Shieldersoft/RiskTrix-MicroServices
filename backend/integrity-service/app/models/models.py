from sqlalchemy import Column, String, DateTime, UUID, Text
from sqlalchemy.ext.declarative import declarative_base
import uuid
from datetime import datetime

Base = declarative_base()

class IntegrityBaseline(Base):
    __tablename__ = "integrity_baselines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True))
    file_path = Column(Text, nullable=False)
    sha256_baseline = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class IntegrityEvent(Base):
    __tablename__ = "integrity_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True))
    file_path = Column(Text, nullable=False)
    sha256_expected = Column(String(64))
    sha256_actual = Column(String(64))
    event_type = Column(String)
    detected_at = Column(DateTime, default=datetime.utcnow)