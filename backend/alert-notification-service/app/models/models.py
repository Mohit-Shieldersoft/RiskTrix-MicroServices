from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text
from app.db.session import Base


class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    source_service = Column(String, nullable=False)  # CSPM, CIEM, K8S, AGENT, BINARY, INTEGRITY, THREAT, APP
    severity = Column(String, nullable=False)       # CRITICAL, HIGH, MEDIUM, LOW, INFO
    status = Column(String, nullable=False, default="OPEN")  # OPEN, IN_PROGRESS, RESOLVED, DISMISSED
    assigned_to = Column(String, nullable=True)
    asset_id = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    remediation_steps = Column(Text, nullable=True)
    sla_deadline_hours = Column(Integer, default=24)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WebhookIntegration(Base):
    __tablename__ = "webhook_integrations"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    channel_type = Column(String, nullable=False)  # SLACK, TEAMS, EMAIL, SIEM_SPLUNK, WEBHOOK
    target_url = Column(String, nullable=False)
    enabled = Column(Boolean, default=True)
    events_filter = Column(String, default="CRITICAL,HIGH")
    created_at = Column(DateTime, default=datetime.utcnow)


class SLAPolicy(Base):
    __tablename__ = "sla_policies"

    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    max_remediation_hours = Column(Integer, nullable=False)
    notify_before_hours = Column(Integer, default=2)
    created_at = Column(DateTime, default=datetime.utcnow)


class AlertComment(Base):
    __tablename__ = "alert_comments"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, nullable=False, index=True)
    author = Column(String, nullable=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SoarPlaybook(Base):
    __tablename__ = "soar_playbooks"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    trigger_event = Column(String, nullable=True)
    severity_threshold = Column(String, default="CRITICAL")
    is_active = Column(Boolean, default=True)
    steps = Column(Text, nullable=True)
    execution_count = Column(Integer, default=0)
    last_executed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SoarExecution(Base):
    __tablename__ = "soar_executions"

    id = Column(String, primary_key=True)
    playbook_id = Column(String, nullable=False)
    playbook_name = Column(String, nullable=True)
    triggered_by = Column(String, nullable=True)
    status = Column(String, default="COMPLETED")
    total_latency_ms = Column(Integer, default=0)
    steps_results = Column(Text, nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow)
