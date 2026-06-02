from pydantic import BaseModel, field_validator
from typing import Optional, Dict
from datetime import datetime


class AvailabilitySet(BaseModel):
    """Set or update an agent's working hours schedule."""
    timezone: str = "UTC"
    # Keys: monday|tuesday|wednesday|thursday|friday|saturday|sunday
    # Values: "HH:MM-HH:MM"  e.g. "09:00-17:00"
    weekly_schedule: Optional[Dict[str, str]] = None
    is_on_leave: bool = False
    leave_until: Optional[datetime] = None


class AvailabilityResponse(BaseModel):
    id: int
    agent_id: int
    timezone: str
    weekly_schedule: Optional[Dict[str, str]] = None
    is_on_leave: bool
    leave_until: Optional[datetime]
    updated_at: datetime
    # Computed fields (not stored in DB — populated by service)
    is_available_now: bool = False
    is_on_call_now: bool = False

    class Config:
        from_attributes = True


class OnCallCreate(BaseModel):
    agent_id: int
    start_time: datetime
    end_time: datetime
    schedule_type: str = "primary"   # primary | backup
    notes: Optional[str] = None


class OnCallUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    schedule_type: Optional[str] = None
    notes: Optional[str] = None


class OnCallResponse(BaseModel):
    id: int
    agent_id: int
    start_time: datetime
    end_time: datetime
    schedule_type: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CurrentOnCallEntry(BaseModel):
    """Summary of a currently active on-call agent."""
    agent_id: int
    agent_name: str
    agent_email: str
    agent_team: str
    schedule_type: str
    start_time: datetime
    end_time: datetime
