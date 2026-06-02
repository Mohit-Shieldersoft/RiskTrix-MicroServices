from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from fastapi.responses import StreamingResponse

import csv
import io

from app.db.database import SessionLocal

from app.schemas.ticket import (
    TicketCreate,
    TicketResponse,
    TicketUpdate,
    TicketStatusUpdate,
    TicketAssign,
    TicketResolve,
    CommentCreate,
    CommentResponse,
    TicketDetailResponse,
    TicketHistoryEntry,
    BulkCloseRequest,
    BulkReassignRequest,
    BulkStatusRequest,
    BulkOperationResult,
)

from app.services.ticket_service import (
    get_tickets,
    get_ticket_by_id,
    get_ticket_with_comments,
    create_ticket,
    update_ticket,
    update_status,
    assign_ticket,
    resolve_ticket,
    add_comment,
    get_ticket_stats,
    get_ticket_history,
    link_child_ticket,
    unlink_child_ticket,
    get_children,
    bulk_close_tickets,
    bulk_reassign_tickets,
    bulk_update_status,
)

from app.services.sla_service import check_sla_status
from app.services.autoassign import get_workload_summary


router = APIRouter()


# =========================================================
# DATABASE
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# =========================================================
# STATS
# =========================================================

@router.get("/tickets/stats")
def ticket_stats(
    db: Session = Depends(get_db),
):
    return get_ticket_stats(db)


@router.get("/tickets/workload")
def agent_workload(
    db: Session = Depends(get_db),
):
    """
    Return open-ticket workload per agent.
    Used by AutoAssign analytics.
    """

    return get_workload_summary(db)


@router.get("/tickets/assignment-stats")
def ticket_assignment_stats(
    db: Session = Depends(get_db),
):
    from app.models.ticket import Ticket

    tickets = db.query(Ticket).all()

    open_statuses = {
        "new",
        "assigned",
        "in_progress",
    }

    # =====================================================
    # BY TEAM
    # =====================================================

    teams = {}

    for t in tickets:

        group = (
            t.assignment_group.strip()
            if t.assignment_group
            else "Unassigned"
        )

        if group not in teams:

            teams[group] = {
                "name": group,
                "total": 0,
                "open": 0,
                "resolved": 0,
                "closed": 0,
                "by_priority": {},
            }

        teams[group]["total"] += 1

        if t.status in open_statuses:
            teams[group]["open"] += 1

        elif t.status == "resolved":
            teams[group]["resolved"] += 1

        elif t.status == "closed":
            teams[group]["closed"] += 1

        p = t.priority or "low"

        teams[group]["by_priority"][p] = (
            teams[group]["by_priority"].get(p, 0) + 1
        )

    # =====================================================
    # BY PERSON
    # =====================================================

    persons = {}

    for t in tickets:

        person = (
            t.assigned_to.strip()
            if t.assigned_to
            else None
        )

        if not person:
            continue

        if person not in persons:

            persons[person] = {
                "name": person,
                "team": t.assignment_group or "",
                "total": 0,
                "open": 0,
                "resolved": 0,
                "closed": 0,
                "by_priority": {},
            }

        persons[person]["total"] += 1

        if t.status in open_statuses:
            persons[person]["open"] += 1

        elif t.status == "resolved":
            persons[person]["resolved"] += 1

        elif t.status == "closed":
            persons[person]["closed"] += 1

        p = t.priority or "low"

        persons[person]["by_priority"][p] = (
            persons[person]["by_priority"].get(p, 0) + 1
        )

    # =====================================================
    # UNASSIGNED OPEN TICKETS
    # =====================================================

    unassigned = [
        {
            "id": t.id,
            "ticket_number": t.ticket_number,
            "title": t.title,
            "priority": t.priority,
            "status": t.status,
            "category": t.category,
            "created_at": t.created_at,
        }
        for t in tickets
        if not t.assigned_to and t.status in open_statuses
    ]

    unassigned_sorted = sorted(
        unassigned,
        key=lambda x: x["created_at"],
        reverse=True,
    )

    return {
        "total": len(tickets),
        "unassigned_open": len(unassigned),
        "by_team": list(teams.values()),
        "by_person": list(persons.values()),
        "unassigned_tickets": unassigned_sorted[:15],
    }


# =========================================================
# TICKETS
# =========================================================

