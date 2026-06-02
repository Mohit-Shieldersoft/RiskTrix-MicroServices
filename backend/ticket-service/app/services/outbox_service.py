"""
Outbox Service — writes events to outbox_events table in same DB transaction.
The Queue Service (port 8010) polls this table and dispatches to downstream.
"""
from sqlalchemy.orm import Session
from app.models.outbox import OutboxEvent


def publish(db: Session, event_type: str, payload: dict) -> OutboxEvent:
    """Write an event to the outbox table. Call BEFORE db.commit() on the main entity."""
    event = OutboxEvent(event_type=event_type, payload=payload)
    db.add(event)
    # Caller is responsible for committing — event and entity commit atomically.
    return event
