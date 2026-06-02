from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from datetime import datetime
from app.db.database import Base


class AgentMetric(Base):
    """Per-ticket performance record for an agent."""
    __tablename__ = "agent_metrics"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("directory_agents.id"), nullable=False, index=True)
    ticket_id = Column(Integer, nullable=True)
    ticket_number = Column(String(50), nullable=True)
    # minutes from ticket created_at → resolved_at
    resolution_time_minutes = Column(Integer, nullable=True)
    # 0.0 – 10.0 subjective quality rating
    quality_score = Column(Float, nullable=True)
    sla_met = Column(Boolean, nullable=True)
    category = Column(String(100), nullable=True)
    priority = Column(String(20), nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
