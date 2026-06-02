"""
Analytics Router — Ticket Service
====================================
Exposes assignment tracking stats as required by the architecture diagrams:
  GET /analytics/assignment-stats   — counts by priority, category, team
  GET /analytics/agent-workload     — per-agent open-ticket counts
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta

from app.db.database import SessionLocal
from app.models.ticket import AssignmentLog, Ticket

router = APIRouter(prefix="/analytics", tags=["analytics"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/assignment-stats")
def assignment_stats(days: int = 30, db: Session = Depends(get_db)):
    """
    Returns auto-assignment counts grouped by priority, category, and team
    for the given lookback window (default: last 30 days).
    """
    since = datetime.utcnow() - timedelta(days=days)

    by_priority = (
        db.query(AssignmentLog.priority, func.count().label("count"))
        .filter(AssignmentLog.assigned_at >= since)
        .group_by(AssignmentLog.priority)
        .all()
    )
    by_category = (
        db.query(AssignmentLog.category, func.count().label("count"))
        .filter(AssignmentLog.assigned_at >= since)
        .group_by(AssignmentLog.category)
        .all()
    )
    by_team = (
        db.query(AssignmentLog.team, func.count().label("count"))
        .filter(AssignmentLog.assigned_at >= since)
        .group_by(AssignmentLog.team)
        .all()
    )
    total = db.query(func.count()).select_from(AssignmentLog).filter(
        AssignmentLog.assigned_at >= since
    ).scalar()

    return {
        "period_days": days,
        "total_auto_assignments": total,
        "by_priority": [{"priority": r.priority, "count": r.count} for r in by_priority],
        "by_category": [{"category": r.category, "count": r.count} for r in by_category],
        "by_team": [{"team": r.team or "unassigned", "count": r.count} for r in by_team],
    }


@router.get("/agent-workload")
def agent_workload(db: Session = Depends(get_db)):
    """
    Returns open ticket count per agent (active tickets: new, assigned, in_progress).
    Also includes total tickets ever auto-assigned to each agent.
    """
    open_statuses = ["new", "assigned", "in_progress"]

    open_counts = (
        db.query(Ticket.assigned_to, func.count().label("open_tickets"))
        .filter(Ticket.status.in_(open_statuses), Ticket.assigned_to != "")
        .group_by(Ticket.assigned_to)
        .all()
    )
    auto_assign_counts = (
        db.query(AssignmentLog.assigned_to, func.count().label("total_auto_assigned"))
        .group_by(AssignmentLog.assigned_to)
        .all()
    )

    auto_map = {r.assigned_to: r.total_auto_assigned for r in auto_assign_counts}
    result = [
        {
            "agent": r.assigned_to,
            "open_tickets": r.open_tickets,
            "total_auto_assigned": auto_map.get(r.assigned_to, 0),
        }
        for r in open_counts
    ]
    result.sort(key=lambda x: x["open_tickets"], reverse=True)
    return result


@router.get("/ticket-stats")
def ticket_stats(db: Session = Depends(get_db)):
    """Summary counts: total, by status, by priority, by category."""
    by_status = (
        db.query(Ticket.status, func.count().label("count"))
        .group_by(Ticket.status)
        .all()
    )
    by_priority = (
        db.query(Ticket.priority, func.count().label("count"))
        .group_by(Ticket.priority)
        .all()
    )
    by_category = (
        db.query(Ticket.category, func.count().label("count"))
        .group_by(Ticket.category)
        .all()
    )
    total = db.query(func.count()).select_from(Ticket).scalar()

    return {
        "total": total,
        "by_status": [{"status": r.status, "count": r.count} for r in by_status],
        "by_priority": [{"priority": r.priority, "count": r.count} for r in by_priority],
        "by_category": [{"category": r.category, "count": r.count} for r in by_category],
    }
