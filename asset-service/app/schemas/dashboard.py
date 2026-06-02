from pydantic import BaseModel
from typing import Dict


class EnrollmentStatusResponse(BaseModel):
    successfully_enrolled: int
    pending: int
    failed: int
    awaiting_action: int


class RecentActivityItem(BaseModel):
    device: str
    user: str
    event: str
    time: str


class PolicyDeploymentStatusResponse(BaseModel):
    success: int
    pending: int
    failed: int


class RiskDistribution(BaseModel):
    high: int
    medium: int
    low: int


class AssetDashboardResponse(BaseModel):
    total_assets: int
    high_risk: int
    medium_risk: int
    low_risk: int
    riskDistribution: RiskDistribution
    byType: Dict[str, int]