@router.get(
    "/tickets",
    response_model=list[TicketResponse],
)
def read_tickets(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return get_tickets(
        db,
        status,
        priority,
        category,
        search,
    )


@router.post(
    "/tickets",
    response_model=TicketResponse,
    status_code=201,
)
def create_new_ticket(
    ticket: TicketCreate,
    db: Session = Depends(get_db),
):
    return create_ticket(db, ticket)


@router.get("/tickets/dashboard")
def ticket_dashboard(
    db: Session = Depends(get_db),
):
    from app.models.ticket import Ticket
    from datetime import datetime

    tickets = db.query(Ticket).all()

    now = datetime.utcnow()

    total = len(tickets)

    by_status = {}
    by_priority = {}
    by_category = {}
    by_channel = {}

    sla_breached = 0
    resolved_within_sla = 0
    total_resolved = 0

    for t in tickets:

        by_status[t.status] = (
            by_status.get(t.status, 0) + 1
        )

        by_priority[t.priority] = (
            by_priority.get(t.priority, 0) + 1
        )

        by_category[t.category] = (
            by_category.get(t.category, 0) + 1
        )

        channel = t.channel or "self-service"

        by_channel[channel] = (
            by_channel.get(channel, 0) + 1
        )

        if (
            t.sla_response_breached
            or t.sla_resolution_breached
        ):
            sla_breached += 1

        if t.status in ["resolved", "closed"]:

            total_resolved += 1

            if not t.sla_resolution_breached:
                resolved_within_sla += 1

    open_count = (
        by_status.get("new", 0)
        + by_status.get("assigned", 0)
        + by_status.get("in_progress", 0)
    )

    sla_compliance = (
        round(
            (
                resolved_within_sla
                / total_resolved
            ) * 100,
            1,
        )
        if total_resolved > 0
        else 100.0
    )

    # =====================================================
    # RECENT TICKETS
    # =====================================================

    recent = sorted(
        tickets,
        key=lambda t: t.created_at,
        reverse=True,
    )[:5]

    recent_list = [
        {
            "ticket_number": t.ticket_number,
            "title": t.title,
            "priority": t.priority,
            "status": t.status,
            "created_at": t.created_at,
        }
        for t in recent
    ]

    return {
        "total": total,
        "open": open_count,
        "resolved": by_status.get("resolved", 0),
        "closed": by_status.get("closed", 0),
        "sla_breached": sla_breached,
        "sla_compliance_pct": sla_compliance,
        "by_status": by_status,
        "by_priority": by_priority,
        "by_category": by_category,
        "by_channel": by_channel,
        "recent_tickets": recent_list,
    }


@router.get("/tickets/export")
def export_tickets_csv(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    tickets = get_tickets(
        db,
        status,
        priority,
        category,
        search,
    )

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "Ticket Number",
        "Title",
        "Description",
        "Caller",
        "Channel",
        "Status",
        "Priority",
        "Impact",
        "Urgency",
        "Category",
        "Subcategory",
        "Assignment Group",
        "Assigned To",
        "Created By",
        "Created At",
        "Updated At",
        "Resolved At",
        "Closed At",
        "Resolution Code",
        "Resolution Notes",
        "Resolved By",
        "SLA Response Breached",
        "SLA Resolution Breached",
    ])

    for t in tickets:

        writer.writerow([
            t.ticket_number,
            t.title,
            t.description,
            t.caller or "",
            t.channel or "",
            t.status,
            t.priority,
            t.impact,
            t.urgency,
            t.category,
            t.subcategory or "",
            t.assignment_group or "",
            t.assigned_to or "",
            t.created_by,
            t.created_at,
            t.updated_at,
            t.resolved_at or "",
            t.closed_at or "",
            t.resolution_code or "",
            t.resolution_notes or "",
            t.resolved_by or "",
            "Yes" if t.sla_response_breached else "No",
            "Yes" if t.sla_resolution_breached else "No",
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            "attachment; filename=tickets_export.csv"
        },
    )


