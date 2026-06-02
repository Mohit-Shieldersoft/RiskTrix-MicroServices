from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional, List


VALID_PLATFORMS = {"android", "windows", "ios", "macos", "linux"}
VALID_RISK_LEVELS = {"low", "medium", "high", "critical"}
VALID_STATUSES = {"active", "inactive", "lost", "decommissioned"}

# Template column headers for bulk upload (in order)
BULK_UPLOAD_COLUMNS = [
    "name", "platform", "device_uid", "device_model", "manufacturer",
    "serial_number", "mac_address", "os_version", "owner", "department",
    "risk_level", "status",
]


class DeviceResponse(BaseModel):
    id: int
    device_uid: str
    name: str
    platform: str
    os_version: str
    serial_number: str
    device_model: str
    manufacturer: str
    mac_address: str
    owner: str
    department: str
    enrollment_status: str
    status: str
    risk_level: str
    last_seen: Optional[datetime] = None
    created_at: datetime

    class Config:
        orm_mode = True


class GenerateTokenRequest(BaseModel):
    platform: str
    created_by: str
    expires_hours: Optional[int] = 24

    @validator("platform")
    def platform_valid(cls, v):
        valid = {"all", "android", "windows", "ios", "macos"}
        if v.lower() not in valid:
            raise ValueError(f"platform must be one of {valid}")
        return v.lower()


class TokenResponse(BaseModel):
    id: int
    token: str
    platform: str
    created_by: str
    expires_at: datetime
    used: bool
    used_at: Optional[datetime] = None
    used_by_device_id: Optional[int] = None
    created_at: datetime

    class Config:
        orm_mode = True


class EnrollDeviceRequest(BaseModel):
    token: str
    name: str
    platform: str
    os_version: Optional[str] = ""
    owner: Optional[str] = ""
    department: Optional[str] = ""
    device_model: Optional[str] = ""
    manufacturer: Optional[str] = ""
    serial_number: Optional[str] = ""
    mac_address: Optional[str] = ""


class CheckinRequest(BaseModel):
    device_uid: str
    battery: Optional[int] = None
    network: Optional[str] = ""
    ip_address: Optional[str] = ""


class CommandResponse(BaseModel):
    id: int
    device_id: int
    command: str
    status: str
    created_at: datetime
    executed_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class CommandCreate(BaseModel):
    command: str
    created_at: datetime
    executed_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class BulkUploadRowError(BaseModel):
    row: int
    error: str


class BulkUploadResult(BaseModel):
    created: int
    skipped: int
    errors: List[BulkUploadRowError] = []
    message: str