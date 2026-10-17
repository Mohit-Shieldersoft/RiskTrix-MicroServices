from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


# --- Cloud Account Schemas ---
class CloudAccountBase(BaseModel):
    name: str
    provider: str  # AWS, AZURE, GCP
    account_id: str
    region: Optional[str] = "us-east-1"
    credentials: Optional[dict] = None


class CloudAccountCreate(CloudAccountBase):
    pass


class CloudAccountResponse(CloudAccountBase):
    id: str
    status: str
    assets_count: int
    findings_count: int
    last_synced: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# --- Cloud Asset Schemas ---
class CloudAssetBase(BaseModel):
    account_id: str
    name: str
    asset_type: str
    provider: str
    region: Optional[str] = "us-east-1"
    resource_id: str
    risk_score: Optional[float] = 0.0
    compliance_status: Optional[str] = "COMPLIANT"
    details: Optional[str] = None


class CloudAssetCreate(CloudAssetBase):
    pass


class CloudAssetResponse(CloudAssetBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Policy Schemas ---
class CSPMPolicyBase(BaseModel):
    id: str
    policy_id: Optional[str] = None
    rule_id: Optional[str] = None
    title: str
    name: Optional[str] = None
    description: Optional[str] = None
    framework: str
    section: Optional[str] = None
    severity: str
    provider: str
    service: Optional[str] = None
    enabled: Optional[bool] = True
    auto_remediable: Optional[bool] = False
    remediation_steps: Optional[str] = None

    def model_post_init(self, __context):
        if not self.policy_id:
            self.policy_id = self.id
        if not self.name:
            self.name = self.title


class CSPMPolicyCreate(CSPMPolicyBase):
    pass


class CSPMPolicyResponse(CSPMPolicyBase):
    class Config:
        from_attributes = True


# --- Finding Schemas ---
class CSPMFindingBase(BaseModel):
    policy_id: str
    account_id: str
    account_name: Optional[str] = None
    asset_name: str
    resource_id: str
    title: str
    severity: str
    status: Optional[str] = "OPEN"
    compliance_framework: Optional[str] = "CIS_v1.4"
    remediation_playbook: Optional[str] = None


class CSPMFindingCreate(CSPMFindingBase):
    pass


class CSPMFindingResponse(CSPMFindingBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Dashboard / Summary Schemas ---
class CSPMSummaryResponse(BaseModel):
    total_accounts: int
    total_assets: int
    total_findings: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    compliance_score: Optional[float] = None
    provider_breakdown: dict
