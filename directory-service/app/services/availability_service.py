import json
from datetime import datetime, time
from typing import Optional
from sqlalchemy.orm import Session

from app.models.availability import AgentAvailability, OnCallSchedule
from app.models.agent import Agent
from app.schemas.availability import AvailabilitySet, OnCallCreate, OnCallUpdate

DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


def _parse_schedule(raw: Optional[str]) -> Optional[dict]:
    """Deserialise JSON stored in the Text column."""
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None


def _is_in_window(start_str: str, end_str: str, now_time: time) -> bool:
    """Return True if now_time is between HH:MM-HH:MM."""
    try:
        s = time(*map(int, start_str.split(":")))
        e = time(*map(int, end_str.split(":")))
        if s <= e:
            return s <= now_time <= e
        # Overnight window e.g. 22:00-06:00
        return now_time >= s or now_time <= e
    except Exception:
        return False


def is_available_now(avail: AgentAvailability) -> bool:
    """
    Returns True if the agent is working right now based on their
    weekly schedule and leave status.
    """
    if not avail or avail.is_on_leave:
        if avail and avail.leave_until:
            # Auto-recover if leave has expired
            if datetime.utcnow() > avail.leave_until:
                return True
        return False

    schedule = _parse_schedule(avail.weekly_schedule)
    if not schedule:
        return True  # No schedule set → assume always available

    now = datetime.utcnow()
    day_key = DAY_NAMES[now.weekday()]
    window = schedule.get(day_key)
    if not window:
        return False  # Not scheduled today

    if "-" not in window:
        return False
    start_str, end_str = window.split("-", 1)
    return _is_in_window(start_str.strip(), end_str.strip(), now.time())


def is_on_call_now(db: Session, agent_id: int) -> bool:
    now = datetime.utcnow()
    return db.query(OnCallSchedule).filter(
        OnCallSchedule.agent_id == agent_id,
        OnCallSchedule.start_time <= now,
        OnCallSchedule.end_time >= now,
    ).first() is not None


# ─────────────────────────────────────────────────────────────────────────────
# Availability CRUD
# ─────────────────────────────────────────────────────────────────────────────

def get_or_create_availability(db: Session, agent_id: int) -> AgentAvailability:
    avail = db.query(AgentAvailability).filter(AgentAvailability.agent_id == agent_id).first()
    if not avail:
        avail = AgentAvailability(agent_id=agent_id)
        db.add(avail)
        db.commit()
        db.refresh(avail)
    return avail


def set_availability(db: Session, agent_id: int, data: AvailabilitySet) -> AgentAvailability:
    avail = get_or_create_availability(db, agent_id)
    avail.timezone = data.timezone
    avail.weekly_schedule = json.dumps(data.weekly_schedule) if data.weekly_schedule else None
    avail.is_on_leave = data.is_on_leave
    avail.leave_until = data.leave_until
    avail.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(avail)
    return avail


def get_availability_response(db: Session, agent_id: int) -> dict:
    """Return availability record enriched with computed flags."""
    avail = get_or_create_availability(db, agent_id)
    schedule = _parse_schedule(avail.weekly_schedule)
    return {
        "id": avail.id,
        "agent_id": avail.agent_id,
        "timezone": avail.timezone,
        "weekly_schedule": schedule,
        "is_on_leave": avail.is_on_leave,
        "leave_until": avail.leave_until,
        "updated_at": avail.updated_at,
        "is_available_now": is_available_now(avail),
        "is_on_call_now": is_on_call_now(db, agent_id),
    }


# ─────────────────────────────────────────────────────────────────────────────
# On-Call CRUD
# ─────────────────────────────────────────────────────────────────────────────

def create_on_call(db: Session, data: OnCallCreate) -> OnCallSchedule:
    entry = OnCallSchedule(**data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_on_call_for_agent(db: Session, agent_id: int) -> list:
    now = datetime.utcnow()
    return (
        db.query(OnCallSchedule)
        .filter(
            OnCallSchedule.agent_id == agent_id,
            OnCallSchedule.end_time >= now,
        )
        .order_by(OnCallSchedule.start_time)
        .all()
    )


def get_current_on_call(db: Session) -> list:
    """Return all on-call entries that are active right now."""
    now = datetime.utcnow()
    entries = (
        db.query(OnCallSchedule)
        .filter(
            OnCallSchedule.start_time <= now,
            OnCallSchedule.end_time >= now,
        )
        .all()
    )
    result = []
    for entry in entries:
        agent = db.query(Agent).filter(Agent.id == entry.agent_id).first()
        if agent:
            result.append({
                "agent_id": agent.id,
                "agent_name": agent.name,
                "agent_email": agent.email,
                "agent_team": agent.team,
                "schedule_type": entry.schedule_type,
                "start_time": entry.start_time,
                "end_time": entry.end_time,
            })
    return result


def delete_on_call(db: Session, on_call_id: int) -> bool:
    entry = db.query(OnCallSchedule).filter(OnCallSchedule.id == on_call_id).first()
    if not entry:
        return False
    db.delete(entry)
    db.commit()
    return True


def get_all_on_call(db: Session, limit: int = 100) -> list:
    """
    Return all on-call schedule entries (past, present, and future),
    enriched with agent details. Ordered by start_time descending.
    """
    now = datetime.utcnow()
    entries = (
        db.query(OnCallSchedule)
        .order_by(OnCallSchedule.start_time.desc())
        .limit(limit)
        .all()
    )
    result = []
    for entry in entries:
        agent = db.query(Agent).filter(Agent.id == entry.agent_id).first()
        if agent:
            if entry.start_time <= now <= entry.end_time:
                status = "active"
            elif entry.start_time > now:
                status = "upcoming"
            else:
                status = "past"
            result.append({
                "id": entry.id,
                "agent_id": agent.id,
                "agent_name": agent.name,
                "agent_email": agent.email,
                "agent_team": agent.team,
                "schedule_type": entry.schedule_type,
                "notes": entry.notes,
                "start_time": entry.start_time,
                "end_time": entry.end_time,
                "created_at": entry.created_at,
                "status": status,
            })
    return result


def get_available_agents_now(db: Session) -> list:
    """
    Returns list of agents who are either:
    - Within their working hours right now, OR
    - Currently on call
    """
    agents = db.query(Agent).filter(Agent.is_active == True).all()
    result = []
    for agent in agents:
        avail = db.query(AgentAvailability).filter(
            AgentAvailability.agent_id == agent.id
        ).first()
        on_call = is_on_call_now(db, agent.id)
        working = is_available_now(avail) if avail else True
        if working or on_call:
            result.append({
                "id": agent.id,
                "email": agent.email,
                "name": agent.name,
                "team": agent.team,
                "tier": agent.tier,
                "is_on_call": on_call,
                "is_working": working,
            })
    return result
