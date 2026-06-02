from sqlalchemy.orm import Session
from app.models.ticket import Ticket, TicketComment, AssignmentLog, TicketHistory
from app.services.sla_service import get_sla_deadlines
from app.services import notification_client as notify
from app.services.autoassign import auto_assign
from app.services import outbox_service as outbox
from datetime import datetime
import logging
import httpx

logger = logging.getLogger("ticket-service.ticket-service")

ASSET_SERVICE_URL = "http://localhost:8003/api/v1"
DIRECTORY_SERVICE_URL = "http://localhost:8008/api/v1"


# ─────────────────────────────────────────────────────────────
# Performance metric helper (fire-and-forget)
# ─────────────────────────────────────────────────────────────

def _post_resolution_metric(ticket: Ticket) -> None:
    """
    Push a resolution performance metric to directory-service after a ticket
    is closed.  Never raises — failures are logged at WARNING level.
    """
    if not ticket.assigned_to or not ticket.resolved_at:
        return

    resolution_minutes: int | None = None
    if ticket.created_at:
        resolution_minutes = int(
            (ticket.resolved_at - ticket.created_at).total_seconds() / 60
        )

    sla_met = not (ticket.sla_resolution_breached or ticket.sla_response_breached)

    try:
        # Resolve email → agent_id via directory-service
        r = httpx.get(
            f"{DIRECTORY_SERVICE_URL}/directory/agents/by-email",
            params={"email": ticket.assigned_to},
            timeout=3.0,
        )
        if r.status_code != 200:
            logger.warning(
                "Metric skipped: agent '%s' not found in directory (status %s)",
                ticket.assigned_to, r.status_code,
            )
            return

        agent_id = r.json()["id"]

        httpx.post(
            f"{DIRECTORY_SERVICE_URL}/directory/metrics",
            json={
                "agent_id": agent_id,
                "ticket_id": ticket.id,
                "ticket_number": ticket.ticket_number,
                "resolution_time_minutes": resolution_minutes,
                "sla_met": sla_met,
                "category": ticket.category,
                "priority": ticket.priority,
            },
            timeout=3.0,
        )
        logger.info(
            "Resolution metric posted for agent %s on ticket %s (%s min, sla_met=%s)",
            ticket.assigned_to, ticket.ticket_number, resolution_minutes, sla_met,
        )
    except Exception as exc:
        logger.warning(
            "Could not post resolution metric for %s: %s",
            ticket.ticket_number, exc,
        )


# ─────────────────────────────────────────────────────────────
# History helpers
# ─────────────────────────────────────────────────────────────

def _log_change(db: Session, ticket: Ticket, field: str, old_val, new_val, changed_by: str = "system"):
    """Write a single field-change record to ticket_history."""
    old_str = str(old_val) if old_val is not None else None
    new_str = str(new_val) if new_val is not None else None
    if old_str == new_str:
        return
    db.add(TicketHistory(
        ticket_id=ticket.id,
        ticket_number=ticket.ticket_number,
        changed_by=changed_by,
        field_name=field,
        old_value=old_str,
        new_value=new_str,
        changed_at=datetime.utcnow(),
    ))


def _log_changes(db: Session, ticket: Ticket, changes: dict, changed_by: str = "system"):
    """Write multiple field-change records at once."""
    for field, (old_val, new_val) in changes.items():
        _log_change(db, ticket, field, old_val, new_val, changed_by)


def _fetch_asset_context(asset_id: int) -> dict | None:
    """Fetch asset name/type/risk from asset-service. Returns None on failure."""
    try:
        resp = httpx.get(f"{ASSET_SERVICE_URL}/assets/{asset_id}", timeout=3.0)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return None


PRIORITY_MATRIX = {
    ("high", "high"): "critical",
    ("high", "medium"): "high",
    ("high", "low"): "medium",
    ("medium", "high"): "high",
    ("medium", "medium"): "medium",
    ("medium", "low"): "low",
    ("low", "high"): "medium",
    ("low", "medium"): "low",
    ("low", "low"): "low",
}

VALID_TRANSITIONS = {
    "new": ["assigned"],
    "assigned": ["in_progress"],
    "in_progress": ["resolved"],
    "resolved": ["closed"],
    "closed": [],
}


def calculate_priority(impact: str, urgency: str) -> str:
    return PRIORITY_MATRIX.get((impact.lower(), urgency.lower()), "low")


def generate_ticket_number(db: Session) -> str:
    count = db.query(Ticket).count()
    return f"TKT-{str(count + 1).zfill(5)}"


