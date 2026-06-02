"""
automation.py — SQLAlchemy models for the Automation Engine
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON
from datetime import datetime
from app.db.database import Base


class AutomationRule(Base):
    """
    Defines when and what to do automatically.
    conditions_json and actions_json are stored as JSON arrays.

    Example conditions_json:
      [{"field": "risk_score", "op": "gte", "value": 81}]

    Example actions_json:
      [{"type": "lock_device"}, {"type": "create_alert", "severity": "critical"}]
    """
    __tablename__ = "automation_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="")

    # Trigger: risk_evaluated | device_offline | agent_checkin | manual
    trigger_type = Column(String, nullable=False, default="risk_evaluated")

    # JSON list of condition objects
    conditions_json = Column(JSON, default=list)

    # JSON list of action objects
    actions_json = Column(JSON, default=list)

    enabled = Column(Boolean, default=True)
    created_by = Column(String, default="admin")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AutomationExecution(Base):
    """
    Log of every time an automation rule fired.
    """
    __tablename__ = "automation_executions"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, nullable=False, index=True)
    rule_name = Column(String, nullable=False)

    # What triggered it
    trigger_type = Column(String, nullable=False)
    device_id = Column(Integer, nullable=True, index=True)

    # What happened
    actions_taken = Column(JSON, default=list)   # list of action type strings
    status = Column(String, default="success")   # success | failed | skipped
    detail = Column(Text, default="")

    executed_at = Column(DateTime, default=datetime.utcnow)
