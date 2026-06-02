from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime


class TicketResult(BaseModel):
    id: int
    ticket_number: str
    title: str
    status: str
    priority: str
    category: str
    assigned_to: Optional[str] = None
    created_at: datetime
    source: str = "ticket"


class AssetResult(BaseModel):
    id: int
    name: str
    type: Optional[str] = None
    risk_level: Optional[str] = None
    vulnerabilities_count: int = 0
    created_at: datetime
    source: str = "asset"


class AgentResult(BaseModel):
    id: int
    email: str
    name: str
    team: Optional[str] = None
    tier: Optional[str] = None
    categories: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    source: str = "agent"


class PolicyResult(BaseModel):
    id: int
    name: str
    description: Optional[str] = ""
    category: Optional[str] = None
    platform: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime
    source: str = "policy"


class SearchResponse(BaseModel):
    query: str
    total: int
    tickets: List[TicketResult] = []
    assets: List[AssetResult] = []
    agents: List[AgentResult] = []
    policies: List[PolicyResult] = []