def get_tickets(db: Session, status: str = None, priority: str = None,
                category: str = None, search: str = None):
    query = db.query(Ticket)
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if category:
        query = query.filter(Ticket.category == category)
    if search:
        query = query.filter(
            Ticket.title.ilike(f"%{search}%") |
            Ticket.ticket_number.ilike(f"%{search}%")
        )
    return query.order_by(Ticket.created_at.desc()).all()


def get_ticket_by_id(db: Session, ticket_id: int):
    return db.query(Ticket).filter(Ticket.id == ticket_id).first()


def get_ticket_with_comments(db: Session, ticket_id: int):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None
    comments = db.query(TicketComment).filter(
        TicketComment.ticket_id == ticket_id
    ).order_by(TicketComment.created_at.asc()).all()
    return ticket, comments


def create_ticket(db: Session, ticket_data):
    priority = calculate_priority(ticket_data.impact, ticket_data.urgency)
    ticket_number = generate_ticket_number(db)
    now = datetime.utcnow()
    caller_email = ticket_data.caller_email or None

    # ✅ Optionally enrich description with asset context (Diagram 2: "May query the assets")
    description = ticket_data.description or ""
    asset_id = ticket_data.asset_id or None
    if asset_id:
        asset = _fetch_asset_context(asset_id)
        if asset:
            asset_note = (
                f"\n\n[Asset Context] Name: {asset.get('name')} | "
                f"Type: {asset.get('type')} | Risk: {asset.get('risk_level')}"
            )
            description = description + asset_note

    # ✅ Calculate SLA deadlines on creation
    sla = get_sla_deadlines(priority, now)

    # ── AutoAssign: only if not manually assigned ──────────────────────────
    was_auto_assigned = False
    assigned_to = ticket_data.assigned_to or None
    assignment_group = ticket_data.assignment_group or None
    if not assigned_to:
        assigned_to, assignment_group = auto_assign(db, priority, ticket_data.category or "general")
        was_auto_assigned = True

    ticket = Ticket(
        ticket_number=ticket_number,
        title=ticket_data.title,
        description=description,
        caller=ticket_data.caller,
        caller_email=caller_email or "",
        asset_id=asset_id,
        parent_id=getattr(ticket_data, "parent_id", None),
        channel=ticket_data.channel,
        impact=ticket_data.impact,
        urgency=ticket_data.urgency,
        priority=priority,
        category=ticket_data.category,
        subcategory=ticket_data.subcategory,
        assignment_group=assignment_group,
        assigned_to=assigned_to,
        created_by=ticket_data.created_by,
        status="new" if not assigned_to else "assigned",
        # ✅ SLA fields
        sla_response_due=sla["sla_response_due"],
        sla_resolution_due=sla["sla_resolution_due"],
        sla_response_breached=False,
        sla_resolution_breached=False,
    )
    db.add(ticket)

    # ✅ Analytics: log every auto-assignment for tracking (Diagram 2: "AutoAssign → Track for analytics")
    if was_auto_assigned:
        db.add(AssignmentLog(
            ticket_number=ticket_number,
            priority=priority,
            category=ticket_data.category or "general",
            assigned_to=assigned_to,
            team=assignment_group,
            auto_assigned=True,
        ))

    # Write outbox event atomically with the ticket insert
    outbox.publish(db, "ticket.created", {
        "ticket_number": ticket_number,
        "title": ticket_data.title,
        "status": ticket.status,
        "priority": priority,
        "category": ticket_data.category,
        "user_email": caller_email,
        "agent_email": assigned_to,
    })

    db.commit()
    db.refresh(ticket)

    # Direct fire-and-forget notification (fast path — queue worker is the reliable path)
    notify.notify_ticket_created(
        ticket_number=ticket.ticket_number,
        title=ticket.title,
        status=ticket.status,
        priority=ticket.priority,
        category=ticket.category,
        user_email=caller_email,
        agent_email=ticket.assigned_to if ticket.assigned_to else None,
    )

    return ticket


def update_ticket(db: Session, ticket_id: int, ticket_data, changed_by: str = "system"):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None
    update_dict = ticket_data.dict(exclude_unset=True)
    tracked_fields = {"title", "description", "impact", "urgency", "category",
                      "subcategory", "channel", "caller", "caller_email", "assigned_to",
                      "assignment_group"}
    for key, value in update_dict.items():
        old_val = getattr(ticket, key, None)
        setattr(ticket, key, value)
        if key in tracked_fields:
            _log_change(db, ticket, key, old_val, value, changed_by)
    if "impact" in update_dict or "urgency" in update_dict:
        old_priority = ticket.priority
        ticket.priority = calculate_priority(ticket.impact, ticket.urgency)
        _log_change(db, ticket, "priority", old_priority, ticket.priority, changed_by)
        # ✅ Recalculate SLA if priority changes
        sla = get_sla_deadlines(ticket.priority, ticket.created_at)
        ticket.sla_response_due = sla["sla_response_due"]
        ticket.sla_resolution_due = sla["sla_resolution_due"]
    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    return ticket


