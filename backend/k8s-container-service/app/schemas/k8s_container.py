from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class K8sClusterBase(BaseModel):
    id: str
    cluster_id: Optional[str] = None
    name: str
    provider: str  # EKS, AKS, GKE, ON_PREM
    version: str
    region: Optional[str] = "us-east-1"
    status: Optional[str] = "ACTIVE"
    nodes_count: int
    namespaces_count: int
    pods_count: int
    privileged_pods_count: int
    posture_score: float
    last_audited: datetime

    def model_post_init(self, __context):
        if not self.cluster_id:
            self.cluster_id = self.id


class K8sClusterResponse(K8sClusterBase):
    created_at: datetime

    class Config:
        from_attributes = True


class K8sPodAuditBase(BaseModel):
    audit_id: str
    cluster_id: str
    cluster_name: Optional[str] = None
    namespace: str
    pod_name: str
    check_name: str
    severity: str
    status: str
    description: Optional[str] = None
    remediation: Optional[str] = None


class K8sPodAuditResponse(K8sPodAuditBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True



class ContainerImageBase(BaseModel):
    id: str
    registry: str  # ECR, ACR, GCR, DOCKER_HUB
    repository: str
    tag: str
    size_mb: float
    critical_cve_count: int
    high_cve_count: int
    medium_cve_count: int
    low_cve_count: int
    has_sbom: bool


class ContainerImageResponse(ContainerImageBase):
    created_at: datetime

    class Config:
        from_attributes = True


class SBOMPackageItem(BaseModel):
    id: str
    package_name: str
    version: str
    ecosystem: str
    license: str
    cve_id: Optional[str] = None
    severity: Optional[str] = None


class SBOMTreeResponse(BaseModel):
    image_id: str
    format: str = "CycloneDX-1.4"
    total_packages: int
    vulnerable_packages_count: int
    packages: List[SBOMPackageItem]


class K8sContainerSummaryResponse(BaseModel):
    total_clusters: int
    total_nodes: int
    total_pods: int
    privileged_pods_count: int
    total_container_images: int
    critical_vulnerabilities_count: int
    high_vulnerabilities_count: int
    scanned_registries_count: int
    overall_k8s_security_score: float
