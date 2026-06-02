from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class AgentCreate(BaseModel):
    email: str
    name: str
    team: str
    tier: str = "standard"
    categories: Optional[str] = ""
    is_active: bool = True


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    team: Optional[str] = None
    tier: Optional[str] = None
    categories: Optional[str] = None
    is_active: Optional[bool] = None


class AgentResponse(BaseModel):
    id: int
    email: str
    name: str
    team: str
    tier: str
    categories: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentLookup(BaseModel):
    """Minimal response used by AutoAssign engine."""
    email: str
    name: str
    team: str
    tier: str

    class Config:
        from_attributes = True