@router.get(
    "/tickets/{ticket_id}",
    response_model=TicketDetailResponse,
)
def read_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
):
    result = get_ticket_with_comments(
        db,
        ticket_id,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    ticket, comments = result

    ticket_dict = {
        c.name: getattr(ticket, c.name)
        for c in ticket.__table__.columns
    }

    ticket_dict["comments"] = comments

    return ticket_dict


@router.get("/tickets/{ticket_id}/sla")
def get_sla(
    ticket_id: int,
    db: Session = Depends(get_db),
):
    ticket = get_ticket_by_id(
        db,
        ticket_id,
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    sla = check_sla_status(ticket)

    return {
        "ticket_id": ticket_id,
        "ticket_number": ticket.ticket_number,
        "priority": ticket.priority,
        "sla_response_due": ticket.sla_response_due,
        "sla_resolution_due": ticket.sla_resolution_due,
        **sla,
    }


@router.patch(
    "/tickets/{ticket_id}",
    response_model=TicketResponse,
)
def update_ticket_info(
    ticket_id: int,
    data: TicketUpdate,
    db: Session = Depends(get_db),
):
    updated = update_ticket(
        db,
        ticket_id,
        data,
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    return updated


@router.patch(
    "/tickets/{ticket_id}/status",
    response_model=TicketResponse,
)
def change_status(
    ticket_id: int,
    data: TicketStatusUpdate,
    db: Session = Depends(get_db),
):
    ticket, error = update_status(
        db,
        ticket_id,
        data.status,
    )

    if error:
        raise HTTPException(
            status_code=400,
            detail=error,
        )

    return ticket


@router.patch(
    "/tickets/{ticket_id}/assign",
    response_model=TicketResponse,
)
def assign(
    ticket_id: int,
    data: TicketAssign,
    db: Session = Depends(get_db),
):
    ticket = assign_ticket(
        db,
        ticket_id,
        data,
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    return ticket


@router.patch(
    "/tickets/{ticket_id}/resolve",
    response_model=TicketResponse,
)
def resolve(
    ticket_id: int,
    data: TicketResolve,
    db: Session = Depends(get_db),
):
    ticket = resolve_ticket(
        db,
        ticket_id,
        data,
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    return ticket


@router.post(
    "/tickets/{ticket_id}/comments",
    response_model=CommentResponse,
)
def post_comment(
    ticket_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
):
    comment = add_comment(
        db,
        ticket_id,
        data,
    )

    if not comment:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    return comment


# =========================================================
# FIELD-LEVEL CHANGE HISTORY
# =========================================================

@router.get(
    "/tickets/{ticket_id}/history",
    response_model=list[TicketHistoryEntry],
)
def get_history(
    ticket_id: int,
    db: Session = Depends(get_db),
):
    """Return the full field-level change history for a ticket."""
    ticket = get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return get_ticket_history(db, ticket_id)


# =========================================================
# TICKET LINKING (PARENT-CHILD)
# =========================================================

@router.post(
    "/tickets/{parent_id}/link/{child_id}",
    response_model=TicketResponse,
)
def link_child(
    parent_id: int,
    child_id: int,
    changed_by: Optional[str] = Query("system"),
    db: Session = Depends(get_db),
):
    """Link child_id as a sub-ticket of parent_id."""
    ticket, error = link_child_ticket(db, parent_id, child_id, changed_by)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return ticket


@router.delete(
    "/tickets/{parent_id}/link/{child_id}",
    status_code=204,
)
def unlink_child(
    parent_id: int,
    child_id: int,
    changed_by: Optional[str] = Query("system"),
    db: Session = Depends(get_db),
):
    """Remove the parent-child link between parent_id and child_id."""
    _, error = unlink_child_ticket(db, parent_id, child_id, changed_by)
    if error:
        raise HTTPException(status_code=404, detail=error)


@router.get(
    "/tickets/{ticket_id}/children",
    response_model=list[TicketResponse],
)
def get_ticket_children(
    ticket_id: int,
    db: Session = Depends(get_db),
):
    """Return all sub-tickets (children) of a parent ticket."""
    ticket = get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return get_children(db, ticket_id)


@router.get(
    "/tickets/{ticket_id}/parent",
)
def get_ticket_parent(
    ticket_id: int,
    db: Session = Depends(get_db),
):
    """Return the parent ticket of a sub-ticket, or null if none."""
    ticket = get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if not ticket.parent_id:
        return {"parent": None}
    parent = get_ticket_by_id(db, ticket.parent_id)
    if not parent:
        return {"parent": None}
    return {
        "parent": {
            "id": parent.id,
            "ticket_number": parent.ticket_number,
            "title": parent.title,
            "status": parent.status,
            "priority": parent.priority,
        }
    }


# =========================================================
# BULK OPERATIONS
# =========================================================

@router.post(
    "/tickets/bulk/close",
    response_model=BulkOperationResult,
)
def bulk_close(
    data: BulkCloseRequest,
    db: Session = Depends(get_db),
):
    """Bulk close a list of tickets by ID."""
    return bulk_close_tickets(
        db,
        data.ticket_ids,
        data.resolution_notes or "Bulk closed",
        data.resolved_by or "system",
        data.changed_by or "system",
    )


@router.post(
    "/tickets/bulk/reassign",
    response_model=BulkOperationResult,
)
def bulk_reassign(
    data: BulkReassignRequest,
    db: Session = Depends(get_db),
):
    """Bulk reassign a list of tickets to a new assignee."""
    return bulk_reassign_tickets(
        db,
        data.ticket_ids,
        data.assigned_to,
        data.assignment_group or "",
        data.changed_by or "system",
    )


@router.post(
    "/tickets/bulk/status",
    response_model=BulkOperationResult,
)
def bulk_status(
    data: BulkStatusRequest,
    db: Session = Depends(get_db),
):
    """Bulk update the status of a list of tickets (enforces valid transitions)."""
    return bulk_update_status(
        db,
        data.ticket_ids,
        data.status,
        data.changed_by or "system",
    )