def update_status(db: Session, ticket_id: int, new_status: str, changed_by: str = "system"):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None, "Ticket not found"

    allowed = VALID_TRANSITIONS.get(ticket.status, [])
    if new_status not in allowed:
        return None, f"Cannot move from '{ticket.status}' to '{new_status}'. Allowed: {allowed}"

    old_status = ticket.status
    ticket.status = new_status
    ticket.updated_at = datetime.utcnow()
    _log_change(db, ticket, "status", old_status, new_status, changed_by)

    # ✅ Mark response SLA met when assigned
    if new_status == "assigned" and not ticket.sla_response_met_at:
        ticket.sla_response_met_at = datetime.utcnow()
        now = datetime.utcnow()
        if ticket.sla_response_due and now > ticket.sla_response_due:
            ticket.sla_response_breached = True
            outbox.publish(db, "ticket.sla_breached", {
                "ticket_number": ticket.ticket_number,
                "title": ticket.title,
                "priority": ticket.priority,
                "breach_type": "response",
                "agent_email": ticket.assigned_to or None,
                "user_email": ticket.caller_email or None,
            })

    if new_status == "closed":
        ticket.closed_at = datetime.utcnow()
        # ✅ Check resolution breach on close
        now = datetime.utcnow()
        if ticket.sla_resolution_due and now > ticket.sla_resolution_due:
            ticket.sla_resolution_breached = True
            outbox.publish(db, "ticket.sla_breached", {
                "ticket_number": ticket.ticket_number,
                "title": ticket.title,
                "priority": ticket.priority,
                "breach_type": "resolution",
                "agent_email": ticket.assigned_to or None,
                "user_email": ticket.caller_email or None,
            })

    db.commit()
    db.refresh(ticket)
    return ticket, None


def assign_ticket(db: Session, ticket_id: int, assign_data, changed_by: str = "system"):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None
    old_assignee = ticket.assigned_to
    old_group = ticket.assignment_group
    old_status = ticket.status
    ticket.assigned_to = assign_data.assigned_to
    ticket.assignment_group = assign_data.assignment_group or ticket.assignment_group
    ticket.status = "assigned"
    ticket.updated_at = datetime.utcnow()
    _log_changes(db, ticket, {
        "assigned_to": (old_assignee, assign_data.assigned_to),
        "assignment_group": (old_group, ticket.assignment_group),
        "status": (old_status, "assigned"),
    }, changed_by)
    # ✅ Mark response SLA met on assignment
    if not ticket.sla_response_met_at:
        ticket.sla_response_met_at = datetime.utcnow()
        now = datetime.utcnow()
        if ticket.sla_response_due and now > ticket.sla_response_due:
            ticket.sla_response_breached = True
            outbox.publish(db, "ticket.sla_breached", {
                "ticket_number": ticket.ticket_number,
                "title": ticket.title,
                "priority": ticket.priority,
                "breach_type": "response",
                "agent_email": assign_data.assigned_to or None,
                "user_email": ticket.caller_email or None,
            })
    # Write outbox event atomically with the assignment update
    outbox.publish(db, "ticket.assigned", {
        "ticket_number": ticket.ticket_number,
        "title": ticket.title,
        "status": "assigned",
        "priority": ticket.priority,
        "category": ticket.category,
        "assigned_to": ticket.assigned_to,
        "user_email": getattr(assign_data, "user_email", None),
        "agent_email": getattr(assign_data, "agent_email", None),
    })

    db.commit()
    db.refresh(ticket)

    # Direct fire-and-forget (fast path)
    notify.notify_ticket_assigned(
        ticket_number=ticket.ticket_number,
        title=ticket.title,
        status=ticket.status,
        priority=ticket.priority,
        category=ticket.category,
        assigned_to=ticket.assigned_to,
        user_email=getattr(assign_data, "user_email", None),
        agent_email=getattr(assign_data, "agent_email", None),
    )

    return ticket


