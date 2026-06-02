from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import SessionLocal
from app.schemas.metrics import MetricCreate, MetricResponse, MetricSummary, LeaderboardEntry
from app.services.metrics_service import (
    record_metric, get_metrics_for_agent, get_agent_summary, get_leaderboard,
)
from app.models.agent import Agent

router = APIRouter(prefix="/directory", tags=["Performance Metrics"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/metrics", response_model=MetricResponse, status_code=201)
def add_metric(data: MetricCreate, db: Session = Depends(get_db)):
    """
    Record a performance metric for a resolved ticket.
    Called by ticket-service (or manually) when a ticket is resolved.

    Example body:
    ```json
    {
      "agent_id": 1,
      "ticket_id": 42,
      "ticket_number": "INC-00042",
      "resolution_time_minutes": 95,
      "quality_score": 8.5,
      "sla_met": true,
      "category": "security",
      "priority": "high"
    }
    ```
    """
    agent = db.query(Agent).filter(Agent.id == data.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if data.quality_score is not None and not (0.0 <= data.quality_score <= 10.0):
        raise HTTPException(status_code=400, detail="quality_score must be 0.0 – 10.0")
    return record_metric(db, data)


@router.get("/agents/{agent_id}/metrics", response_model=list[MetricResponse])
def list_metrics(
    agent_id: int,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
):
    """List the most recent metric entries for an agent."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return get_metrics_for_agent(db, agent_id, limit)


@router.get("/agents/{agent_id}/metrics/summary", response_model=MetricSummary)
def metrics_summary(agent_id: int, db: Session = Depends(get_db)):
    """
    Aggregated performance summary for an agent:
    avg resolution time, avg quality score, SLA compliance %, breakdown by priority/category.
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return get_agent_summary(db, agent_id)


@router.get("/metrics/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard(db: Session = Depends(get_db)):
    """
    Performance leaderboard: all agents ranked by quality score (desc),
    then by avg resolution time (asc). Only agents with at least 1 metric are included.
    """
    return get_leaderboard(db)
