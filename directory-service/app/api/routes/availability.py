from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx
import logging

from app.db.database import SessionLocal
from app.schemas.availability import (
    AvailabilitySet, AvailabilityResponse, OnCallCreate, OnCallResponse,
    CurrentOnCallEntry,
)
from app.services.availability_service import (
    get_availability_response, set_availability,
    create_on_call, get_on_call_for_agent, get_current_on_call,
    delete_on_call, get_available_agents_now, get_all_on_call,
)
from app.models.agent import Agent

router = APIRouter(prefix="/directory", tags=["Availability & On-Call"])
logger = logging.getLogger("directory-service.availability")

NOTIFICATION_SERVICE_URL = "http://localhost:8006/api/v1"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# Working-hours availability
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/agents/{agent_id}/availability", response_model=AvailabilityResponse)
def get_availability(agent_id: int, db: Session = Depends(get_db)):
    """Get agent's working schedule and current availability status."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return get_availability_response(db, agent_id)


@router.put("/agents/{agent_id}/availability", response_model=AvailabilityResponse)
def upsert_availability(agent_id: int, data: AvailabilitySet, db: Session = Depends(get_db)):
    """
    Set or update an agent's weekly schedule and leave status.

    Example body:
    ```json
    {
      "timezone": "UTC",
      "weekly_schedule": {
        "monday": "09:00-17:00",
        "tuesday": "09:00-17:00",
        "wednesday": "09:00-17:00",
        "thursday": "09:00-17:00",
        "friday": "09:00-17:00"
      },
      "is_on_leave": false
    }
    ```
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    set_availability(db, agent_id, data)
    return get_availability_response(db, agent_id)


@router.get("/agents/available-now")
def list_available_now(db: Session = Depends(get_db)):
    """
    Returns all active agents who are currently within their working hours
    OR are on call right now. Used by AutoAssign for smart scheduling.
    """
    return get_available_agents_now(db)


# ─────────────────────────────────────────────────────────────────────────────
# On-call schedule
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/on-call/all")
def all_on_call_schedules(db: Session = Depends(get_db)):
    """
    Return all on-call schedule entries (past, present, and future) with
    a `status` field: 'active' | 'upcoming' | 'past'.
    """
    return get_all_on_call(db)


@router.get("/on-call", response_model=list[CurrentOnCallEntry])
def current_on_call(db: Session = Depends(get_db)):
    """Return all agents who are on-call right now."""
    return get_current_on_call(db)


@router.post("/on-call", response_model=OnCallResponse, status_code=201)
def schedule_on_call(data: OnCallCreate, db: Session = Depends(get_db)):
    """Schedule an on-call window for an agent."""
    agent = db.query(Agent).filter(Agent.id == data.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if data.end_time <= data.start_time:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")
    entry = create_on_call(db, data)

    # Notify the agent via notification-service (fire-and-forget)
    try:
        httpx.post(
            f"{NOTIFICATION_SERVICE_URL}/notify/alert",
            json={
                "recipient_emails": [agent.email],
                "alert_type": "on_call_scheduled",
                "severity": "low",
                "message": (
                    f"Hi {agent.name}, you have been scheduled for on-call "
                    f"({data.schedule_type}) from "
                    f"{data.start_time.strftime('%Y-%m-%d %H:%M UTC')} to "
                    f"{data.end_time.strftime('%Y-%m-%d %H:%M UTC')}."
                ),
                "details": {
                    "agent": agent.name,
                    "team": agent.team,
                    "schedule_type": data.schedule_type,
                    "start": str(data.start_time),
                    "end": str(data.end_time),
                    "notes": data.notes or "",
                },
            },
            timeout=3.0,
        )
        logger.info("On-call notification sent to %s", agent.email)
    except Exception as exc:
        logger.warning("Could not notify on-call agent %s: %s", agent.email, exc)

    return entry


@router.get("/agents/{agent_id}/on-call", response_model=list[OnCallResponse])
def agent_on_call_schedule(agent_id: int, db: Session = Depends(get_db)):
    """Get upcoming on-call windows for a specific agent."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return get_on_call_for_agent(db, agent_id)


@router.delete("/on-call/{on_call_id}", status_code=204)
def remove_on_call(on_call_id: int, db: Session = Depends(get_db)):
    """Remove an on-call schedule entry."""
    success = delete_on_call(db, on_call_id)
    if not success:
        raise HTTPException(status_code=404, detail="On-call entry not found")
