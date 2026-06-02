from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class DeviceResponse(BaseModel):
    id: int
    device_uid: Optional[str] = None
    name: str
    platform: str
    os_version: str
    status: str
    owner: str
    department: Optional[str] = None
    enrollment_status: Optional[str] = None
    risk_level: Optional[str] = None
    last_seen: Optional[datetime] = None
    online: Optional[bool] = None
    created_at: datetime

    class Config:
        orm_mode = True


class AssignPolicyRequest(BaseModel):
    device_ids: List[int]


class AssignmentResponse(BaseModel):
    id: int
    policy_id: int
    device_id: int
    assigned_at: datetime
    deployment_status: str

    class Config:
        orm_mode = True


class DeviceWithAssignment(BaseModel):
    id: int
    name: str
    platform: str
    os_version: str
    status: str
    owner: str
    assigned: bool
    deployment_status: Optional[str] = None

    class Config:
        orm_mode = True