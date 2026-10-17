from datetime import datetime
import uuid
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base


class VulnerabilityFeedItem(Base):
    __tablename__ = "vulnerability_feed_items"

    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(String, unique=True, index=True, nullable=False)
    summary = Column(Text, nullable=True)
    cvss_v3_score = Column(Float, nullable=True, default=0.0)
    severity = Column(String, nullable=True, default="UNKNOWN")  # CRITICAL, HIGH, MEDIUM, LOW
    
    # CISA Known Exploited Vulnerability (KEV) fields
    is_cisa_kev = Column(Boolean, default=False, index=True)
    kev_date_added = Column(String, nullable=True)
    kev_required_action = Column(Text, nullable=True)
    kev_due_date = Column(String, nullable=True)
    
    # FIRST Exploit Prediction Scoring System (EPSS) fields
    epss_score = Column(Float, default=0.0, index=True)  # 0.0 to 1.0 (e.g. 0.9423 = 94.23% exploit probability)
    epss_percentile = Column(Float, default=0.0)         # 0.0 to 1.0
    
    cwe_id = Column(String, nullable=True)
    vendor_project = Column(String, nullable=True)
    product = Column(String, nullable=True)
    published_date = Column(DateTime, default=datetime.utcnow)
    last_modified_date = Column(DateTime, default=datetime.utcnow)


class ThreatFeedSync(Base):
    __tablename__ = "threat_feed_syncs"

    id = Column(Integer, primary_key=True, index=True)
    feed_name = Column(String, nullable=False, unique=True)  # NIST_NVD_V2, CISA_KEV, FIRST_EPSS
    source_url = Column(String, nullable=False)
    status = Column(String, nullable=False, default="SUCCESS")  # SUCCESS, SYNCING, ERROR
    total_records = Column(Integer, default=0)
    last_sync_time = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True)


class CVEFinding(Base):
    __tablename__ = "cve_findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), nullable=True)
    cve_id = Column(String, nullable=False)
    severity = Column(String, nullable=True)
    cvss_score = Column(Float, nullable=True)
    affected_binary = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    detected_at = Column(DateTime, default=datetime.utcnow)


class IOCMatch(Base):
    __tablename__ = "ioc_matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), nullable=True)
    ioc_type = Column(String, nullable=False)
    ioc_value = Column(String, nullable=False)
    threat_name = Column(String, nullable=True)
    confidence = Column(Integer, nullable=True)
    matched_at = Column(DateTime, default=datetime.utcnow)