from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from datetime import datetime
from app.db.database import Base


class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False)   # ticket.created / ticket.assigned / ticket.resolved
    payload = Column(JSON, nullable=False)              # full event data dict
    status = Column(String(20), default="pending")     # pending | processing | done | failed
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    error = Column(Text, nullable=True)