def resolve_ticket(db: Session, ticket_id: int, resolve_data, changed_by: str = "system"):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None
    old_status = ticket.status
    ticket.resolution_code = resolve_data.resolution_code
    ticket.resolution_notes = resolve_data.resolution_notes
    ticket.resolved_by = resolve_data.resolved_by
    ticket.resolved_at = datetime.utcnow()
    ticket.status = "resolved"
    ticket.updated_at = datetime.utcnow()
    _log_changes(db, ticket, {
        "status": (old_status, "resolved"),
        "resolution_code": (None, resolve_data.resolution_code),
        "resolved_by": (None, resolve_data.resolved_by),
    }, changed_by or resolve_data.resolved_by)
    # ✅ Check resolution SLA breach on resolve
    now = datetime.utcnow()
    if ticket.sla_resolution_due and now > ticket.sla_resolution_due:
        ticket.sla_resolution_breached = True
        outbox.publish(db, "ticket.sla_breached", {
            "ticket_number": ticket.ticket_number,
            "title": ticket.title,
            "priority": ticket.priority,
            "breach_type": "resolution",
            "agent_email": ticket.assigned_to or None,
            "user_email": ticket.caller_email or None,
        })

    # Write outbox event atomically with the resolve update
    outbox.publish(db, "ticket.resolved", {
        "ticket_number": ticket.ticket_number,
        "title": ticket.title,
        "status": "resolved",
        "priority": ticket.priority,
        "category": ticket.category,
        "resolution_notes": ticket.resolution_notes,
        "user_email": getattr(resolve_data, "user_email", None),
        "agent_email": getattr(resolve_data, "agent_email", None),
    })

    db.commit()
    db.refresh(ticket)

    # Direct fire-and-forget (fast path)
    notify.notify_ticket_resolved(
        ticket_number=ticket.ticket_number,
        title=ticket.title,
        status=ticket.status,
        priority=ticket.priority,
        category=ticket.category,
        user_email=getattr(resolve_data, "user_email", None),
        agent_email=getattr(resolve_data, "agent_email", None),
        message=ticket.resolution_notes,
    )

    # Auto-post performance metric to directory-service
    _post_resolution_metric(ticket)

    return ticket


def add_comment(db: Session, ticket_id: int, comment_data):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None
    comment = TicketComment(
        ticket_id=ticket_id,
        comment=comment_data.comment,
        created_by=comment_data.created_by,
    )
    db.add(comment)
    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)
    return comment


def get_ticket_stats(db: Session):
    tickets = db.query(Ticket).all()
    total = len(tickets)
    by_status = {}
    by_priority = {}
    by_category = {}
    sla_breached = 0
    for t in tickets:
        by_status[t.status] = by_status.get(t.status, 0) + 1
        by_priority[t.priority] = by_priority.get(t.priority, 0) + 1
        by_category[t.category] = by_category.get(t.category, 0) + 1
        if t.sla_response_breached or t.sla_resolution_breached:
            sla_breached += 1
    return {
        "total": total,
        "by_status": by_status,
        "by_priority": by_priority,
        "by_category": by_category,
        "open": by_status.get("new", 0) + by_status.get("assigned", 0) + by_status.get("in_progress", 0),
        "resolved": by_status.get("resolved", 0),
        "closed": by_status.get("closed", 0),
        "sla_breached": sla_breached,
    }


# ─────────────────────────────────────────────────────────────
# Field-level history
# ─────────────────────────────────────────────────────────────

def get_ticket_history(db: Session, ticket_id: int):
    return (
        db.query(TicketHistory)
        .filter(TicketHistory.ticket_id == ticket_id)
        .order_by(TicketHistory.changed_at.asc())
        .all()
    )


# ─────────────────────────────────────────────────────────────
# Ticket linking (parent-child)
# ─────────────────────────────────────────────────────────────

def link_child_ticket(db: Session, parent_id: int, child_id: int, changed_by: str = "system"):
    """Set child ticket's parent_id to parent_id."""
    if parent_id == child_id:
        return None, "A ticket cannot be its own parent"
    parent = db.query(Ticket).filter(Ticket.id == parent_id).first()
    child = db.query(Ticket).filter(Ticket.id == child_id).first()
    if not parent:
        return None, "Parent ticket not found"
    if not child:
        return None, "Child ticket not found"
    # Prevent circular: child cannot already be a parent of parent
    if parent.parent_id == child_id:
        return None, "Circular link detected"
    old_parent = child.parent_id
    child.parent_id = parent_id
    child.updated_at = datetime.utcnow()
    _log_change(db, child, "parent_id", str(old_parent) if old_parent else None,
                str(parent_id), changed_by)
    db.commit()
    db.refresh(child)
    return child, None


