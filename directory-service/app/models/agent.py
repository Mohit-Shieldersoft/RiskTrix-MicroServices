from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.db.database import Base


class Agent(Base):
    __tablename__ = "directory_agents"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    team = Column(String, nullable=False)        # security | it-ops | compliance | general
    tier = Column(String, default="standard")    # senior | standard
    # categories this agent handles (comma-separated)
    categories = Column(String, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
