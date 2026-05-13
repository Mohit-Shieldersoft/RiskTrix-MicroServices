from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, BigInteger, UUID, Text
from app.db.session import Base
import uuid
from datetime import datetime

class BinaryScan(Base):
    __tablename__ = "binary_scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True))
    file_path = Column(Text, nullable=False)
    file_name = Column(String, nullable=False)
    sha256 = Column(String(64), nullable=False)
    md5 = Column(String(32))
    file_size = Column(BigInteger)
    entropy = Column(Float)
    file_type = Column(String)
    is_signed = Column(Boolean, default=False)
    yara_matched = Column(Boolean, default=False)
    malware_score = Column(Integer, default=0)
    scanned_at = Column(DateTime, default=datetime.utcnow)

class YaraMatch(Base):
    __tablename__ = "yara_matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True))
    rule_name = Column(String, nullable=False)
    rule_description = Column(Text)
    matched_at = Column(DateTime, default=datetime.utcnow)