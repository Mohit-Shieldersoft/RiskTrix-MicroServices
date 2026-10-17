import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base


class CloudAccount(Base):
    __tablename__ = "cloud_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    provider = Column(String(50), nullable=False)  # AWS, AZURE, GCP
    account_id = Column(String(100), nullable=False, unique=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, SYNCING, ERROR, DISCONNECTED
    region = Column(String(100), default="us-east-1")
    credentials = Column(JSON, nullable=True)
    assets_count = Column(Integer, default=0)
    findings_count = Column(Integer, default=0)
    last_synced = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class CloudAsset(Base):
    __tablename__ = "cloud_assets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    asset_type = Column(String(100), nullable=False)  # COMPUTE, STORAGE, DATABASE, IAM, NETWORK, KUBERNETES
    provider = Column(String(50), nullable=False)  # AWS, AZURE, GCP
    region = Column(String(100), default="us-east-1")
    resource_id = Column(String(500), nullable=False)
    risk_score = Column(Float, default=0.0)
    compliance_status = Column(String(50), default="COMPLIANT")  # COMPLIANT, NON_COMPLIANT, UNEVALUATED
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CSPMPolicy(Base):
    __tablename__ = "cspm_policies"

    id = Column(String(100), primary_key=True)  # e.g., POL-AWS-001
    rule_id = Column(String(100), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    framework = Column(String(100), nullable=False)  # CIS_v1.4, NIST_800_53, PCI_DSS_v4.0
    section = Column(String(255), nullable=True)
    severity = Column(String(50), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    provider = Column(String(50), nullable=False)  # AWS, AZURE, GCP, ALL
    service = Column(String(100), nullable=True)
    enabled = Column(Boolean, default=True)
    auto_remediable = Column(Boolean, default=False)
    remediation_steps = Column(Text, nullable=True)


class CSPMFinding(Base):
    __tablename__ = "cspm_findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_id = Column(String(100), nullable=False)
    account_id = Column(String(100), nullable=False)
    account_name = Column(String(255), nullable=True)
    asset_name = Column(String(255), nullable=False)
    resource_id = Column(String(500), nullable=False)
    title = Column(String(255), nullable=False)
    severity = Column(String(50), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(50), default="OPEN")  # OPEN, SUPPRESSED, REMEDIATED
    compliance_framework = Column(String(100), default="CIS_v1.4")
    remediation_playbook = Column(Text, nullable=True)
    assigned_to = Column(String(255), nullable=True)
    evidence = Column(JSON, nullable=True)
    sla_due_at = Column(DateTime, nullable=True)
    deduplication_key = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ScanJob(Base):
    __tablename__ = "cspm_scan_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(String(100), nullable=True)
    provider = Column(String(50), nullable=True)
    status = Column(String(50), default="RUNNING")  # RUNNING, COMPLETED, FAILED
    triggered_by = Column(String(100), default="manual")
    total_assets = Column(Integer, default=0)
    findings_created = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    details = Column(JSON, nullable=True)


class SecurityScoreSnapshot(Base):
    __tablename__ = "cspm_security_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    overall_score = Column(Float, default=100.0)
    posture_score = Column(Float, default=100.0)
    iam_score = Column(Float, default=100.0)
    vuln_score = Column(Float, default=100.0)
    compliance_score = Column(Float, default=100.0)
    critical_findings = Column(Integer, default=0)
    high_findings = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class CloudReport(Base):
    __tablename__ = "cspm_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    format = Column(String(20), default="JSON")
    content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)


class GuidedAction(Base):
    __tablename__ = "cspm_guided_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type = Column(String(50), nullable=False)  # toxic, attack_path, secret
    entity_id = Column(String(200), nullable=False)
    status = Column(String(50), default="GUIDED")
    cloud_mutated = Column(Boolean, default=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SecretRevocation(Base):
    __tablename__ = "cspm_secret_revocations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    secret_id = Column(String(200), nullable=False, unique=True)
    status = Column(String(50), default="GUIDED_REVOKE")
    cloud_mutated = Column(Boolean, default=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
