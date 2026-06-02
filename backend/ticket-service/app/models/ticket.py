from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from datetime import datetime
from app.db.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String, unique=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("tickets.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    status = Column(String, default="new")
    priority = Column(String, default="low")
    impact = Column(String, default="low")
    urgency = Column(String, default="low")
    category = Column(String, default="general")
    subcategory = Column(String, default="")
    channel = Column(String, default="self-service")
    caller = Column(String, default="")
    caller_email = Column(String, default="")
    asset_id = Column(Integer, nullable=True)
    assignment_group = Column(String, default="")
    assigned_to = Column(String, default="")
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    resolution_code = Column(String, default="")
    resolution_notes = Column(Text, default="")
    resolved_by = Column(String, default="")

    
    sla_response_due = Column(DateTime, nullable=True)
    sla_resolution_due = Column(DateTime, nullable=True)
    sla_response_breached = Column(Boolean, default=False)
    sla_resolution_breached = Column(Boolean, default=False)
    sla_response_met_at = Column(DateTime, nullable=True)


class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, nullable=False)
    comment = Column(Text, nullable=False)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AssignmentLog(Base):
    """Records every auto-assignment decision for analytics."""
    __tablename__ = "assignment_logs"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String, nullable=False, index=True)
    priority = Column(String, nullable=False)
    category = Column(String, nullable=False)
    assigned_to = Column(String, nullable=True)
    team = Column(String, nullable=True)
    auto_assigned = Column(Boolean, default=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)


class TicketHistory(Base):
    """Field-level change history: who changed what field, when, and from/to what value."""
    __tablename__ = "ticket_history"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)
    ticket_number = Column(String, nullable=False, index=True)
    changed_by = Column(String, nullable=False, default="system")
    field_name = Column(String(100), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow, index=True)