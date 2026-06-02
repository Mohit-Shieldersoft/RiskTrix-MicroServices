from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from datetime import datetime
from app.db.database import Base


class AgentAvailability(Base):
    """Weekly working-hours schedule + leave status for an agent."""
    __tablename__ = "agent_availability"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("directory_agents.id"), unique=True, nullable=False, index=True)
    timezone = Column(String(50), default="UTC")
    # JSON string: {"monday": "09:00-17:00", "tuesday": "09:00-17:00", ...}
    # Omit a day to mark as non-working
    weekly_schedule = Column(Text, nullable=True)
    is_on_leave = Column(Boolean, default=False)
    leave_until = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class OnCallSchedule(Base):
    """Explicit on-call window for an agent (primary or backup)."""
    __tablename__ = "agent_oncall"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("directory_agents.id"), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    schedule_type = Column(String(20), default="primary")  # primary | backup
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
