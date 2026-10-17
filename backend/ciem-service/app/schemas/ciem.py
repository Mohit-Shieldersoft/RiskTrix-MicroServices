from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel


class IAMIdentityBase(BaseModel):
    id: str
    identity_id: Optional[str] = None
    name: str
    type: str  # USER, ROLE, GROUP, SERVICE_ACCOUNT, SERVICE_PRINCIPAL
    provider: str  # AWS, AZURE, GCP
    account_id: str
    account_name: Optional[str] = None
    granted_permissions_count: int
    used_permissions_count: int
    excessive_percentage: float
    is_dormant: bool
    is_overprivileged: Optional[bool] = False
    last_active: datetime
    privilege_risk_score: float
    risk_score: Optional[float] = None
    policies: Optional[List[str]] = []
    unused_services: Optional[List[str]] = []
    recommended_policy: Optional[str] = None

    def model_post_init(self, __context):
        if not self.identity_id:
            self.identity_id = self.id
        if self.risk_score is None:
            self.risk_score = self.privilege_risk_score


class IAMIdentityResponse(IAMIdentityBase):
    created_at: datetime

    class Config:
        from_attributes = True



class IAMEntitlementBase(BaseModel):
    identity_id: str
    policy_name: str
    action: str
    resource: str
    is_used: bool
    last_used_at: Optional[datetime] = None
    is_high_risk: bool


class IAMEntitlementResponse(IAMEntitlementBase):
    id: str

    class Config:
        from_attributes = True


# Graph Visualization schemas
class IAMGraphNode(BaseModel):
    id: str
    label: str
    type: str  # USER, ROLE, POLICY, RESOURCE
    provider: str
    risk_score: float
    is_dormant: bool


class IAMGraphLink(BaseModel):
    source: str
    target: str
    relationship: str
    is_escalation_path: bool


class IAMGraphTopologyResponse(BaseModel):
    nodes: List[IAMGraphNode]
    links: List[IAMGraphLink]
    privilege_escalation_paths_count: int


# Summary Schema
class CIEMSummaryResponse(BaseModel):
    total_identities: int
    total_users: int
    total_roles: int
    total_service_accounts: int
    dormant_identities_count: int
    excessive_permission_identities_count: int
    avg_privilege_risk_score: float
    high_risk_privilege_escalations_count: int
    provider_identities_breakdown: Dict[str, int]
