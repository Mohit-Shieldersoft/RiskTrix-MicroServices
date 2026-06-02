from pydantic import BaseModel, validator
from datetime import datetime, date
from typing import Optional, List


class AssetCreate(BaseModel):
    name: str
    type: str
    risk_level: str
    # lifecycle
    vendor:           Optional[str] = None
    owner:            Optional[str] = None
    custodian:        Optional[str] = None
    ip_address:       Optional[str] = None
    hostname:         Optional[str] = None
    purchase_date:    Optional[date] = None
    warranty_expiry:  Optional[date] = None
    end_of_life_date: Optional[date] = None
    # classification
    business_criticality: Optional[str] = None
    tags:            Optional[str] = None
    compliance_scope: Optional[str] = None

    @validator("name")
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError("Asset name cannot be empty")
        return v

    @validator("risk_level")
    def risk_level_must_be_valid(cls, v):
        valid = {"low", "medium", "high"}
        if v.lower() not in valid:
            raise ValueError(f"risk_level must be one of {valid}")
        return v.lower()

    @validator("type")
    def type_must_be_valid(cls, v):
        valid = {
            "web_application", "mobile_application", "api",
            "server", "database", "network_device", "endpoint",
            "cloud_service", "iot_device", "container",
            "firewall", "router", "switch", "load_balancer",
        }
        normalized = v.lower().replace(" ", "_")
        if normalized not in valid:
            raise ValueError(f"type must be one of {sorted(valid)}")
        return normalized


# ✅ All fields optional for partial update
class AssetUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    risk_level: Optional[str] = None
    vendor:           Optional[str] = None
    owner:            Optional[str] = None
    custodian:        Optional[str] = None
    ip_address:       Optional[str] = None
    hostname:         Optional[str] = None
    purchase_date:    Optional[date] = None
    warranty_expiry:  Optional[date] = None
    end_of_life_date: Optional[date] = None
    business_criticality: Optional[str] = None
    tags:            Optional[str] = None
    compliance_scope: Optional[str] = None
    changed_by:      Optional[str] = None   # passed by frontend for changelog

    @validator("name")
    def name_must_not_be_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError("Asset name cannot be empty")
        return v

    @validator("risk_level")
    def risk_level_must_be_valid(cls, v):
        if v is not None:
            valid = {"low", "medium", "high"}
            if v.lower() not in valid:
                raise ValueError(f"risk_level must be one of {valid}")
            return v.lower()
        return v

    @validator("type")
    def type_must_be_valid(cls, v):
        if v is not None:
            valid = {
                "web_application", "mobile_application", "api",
                "server", "database", "network_device", "endpoint",
                "cloud_service", "iot_device", "container",
                "firewall", "router", "switch", "load_balancer",
            }
            normalized = v.lower().replace(" ", "_")
            if normalized not in valid:
                raise ValueError(f"type must be one of {sorted(valid)}")
            return normalized
        return v


class AssetResponse(BaseModel):
    id: int
    name: str
    type: str
    risk_level: str
    vulnerabilities_count: int
    created_at: datetime

    # inventory
    serial_number: Optional[str] = None
    device_model:  Optional[str] = None
    rack_position: Optional[str] = None
    power_source:  Optional[str] = None
    power_watts:   Optional[str] = None
    location:      Optional[str] = None
    site:          Optional[str] = None
    notes:         Optional[str] = None

    # lifecycle
    vendor:           Optional[str] = None
    owner:            Optional[str] = None
    custodian:        Optional[str] = None
    ip_address:       Optional[str] = None
    hostname:         Optional[str] = None
    purchase_date:    Optional[date] = None
    warranty_expiry:  Optional[date] = None
    end_of_life_date: Optional[date] = None

    # classification
    business_criticality: Optional[str] = None
    tags:            Optional[str] = None
    compliance_scope: Optional[str] = None

    class Config:
        orm_mode = True


# ── Vulnerability schemas ─────────────────────────────────────────────────────

class VulnerabilityCreate(BaseModel):
    title: str
    cve_id:            Optional[str] = None
    severity:          Optional[str] = "medium"
    cvss_score:        Optional[float] = None
    description:       Optional[str] = None
    status:            Optional[str] = "open"
    remediation_notes: Optional[str] = None

class VulnerabilityUpdate(BaseModel):
    title:             Optional[str] = None
    cve_id:            Optional[str] = None
    severity:          Optional[str] = None
    cvss_score:        Optional[float] = None
    description:       Optional[str] = None
    status:            Optional[str] = None
    remediation_notes: Optional[str] = None
    resolved_at:       Optional[datetime] = None

class VulnerabilityResponse(BaseModel):
    id: int
    asset_id: int
    cve_id:            Optional[str] = None
    title: str
    severity: str
    cvss_score:        Optional[float] = None
    description:       Optional[str] = None
    status: str
    discovered_at: datetime
    resolved_at:       Optional[datetime] = None
    remediation_notes: Optional[str] = None

    class Config:
        orm_mode = True


# ── Software inventory schemas ────────────────────────────────────────────────

class SoftwareCreate(BaseModel):
    name: str
    vendor:         Optional[str] = None
    version:        Optional[str] = None
    patch_level:    Optional[str] = None
    is_outdated:    Optional[bool] = False
    is_licensed:    Optional[bool] = True
    license_expiry: Optional[date] = None
    install_date:   Optional[date] = None

class SoftwareResponse(BaseModel):
    id: int
    asset_id: int
    name: str
    vendor:         Optional[str] = None
    version:        Optional[str] = None
    patch_level:    Optional[str] = None
    is_outdated: bool
    is_licensed: bool
    license_expiry: Optional[date] = None
    install_date:   Optional[date] = None
    created_at: datetime

    class Config:
        orm_mode = True


# ── Change log schemas ────────────────────────────────────────────────────────

class ChangeLogResponse(BaseModel):
    id: int
    asset_id: int
    changed_by: str
    field_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_at: datetime

    class Config:
        orm_mode = True


# ── Bulk import result schemas ────────────────────────────────────────────────

class AssetImportRowError(BaseModel):
    row: int
    error: str
    data: Optional[dict] = None


class AssetImportResult(BaseModel):
    success: int
    failed: int
    errors: List[AssetImportRowError] = []
    message: str