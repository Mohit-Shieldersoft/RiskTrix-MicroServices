from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional, List


class TicketCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    caller: Optional[str] = ""
    caller_email: Optional[str] = None
    channel: Optional[str] = "self-service"
    impact: Optional[str] = "low"
    urgency: Optional[str] = "low"
    category: Optional[str] = "general"
    subcategory: Optional[str] = ""
    assignment_group: Optional[str] = ""
    assigned_to: Optional[str] = ""
    asset_id: Optional[int] = None
    parent_id: Optional[int] = None
    created_by: str

    @validator("title")
    def title_required(cls, v):
        if not v.strip():
            raise ValueError("Title is required")
        return v

    @validator("impact")
    def impact_valid(cls, v):
        if v.lower() not in {"high", "medium", "low"}:
            raise ValueError("impact must be high, medium or low")
        return v.lower()

    @validator("urgency")
    def urgency_valid(cls, v):
        if v.lower() not in {"high", "medium", "low"}:
            raise ValueError("urgency must be high, medium or low")
        return v.lower()

    @validator("category")
    def category_valid(cls, v):
        valid = {"general", "security", "network", "hardware", "software"}
        if v.lower() not in valid:
            raise ValueError(f"category must be one of {valid}")
        return v.lower()

    @validator("channel")
    def channel_valid(cls, v):
        valid = {"self-service", "phone", "email", "chat", "walk-in"}
        if v.lower() not in valid:
            raise ValueError(f"channel must be one of {valid}")
        return v.lower()


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    caller: Optional[str] = None
    caller_email: Optional[str] = None
    channel: Optional[str] = None
    impact: Optional[str] = None
    urgency: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    assignment_group: Optional[str] = None
    assigned_to: Optional[str] = None


class TicketStatusUpdate(BaseModel):
    status: str

    @validator("status")
    def status_valid(cls, v):
        valid = {"new", "assigned", "in_progress", "resolved", "closed"}
        if v.lower() not in valid:
            raise ValueError(f"status must be one of {valid}")
        return v.lower()


class TicketAssign(BaseModel):
    assigned_to: str
    assignment_group: Optional[str] = ""


class TicketResolve(BaseModel):
    resolution_code: str
    resolution_notes: str
    resolved_by: str


class CommentCreate(BaseModel):
    comment: str
    created_by: str


class CommentResponse(BaseModel):
    id: int
    ticket_id: int
    comment: str
    created_by: str
    created_at: datetime

    class Config:
        orm_mode = True


class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    title: str
    description: str
    status: str
    priority: str
    impact: str
    urgency: str
    category: str
    subcategory: str
    channel: str
    caller: str
    caller_email: Optional[str] = None
    asset_id: Optional[int] = None
    parent_id: Optional[int] = None
    assignment_group: str
    assigned_to: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    resolution_code: str
    resolution_notes: str
    resolved_by: str
    # ✅ NEW: SLA fields
    sla_response_due: Optional[datetime] = None
    sla_resolution_due: Optional[datetime] = None
    sla_response_breached: bool = False
    sla_resolution_breached: bool = False
    sla_response_met_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class TicketDetailResponse(TicketResponse):
    comments: List[CommentResponse] = []


# ─────────────────────────────────────────────
# Field-level change history
# ─────────────────────────────────────────────

class TicketHistoryEntry(BaseModel):
    id: int
    ticket_id: int
    ticket_number: str
    changed_by: str
    field_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_at: datetime

    class Config:
        orm_mode = True


# ─────────────────────────────────────────────
# Ticket linking (parent-child)
# ─────────────────────────────────────────────

class TicketLinkResponse(BaseModel):
    parent_id: Optional[int]
    parent_number: Optional[str]
    children: List["TicketResponse"] = []


# ─────────────────────────────────────────────
# Bulk operations
# ─────────────────────────────────────────────

class BulkCloseRequest(BaseModel):
    ticket_ids: List[int]
    resolution_notes: Optional[str] = "Bulk closed"
    resolved_by: Optional[str] = "system"
    changed_by: Optional[str] = "system"


class BulkReassignRequest(BaseModel):
    ticket_ids: List[int]
    assigned_to: str
    assignment_group: Optional[str] = ""
    changed_by: Optional[str] = "system"


class BulkStatusRequest(BaseModel):
    ticket_ids: List[int]
    status: str
    changed_by: Optional[str] = "system"


class BulkOperationResult(BaseModel):
    success_count: int
    failed_count: int
    failed_ids: List[int] = []
    errors: List[str] = []