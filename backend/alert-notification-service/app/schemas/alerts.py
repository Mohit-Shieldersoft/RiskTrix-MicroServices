from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class SecurityAlertBase(BaseModel):
    title: str
    source_service: str
    severity: str
    asset_id: Optional[str] = None
    description: Optional[str] = None
    remediation_steps: Optional[str] = None
    sla_deadline_hours: Optional[int] = 24


class SecurityAlertCreate(SecurityAlertBase):
    alert_id: Optional[str] = None
    assigned_to: Optional[str] = None


class SecurityAlertUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    severity: Optional[str] = None


class SecurityAlertResponse(SecurityAlertBase):
    id: int
    alert_id: str
    status: str
    assigned_to: Optional[str] = None
    sla_status: Optional[str] = "ON_TRACK"  # ON_TRACK, NEAR_BREACH, BREACHED
    hours_remaining: Optional[float] = 24.0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WebhookChannelBase(BaseModel):
    name: str
    channel_type: str  # SLACK, TEAMS, EMAIL, SIEM_SPLUNK, WEBHOOK
    target_url: str
    enabled: bool = True
    events_filter: str = "CRITICAL,HIGH"


class WebhookChannelCreate(WebhookChannelBase):
    channel_id: Optional[str] = None


class WebhookChannelResponse(WebhookChannelBase):
    id: int
    channel_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class WebhookTestRequest(BaseModel):
    channel_id: Optional[str] = "test-channel"
    target_url: Optional[str] = None
    channel_type: Optional[str] = "GENERIC"
    sample_alert_id: Optional[str] = None


class WebhookTestResponse(BaseModel):
    channel_id: str
    status: str  # SUCCESS, FAILED
    status_code: int
    response_message: str
    timestamp: datetime


class SLAPolicyResponse(BaseModel):
    id: int
    policy_id: str
    name: str
    severity: str
    max_remediation_hours: int
    notify_before_hours: int
    created_at: datetime

    class Config:
        from_attributes = True


class AlertSummaryResponse(BaseModel):
    total_alerts: int
    open_alerts: int
    critical_alerts: int
    high_alerts: int
    medium_alerts: int
    sla_breached_count: int
    sla_near_breach_count: int
    active_webhook_channels: int
