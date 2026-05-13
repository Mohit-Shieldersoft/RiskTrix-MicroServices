from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CVEFindingBase(BaseModel):
    agent_id: str
    cve_id: str
    severity: Optional[str]
    cvss_score: Optional[float]
    affected_binary: Optional[str]
    description: Optional[str]

class CVEFinding(CVEFindingBase):
    id: str
    detected_at: datetime

    class Config:
        orm_mode = True

class IOCQuery(BaseModel):
    ioc_type: str  # hash, ip, domain
    ioc_value: str

class IOCResult(BaseModel):
    found: bool
    threat_name: Optional[str]
    confidence: Optional[int]