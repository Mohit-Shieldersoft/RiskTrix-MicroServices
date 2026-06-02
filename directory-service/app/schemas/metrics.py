from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime


class MetricCreate(BaseModel):
    """Record a performance metric for one resolved ticket."""
    agent_id: int
    ticket_id: Optional[int] = None
    ticket_number: Optional[str] = None
    resolution_time_minutes: Optional[int] = None
    quality_score: Optional[float] = None   # 0.0 – 10.0
    sla_met: Optional[bool] = None
    category: Optional[str] = None
    priority: Optional[str] = None


class MetricResponse(BaseModel):
    id: int
    agent_id: int
    ticket_id: Optional[int]
    ticket_number: Optional[str]
    resolution_time_minutes: Optional[int]
    quality_score: Optional[float]
    sla_met: Optional[bool]
    category: Optional[str]
    priority: Optional[str]
    recorded_at: datetime

    class Config:
        from_attributes = True


class MetricSummary(BaseModel):
    """Aggregated performance summary for one agent."""
    agent_id: int
    total_tickets: int
    avg_resolution_time_minutes: Optional[float]
    avg_quality_score: Optional[float]
    sla_compliance_pct: Optional[float]
    by_priority: Dict[str, int] = {}
    by_category: Dict[str, int] = {}


class LeaderboardEntry(BaseModel):
    """One row in the performance leaderboard."""
    rank: int
    agent_id: int
    agent_name: str
    agent_email: str
    agent_team: str
    total_tickets: int
    avg_resolution_time_minutes: Optional[float]
    avg_quality_score: Optional[float]
    sla_compliance_pct: Optional[float]
