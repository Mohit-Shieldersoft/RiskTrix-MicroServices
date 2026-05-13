from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AgentBase(BaseModel):
    hostname: str
    os: str
    arch: str
    ip_address: Optional[str] = None
    agent_version: Optional[str] = None

class AgentCreate(AgentBase):
    secret_key: str

class Agent(AgentBase):
    id: str
    status: str
    last_heartbeat: Optional[datetime]
    registered_at: datetime

    class Config:
        from_attributes = True

class Heartbeat(BaseModel):
    status: str
    cpu_usage: float
    mem_usage: float
    last_scan_at: datetime