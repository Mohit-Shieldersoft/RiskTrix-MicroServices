from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any, Literal


class EmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    html: bool = False


class TicketNotifyRequest(BaseModel):
    # At least one of user_email / agent_email must be provided.
    # Matches diagram: Notification Service → "to both USER & Agent"
    user_email: Optional[str] = None      # the user who raised the ticket
    agent_email: Optional[str] = None     # the assigned agent/analyst
    ticket_number: str
    title: str
    status: str
    priority: str
    category: Optional[str] = None
    assigned_to: Optional[str] = None
    notification_type: Literal["created", "updated", "resolved", "assigned"] = "updated"
    message: Optional[str] = None


class AlertNotifyRequest(BaseModel):
    recipient_emails: List[str]
    alert_type: str                    # e.g. "vulnerability", "sla_breach", "compliance"
    severity: Literal["low", "medium", "high", "critical"] = "medium"
    message: str
    details: Optional[Dict[str, Any]] = None


class AssignmentNotifyRequest(BaseModel):
    assigned_to_email: str
    ticket_number: str
    title: str
    priority: str
    assignment_group: Optional[str] = None
    assigned_to: str
    assigned_by: str
    due_date: Optional[str] = None


class NotifyResponse(BaseModel):
    success: bool
    detail: str
    mode: Literal["sent", "logged"] = "sent"
