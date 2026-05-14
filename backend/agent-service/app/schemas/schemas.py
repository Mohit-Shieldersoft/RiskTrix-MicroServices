from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AgentBase(BaseModel):
    hostname: str
    os: str
    os_version: Optional[str] = None
    kernel_version: Optional[str] = None
    arch: str
    ip_address: Optional[str] = None
    agent_version: Optional[str] = None

class AgentCreate(AgentBase):
    secret_key: str

class Agent(AgentBase):
    id: str
    status: str
    last_heartbeat: Optional[datetime]
    last_scan_at: Optional[datetime]
    registered_at: datetime

    class Config:
        from_attributes = True

class Heartbeat(BaseModel):
    status: str
    cpu_usage: float
    mem_usage: float
    last_scan_at: datetime