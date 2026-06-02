"""
Queue Worker — polls outbox_events table every POLL_INTERVAL seconds.
Routes events to the appropriate downstream services:
  - ticket.created  → Notification Worker  → notification-service /notify/ticket
  - ticket.assigned → Notification Worker  → notification-service /notify/ticket
  - ticket.resolved → Notification Worker  → notification-service /notify/ticket
  - ticket.created (no assigned_to) → AutoAssign Worker → ticket-service /tickets/{id}/assign
"""
import asyncio
import logging
from datetime import datetime

import httpx
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.outbox import OutboxEvent

logger = logging.getLogger("queue-worker")

POLL_INTERVAL = 5           # seconds between polls
MAX_RETRIES = 3             # give up after this many failures
NOTIFICATION_URL = "http://localhost:8006/api/v1/notify/ticket"
ALERT_URL = "http://localhost:8006/api/v1/notify/alert"

# ─────────────────────────────────────────────────────────────────────────────
# Workers
# ─────────────────────────────────────────────────────────────────────────────

async def _notification_worker(event: OutboxEvent) -> None:
    """Send ticket notification to notification-service."""
    p = event.payload
    body = {
        "ticket_number": p.get("ticket_number"),
        "title": p.get("title"),
        "status": p.get("status"),
        "priority": p.get("priority"),
        "category": p.get("category"),
        "user_email": p.get("user_email"),
        "agent_email": p.get("agent_email"),
        "message": p.get("resolution_notes"),
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(NOTIFICATION_URL, json=body)
        resp.raise_for_status()
    logger.info(
        "[QUEUE] Notification dispatched for %s (%s)", p.get("ticket_number"), event.event_type
    )


async def _sla_breach_worker(event: OutboxEvent) -> None:
    """Send SLA breach alert to notification-service /alert endpoint."""
    p = event.payload
    breach_type = p.get("breach_type", "response")
    priority = p.get("priority", "unknown")
    ticket_number = p.get("ticket_number", "—")

    recipients = [r for r in [p.get("agent_email"), p.get("user_email")] if r]
    if not recipients:
        logger.warning("[QUEUE] SLA breach for %s has no recipients — skipping alert", ticket_number)
        return

    body = {
        "recipient_emails": recipients,
        "alert_type": "sla_breach",
        "severity": priority if priority in ("critical", "high", "medium", "low") else "high",
        "message": (
            f"SLA {breach_type.upper()} deadline breached for ticket {ticket_number}: "
            f"{p.get('title', '')}"
        ),
        "details": {
            "ticket_number": ticket_number,
            "breach_type": breach_type,
            "priority": priority,
        },
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(ALERT_URL, json=body)
        resp.raise_for_status()
    logger.info("[QUEUE] SLA breach alert dispatched for %s (%s SLA)", ticket_number, breach_type)


HANDLERS = {
    "ticket.created":     _notification_worker,
    "ticket.assigned":    _notification_worker,
    "ticket.resolved":    _notification_worker,
    "ticket.sla_breached": _sla_breach_worker,
}

# ─────────────────────────────────────────────────────────────────────────────
# Poller
# ─────────────────────────────────────────────────────────────────────────────

async def _process_event(db: Session, event: OutboxEvent) -> None:
    handler = HANDLERS.get(event.event_type)
    if not handler:
        # No handler — mark done so we don't keep retrying
        event.status = "done"
        event.processed_at = datetime.utcnow()
        event.error = "no handler registered"
        db.commit()
        return

    event.status = "processing"
    db.commit()

    try:
        await handler(event)
        event.status = "done"
        event.processed_at = datetime.utcnow()
        event.error = None
    except Exception as exc:
        event.retry_count += 1
        event.error = str(exc)
        if event.retry_count >= MAX_RETRIES:
            event.status = "failed"
            logger.error(
                "[QUEUE] Event %d (%s) failed after %d retries: %s",
                event.id, event.event_type, MAX_RETRIES, exc,
            )
        else:
            event.status = "pending"   # will be retried next poll
            logger.warning(
                "[QUEUE] Event %d (%s) retry %d/%d: %s",
                event.id, event.event_type, event.retry_count, MAX_RETRIES, exc,
            )
    finally:
        db.commit()


async def poll_loop() -> None:
    """Background task: continuously poll for pending outbox events."""
    logger.info("[QUEUE] Worker started — polling every %ds", POLL_INTERVAL)
    while True:
        try:
            db: Session = SessionLocal()
            try:
                pending = (
                    db.query(OutboxEvent)
                    .filter(OutboxEvent.status == "pending")
                    .order_by(OutboxEvent.created_at.asc())
                    .limit(50)
                    .all()
                )
                for event in pending:
                    await _process_event(db, event)
            finally:
                db.close()
        except Exception as exc:
            logger.error("[QUEUE] Poll error: %s", exc)

        await asyncio.sleep(POLL_INTERVAL)