def unlink_child_ticket(db: Session, parent_id: int, child_id: int, changed_by: str = "system"):
    """Remove the parent_id from a child ticket."""
    child = db.query(Ticket).filter(
        Ticket.id == child_id,
        Ticket.parent_id == parent_id,
    ).first()
    if not child:
        return None, "Child ticket not found or not linked to this parent"
    _log_change(db, child, "parent_id", str(parent_id), None, changed_by)
    child.parent_id = None
    child.updated_at = datetime.utcnow()
    db.commit()
    return True, None


def get_children(db: Session, parent_id: int):
    """Return all tickets whose parent_id matches."""
    return db.query(Ticket).filter(Ticket.parent_id == parent_id).all()


# ─────────────────────────────────────────────────────────────
# Bulk operations
# ─────────────────────────────────────────────────────────────

def bulk_close_tickets(db: Session, ticket_ids: list, resolution_notes: str,
                       resolved_by: str, changed_by: str = "system"):
    """Bulk close: resolve then close each ticket, skipping already-closed ones."""
    success, failed, errors = 0, 0, []
    for tid in ticket_ids:
        try:
            ticket = db.query(Ticket).filter(Ticket.id == tid).first()
            if not ticket:
                failed += 1
                errors.append(f"Ticket {tid}: not found")
                continue
            if ticket.status == "closed":
                success += 1  # already closed, count as success
                continue
            old_status = ticket.status
            # Force-close regardless of normal transitions
            if ticket.status not in ("resolved", "closed"):
                ticket.resolution_code = "bulk_close"
                ticket.resolution_notes = resolution_notes
                ticket.resolved_by = resolved_by
                ticket.resolved_at = datetime.utcnow()
                ticket.status = "resolved"
                _log_change(db, ticket, "status", old_status, "resolved", changed_by)
                old_status = "resolved"
            ticket.status = "closed"
            ticket.closed_at = datetime.utcnow()
            ticket.updated_at = datetime.utcnow()
            _log_change(db, ticket, "status", old_status, "closed", changed_by)
            success += 1
        except Exception as e:
            failed += 1
            errors.append(f"Ticket {tid}: {str(e)}")
    db.commit()
    return {"success_count": success, "failed_count": failed,
            "failed_ids": [], "errors": errors}


def bulk_reassign_tickets(db: Session, ticket_ids: list, assigned_to: str,
                          assignment_group: str = "", changed_by: str = "system"):
    """Bulk reassign tickets to a new assignee."""
    success, failed, errors = 0, 0, []
    for tid in ticket_ids:
        try:
            ticket = db.query(Ticket).filter(Ticket.id == tid).first()
            if not ticket:
                failed += 1
                errors.append(f"Ticket {tid}: not found")
                continue
            if ticket.status in ("closed",):
                failed += 1
                errors.append(f"Ticket {tid}: cannot reassign a closed ticket")
                continue
            old_assignee = ticket.assigned_to
            old_status = ticket.status
            ticket.assigned_to = assigned_to
            if assignment_group:
                ticket.assignment_group = assignment_group
            if ticket.status == "new":
                ticket.status = "assigned"
                _log_change(db, ticket, "status", old_status, "assigned", changed_by)
            ticket.updated_at = datetime.utcnow()
            _log_change(db, ticket, "assigned_to", old_assignee, assigned_to, changed_by)
            success += 1
        except Exception as e:
            failed += 1
            errors.append(f"Ticket {tid}: {str(e)}")
    db.commit()
    return {"success_count": success, "failed_count": failed,
            "failed_ids": [], "errors": errors}


def bulk_update_status(db: Session, ticket_ids: list, new_status: str,
                       changed_by: str = "system"):
    """Bulk status update - enforces valid transitions, skips invalid ones."""
    success, failed, failed_ids, errors = 0, 0, [], []
    for tid in ticket_ids:
        try:
            ticket = db.query(Ticket).filter(Ticket.id == tid).first()
            if not ticket:
                failed += 1
                failed_ids.append(tid)
                errors.append(f"Ticket {tid}: not found")
                continue
            allowed = VALID_TRANSITIONS.get(ticket.status, [])
            if new_status not in allowed:
                failed += 1
                failed_ids.append(tid)
                errors.append(
                    f"Ticket {tid}: cannot move from '{ticket.status}' to '{new_status}'"
                )
                continue
            old_status = ticket.status
            ticket.status = new_status
            ticket.updated_at = datetime.utcnow()
            _log_change(db, ticket, "status", old_status, new_status, changed_by)
            if new_status == "closed":
                ticket.closed_at = datetime.utcnow()
            success += 1
        except Exception as e:
            failed += 1
            failed_ids.append(tid)
            errors.append(f"Ticket {tid}: {str(e)}")
    db.commit()
    return {"success_count": success, "failed_count": failed,
            "failed_ids": failed_ids, "errors": errors}