"""
SLA Breach Checker — Background Task
======================================
Runs every POLL_INTERVAL seconds. Scans for tickets where:
  - The SLA deadline has passed
  - The breach flag is NOT yet set (nobody has acted on the ticket)

When found, it:
  1. Sets the sla_*_breached flag on the ticket
  2. Publishes a ticket.sla_breached outbox event (picked up by queue-service)

This catches the real-time breach scenario (clock runs out, nobody acted),
complementing the action-time detection in ticket_service.py.
"""
import asyncio
import logging
import httpx
from datetime import datetime

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.ticket import Ticket
from app.services import outbox_service as outbox

logger = logging.getLogger("ticket-service.sla-checker")

POLL_INTERVAL = 60  # seconds
DIRECTORY_SERVICE_URL = "http://localhost:8008/api/v1"
NOTIFICATION_SERVICE_URL = "http://localhost:8006/api/v1"


def _escalate_to_on_call(ticket: Ticket, breach_type: str) -> None:
    """
    Alert all currently on-call agents when an SLA breach is detected.
    Fire-and-forget — errors are logged but never raise.
    """
    try:
        resp = httpx.get(f"{DIRECTORY_SERVICE_URL}/directory/on-call", timeout=3.0)
        if resp.status_code != 200:
            return
        on_call = resp.json()
        if not on_call:
            return
        emails = list({oc["agent_email"] for oc in on_call})
        severity = "critical" if ticket.priority in ("critical", "high") else "high"
        httpx.post(
            f"{NOTIFICATION_SERVICE_URL}/notify/alert",
            json={
                "recipient_emails": emails,
                "alert_type": "sla_breach_escalation",
                "severity": severity,
                "message": (
                    f"SLA {breach_type} breach — {ticket.ticket_number} "
                    f"({ticket.priority} priority) requires immediate attention."
                ),
                "details": {
                    "ticket_number": ticket.ticket_number,
                    "title": ticket.title,
                    "priority": ticket.priority,
                    "breach_type": breach_type,
                    "assigned_to": ticket.assigned_to or "Unassigned",
                    "sla_due": str(
                        ticket.sla_response_due if breach_type == "response"
                        else ticket.sla_resolution_due
                    ),
                },
            },
            timeout=3.0,
        )
        logger.info(
            "[SLA] Escalated %s breach on %s to on-call agents: %s",
            breach_type, ticket.ticket_number, emails,
        )
    except Exception as exc:
        logger.warning(
            "[SLA] On-call escalation failed for %s: %s",
            ticket.ticket_number, exc,
        )


def _check_once(db: Session) -> int:
    """Check for overdue SLAs, mark them, publish outbox events. Returns count of new breaches."""
    now = datetime.utcnow()
    active_statuses = ["new", "assigned", "in_progress"]
    new_breaches = 0

    # Response SLA — ticket not yet assigned/responded to
    response_overdue = (
        db.query(Ticket)
        .filter(
            Ticket.status.in_(active_statuses),
            Ticket.sla_response_breached == False,  # noqa: E712
            Ticket.sla_response_met_at == None,      # noqa: E711
            Ticket.sla_response_due != None,         # noqa: E711
            Ticket.sla_response_due < now,
        )
        .all()
    )

    for ticket in response_overdue:
        ticket.sla_response_breached = True
        outbox.publish(db, "ticket.sla_breached", {
            "ticket_number": ticket.ticket_number,
            "title": ticket.title,
            "priority": ticket.priority,
            "breach_type": "response",
            "agent_email": ticket.assigned_to or None,
            "user_email": ticket.caller_email or None,
        })
        new_breaches += 1
        logger.warning(
            "[SLA] Response SLA breached for %s (priority=%s, due=%s)",
            ticket.ticket_number, ticket.priority, ticket.sla_response_due,
        )
        _escalate_to_on_call(ticket, "response")

    # Resolution SLA — ticket not yet resolved/closed
    resolution_overdue = (
        db.query(Ticket)
        .filter(
            Ticket.status.in_(active_statuses),
            Ticket.sla_resolution_breached == False,  # noqa: E712
            Ticket.sla_resolution_due != None,         # noqa: E711
            Ticket.sla_resolution_due < now,
        )
        .all()
    )

    for ticket in resolution_overdue:
        ticket.sla_resolution_breached = True
        outbox.publish(db, "ticket.sla_breached", {
            "ticket_number": ticket.ticket_number,
            "title": ticket.title,
            "priority": ticket.priority,
            "breach_type": "resolution",
            "agent_email": ticket.assigned_to or None,
            "user_email": ticket.caller_email or None,
        })
        new_breaches += 1
        logger.warning(
            "[SLA] Resolution SLA breached for %s (priority=%s, due=%s)",
            ticket.ticket_number, ticket.priority, ticket.sla_resolution_due,
        )
        _escalate_to_on_call(ticket, "resolution")

    if new_breaches:
        db.commit()
        logger.info("[SLA] Committed %d new breach flag(s)", new_breaches)

    return new_breaches


async def sla_check_loop() -> None:
    """Background task: periodically scan for overdue SLA tickets."""
    logger.info("[SLA] Checker started — polling every %ds", POLL_INTERVAL)
    while True:
        await asyncio.sleep(POLL_INTERVAL)
        db = SessionLocal()
        try:
            count = _check_once(db)
            if count:
                logger.info("[SLA] %d breach event(s) published this cycle", count)
        except Exception as exc:
            logger.error("[SLA] Checker error: %s", exc)
        finally:
            db.close()
