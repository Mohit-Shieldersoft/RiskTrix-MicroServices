from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional


class PolicyCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    category: Optional[str] = "device_security"
    platform: Optional[str] = "all"

    # Device Security
    require_screen_lock: Optional[bool] = False
    min_password_length: Optional[int] = 0
    password_complexity: Optional[bool] = False
    password_expiry_days: Optional[int] = 0

    # Connectivity
    bluetooth_disabled: Optional[bool] = False
    usb_disabled: Optional[bool] = False
    wifi_restricted: Optional[bool] = False

    # OS
    os_update_required: Optional[bool] = False
    min_os_version: Optional[str] = ""

    # Encryption
    encryption_required: Optional[bool] = False

    status: Optional[str] = "active"

    @validator("name")
    def name_required(cls, v):
        if not v.strip():
            raise ValueError("Policy name is required")
        return v

    @validator("platform")
    def platform_valid(cls, v):
        valid = {"all", "android", "windows", "ios", "macos"}
        if v.lower() not in valid:
            raise ValueError(f"platform must be one of {valid}")
        return v.lower()

    @validator("category")
    def category_valid(cls, v):
        valid = {"device_security", "app_control", "network", "os_update"}
        if v.lower() not in valid:
            raise ValueError(f"category must be one of {valid}")
        return v.lower()


class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    platform: Optional[str] = None
    require_screen_lock: Optional[bool] = None
    min_password_length: Optional[int] = None
    password_complexity: Optional[bool] = None
    password_expiry_days: Optional[int] = None
    bluetooth_disabled: Optional[bool] = None
    usb_disabled: Optional[bool] = None
    wifi_restricted: Optional[bool] = None
    os_update_required: Optional[bool] = None
    min_os_version: Optional[str] = None
    encryption_required: Optional[bool] = None
    status: Optional[str] = None


class PolicyResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    platform: str
    require_screen_lock: bool
    min_password_length: int
    password_complexity: bool
    password_expiry_days: int
    bluetooth_disabled: bool
    usb_disabled: bool
    wifi_restricted: bool
    os_update_required: bool
    min_os_version: str
    encryption_required: bool
    status: str
    created_at: datetime

    class Config:
        orm_mode = True