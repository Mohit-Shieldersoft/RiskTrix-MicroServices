from sqlalchemy import Column, Integer, String, DateTime, Float, UUID, Text
from sqlalchemy.ext.declarative import declarative_base
import uuid
from datetime import datetime

Base = declarative_base()

class CVEFinding(Base):
    __tablename__ = "cve_findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True))
    cve_id = Column(String, nullable=False)
    severity = Column(String)
    cvss_score = Column(Float)
    affected_binary = Column(String)
    description = Column(Text)
    detected_at = Column(DateTime, default=datetime.utcnow)

class IOCMatch(Base):
    __tablename__ = "ioc_matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True))
    ioc_type = Column(String)
    ioc_value = Column(String, nullable=False)
    threat_name = Column(String)
    confidence = Column(Integer)
    matched_at = Column(DateTime, default=datetime.utcnow)