import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from app.db.session import Base


class K8sCluster(Base):
    __tablename__ = "k8s_clusters"

    id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    provider = Column(String(50), nullable=False)  # EKS, AKS, GKE, ON_PREM
    version = Column(String(50), nullable=False)
    region = Column(String(100), default="us-east-1")
    status = Column(String(50), default="ACTIVE")  # ACTIVE, WARNING, CRITICAL
    nodes_count = Column(Integer, default=0)
    namespaces_count = Column(Integer, default=0)
    pods_count = Column(Integer, default=0)
    privileged_pods_count = Column(Integer, default=0)
    posture_score = Column(Float, default=100.0)
    last_audited = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class K8sPodAudit(Base):
    __tablename__ = "k8s_pod_audits"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_id = Column(String(100), nullable=False)
    cluster_id = Column(String(100), nullable=False)
    cluster_name = Column(String(255), nullable=True)
    namespace = Column(String(100), nullable=False)
    pod_name = Column(String(255), nullable=False)
    check_name = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(50), default="VIOLATION")  # VIOLATION, WARNING, PASSED
    description = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)



class ContainerImage(Base):
    __tablename__ = "container_images"

    id = Column(String(255), primary_key=True)
    registry = Column(String(50), nullable=False)  # ECR, ACR, GCR, DOCKER_HUB
    repository = Column(String(255), nullable=False)
    tag = Column(String(100), nullable=False)
    size_mb = Column(Float, default=0.0)
    critical_cve_count = Column(Integer, default=0)
    high_cve_count = Column(Integer, default=0)
    medium_cve_count = Column(Integer, default=0)
    low_cve_count = Column(Integer, default=0)
    has_sbom = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SBOMPackage(Base):
    __tablename__ = "sbom_packages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    image_id = Column(String(255), nullable=False)
    package_name = Column(String(255), nullable=False)
    version = Column(String(100), nullable=False)
    ecosystem = Column(String(50), nullable=False)  # PYPI, NPM, GO, DEB, ALPINE
    license = Column(String(100), default="MIT")
    cve_id = Column(String(100), nullable=True)
    severity = Column(String(50), nullable=True)


class RuntimeThreat(Base):
    __tablename__ = "runtime_threats"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    provider = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    severity = Column(String(50), default="HIGH")
    status = Column(String(50), default="OPEN")
    source = Column(String(100), default="GuardDuty")
    resource_id = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class RuntimeEvent(Base):
    __tablename__ = "runtime_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    threat_id = Column(String(36), nullable=True)
    event_type = Column(String(100), nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
