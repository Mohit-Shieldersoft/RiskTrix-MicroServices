from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.models.outbox import OutboxEvent

router = APIRouter(tags=["queue"])


# ── Schemas ────────────────────────────────────────────────────────────────

class PublishRequest(BaseModel):
    event_type: str
    payload: dict


class EventResponse(BaseModel):
    id: int
    event_type: str
    payload: Optional[dict] = None
    status: str
    retry_count: int
    created_at: str
    processed_at: Optional[str] = None
    error: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Routes ─────────────────────────────────────────────────────────────────

@router.post("/queue/publish", response_model=EventResponse, status_code=201)
def publish_event(body: PublishRequest, db: Session = Depends(get_db)):
    """Manually publish an event to the outbox queue."""
    event = OutboxEvent(event_type=body.event_type, payload=body.payload)
    db.add(event)
    db.commit()
    db.refresh(event)
    return _fmt(event)


@router.get("/queue/events", response_model=List[EventResponse])
def list_events(
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List outbox events (admin view)."""
    q = db.query(OutboxEvent)
    if status:
        q = q.filter(OutboxEvent.status == status)
    events = q.order_by(OutboxEvent.created_at.desc()).limit(limit).all()
    return [_fmt(e) for e in events]


@router.get("/queue/events/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(OutboxEvent).filter(OutboxEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return _fmt(event)


@router.post("/queue/replay/{event_id}", response_model=EventResponse)
def replay_event(event_id: int, db: Session = Depends(get_db)):
    """Reset a failed/done event back to pending so the worker retries it."""
    event = db.query(OutboxEvent).filter(OutboxEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.status = "pending"
    event.retry_count = 0
    event.error = None
    db.commit()
    db.refresh(event)
    return _fmt(event)


@router.get("/queue/stats")
def queue_stats(db: Session = Depends(get_db)):
    """Summary counts by status."""
    from sqlalchemy import func
    rows = (
        db.query(OutboxEvent.status, func.count(OutboxEvent.id))
        .group_by(OutboxEvent.status)
        .all()
    )
    return {status: count for status, count in rows}
     

# ── Helper ─────────────────────────────────────────────────────────────────

def _fmt(e: OutboxEvent) -> dict:
    return {
        "id": e.id,
        "event_type": e.event_type,
        "payload": e.payload,
        "status": e.status,
        "retry_count": e.retry_count,
        "created_at": e.created_at.isoformat() if e.created_at else None,
        "processed_at": e.processed_at.isoformat() if e.processed_at else None,
        "error": e.error,
    }
