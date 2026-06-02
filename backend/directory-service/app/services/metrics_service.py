from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.metrics import AgentMetric
from app.models.agent import Agent
from app.schemas.metrics import MetricCreate


# ─────────────────────────────────────────────────────────────────────────────
# Record
# ─────────────────────────────────────────────────────────────────────────────

def record_metric(db: Session, data: MetricCreate) -> AgentMetric:
    metric = AgentMetric(**data.model_dump())
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric


# ─────────────────────────────────────────────────────────────────────────────
# Retrieve
# ─────────────────────────────────────────────────────────────────────────────

def get_metrics_for_agent(db: Session, agent_id: int, limit: int = 50) -> list:
    return (
        db.query(AgentMetric)
        .filter(AgentMetric.agent_id == agent_id)
        .order_by(AgentMetric.recorded_at.desc())
        .limit(limit)
        .all()
    )


def get_agent_summary(db: Session, agent_id: int) -> dict:
    metrics = db.query(AgentMetric).filter(AgentMetric.agent_id == agent_id).all()

    if not metrics:
        return {
            "agent_id": agent_id,
            "total_tickets": 0,
            "avg_resolution_time_minutes": None,
            "avg_quality_score": None,
            "sla_compliance_pct": None,
            "by_priority": {},
            "by_category": {},
        }

    rt_values = [m.resolution_time_minutes for m in metrics if m.resolution_time_minutes is not None]
    qs_values = [m.quality_score for m in metrics if m.quality_score is not None]
    sla_values = [m.sla_met for m in metrics if m.sla_met is not None]

    by_priority: dict = {}
    by_category: dict = {}
    for m in metrics:
        if m.priority:
            by_priority[m.priority] = by_priority.get(m.priority, 0) + 1
        if m.category:
            by_category[m.category] = by_category.get(m.category, 0) + 1

    return {
        "agent_id": agent_id,
        "total_tickets": len(metrics),
        "avg_resolution_time_minutes": round(sum(rt_values) / len(rt_values), 1) if rt_values else None,
        "avg_quality_score": round(sum(qs_values) / len(qs_values), 2) if qs_values else None,
        "sla_compliance_pct": round(
            sum(1 for v in sla_values if v) / len(sla_values) * 100, 1
        ) if sla_values else None,
        "by_priority": by_priority,
        "by_category": by_category,
    }


def get_leaderboard(db: Session) -> list:
    """Rank all agents by average quality score (desc), then avg resolution time (asc)."""
    agents = db.query(Agent).filter(Agent.is_active == True).all()

    rows = []
    for agent in agents:
        summary = get_agent_summary(db, agent.id)
        if summary["total_tickets"] == 0:
            continue
        rows.append({
            "agent_id": agent.id,
            "agent_name": agent.name,
            "agent_email": agent.email,
            "agent_team": agent.team,
            **summary,
        })

    # Sort: higher quality score first; break ties by lower avg resolution time
    rows.sort(
        key=lambda r: (
            -(r["avg_quality_score"] or 0),
            r["avg_resolution_time_minutes"] or 9999,
        )
    )

    for i, row in enumerate(rows, start=1):
        row["rank"] = i

    return rows
