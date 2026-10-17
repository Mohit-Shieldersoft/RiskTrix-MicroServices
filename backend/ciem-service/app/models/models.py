import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from app.db.session import Base


class IAMIdentity(Base):
    __tablename__ = "iam_identities"

    id = Column(String(255), primary_key=True)  # ARN or Unique ID
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # USER, ROLE, GROUP, SERVICE_ACCOUNT, SERVICE_PRINCIPAL
    provider = Column(String(50), nullable=False)  # AWS, AZURE, GCP
    account_id = Column(String(100), nullable=False)
    account_name = Column(String(255), nullable=True)
    granted_permissions_count = Column(Integer, default=0)
    used_permissions_count = Column(Integer, default=0)
    excessive_percentage = Column(Float, default=0.0)
    is_dormant = Column(Boolean, default=False)
    is_overprivileged = Column(Boolean, default=False)
    last_active = Column(DateTime, default=datetime.utcnow)
    privilege_risk_score = Column(Float, default=0.0)
    policies = Column(Text, nullable=True)  # Comma-separated or JSON list
    unused_services = Column(Text, nullable=True)  # Comma-separated or JSON list
    recommended_policy = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)



class IAMPolicyEntitlement(Base):
    __tablename__ = "iam_policy_entitlements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    identity_id = Column(String(255), nullable=False)
    policy_name = Column(String(255), nullable=False)
    action = Column(String(255), nullable=False)
    resource = Column(String(500), nullable=False)
    is_used = Column(Boolean, default=False)
    last_used_at = Column(DateTime, nullable=True)
    is_high_risk = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class IAMGraphEdge(Base):
    __tablename__ = "iam_graph_edges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String(255), nullable=False)
    target = Column(String(255), nullable=False)
    relationship = Column(String(100), nullable=False)  # CAN_ASSUME_ROLE, HAS_POLICY, MEMBER_OF
    is_escalation_path = Column(Boolean, default=False)
