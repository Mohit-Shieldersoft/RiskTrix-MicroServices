"""
Notification client for ticket-service.
Calls notification-service (port 8006) fire-and-forget style so ticket
operations never fail due to notification errors.
Matches diagram: Ticket Service → Notification Service → USER & Agent
"""
import logging
import threading
import asyncio
from typing import Optional

import httpx

NOTIFICATION_SERVICE_URL = "http://localhost:8006/api/v1"
logger = logging.getLogger("ticket-service.notify")


async def _post(endpoint: str, payload: dict) -> None:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{NOTIFICATION_SERVICE_URL}{endpoint}",
                json=payload,
            )
            if resp.status_code != 200:
                logger.warning("Notification %s returned %s: %s", endpoint, resp.status_code, resp.text)
    except Exception as exc:
        logger.warning("Notification call to %s failed (non-blocking): %s", endpoint, exc)


def _fire(endpoint: str, payload: dict) -> None:
    """Run the async HTTP call in a fresh daemon thread so it never blocks the caller."""
    def run():
        asyncio.run(_post(endpoint, payload))
    t = threading.Thread(target=run, daemon=True)
    t.start()


# ── Public helpers called from ticket_service.py ────────────────────────────

def notify_ticket_created(
    ticket_number: str,
    title: str,
    status: str,
    priority: str,
    category: Optional[str],
    user_email: Optional[str],
    agent_email: Optional[str],
) -> None:
    if not user_email and not agent_email:
        return
    _fire("/notify/ticket", {
        "ticket_number": ticket_number,
        "title": title,
        "status": status,
        "priority": priority,
        "category": category,
        "user_email": user_email,
        "agent_email": agent_email,
        "notification_type": "created",
    })


def notify_ticket_assigned(
    ticket_number: str,
    title: str,
    status: str,
    priority: str,
    category: Optional[str],
    assigned_to: Optional[str],
    user_email: Optional[str],
    agent_email: Optional[str],
) -> None:
    if not user_email and not agent_email:
        return
    _fire("/notify/ticket", {
        "ticket_number": ticket_number,
        "title": title,
        "status": status,
        "priority": priority,
        "category": category,
        "assigned_to": assigned_to,
        "user_email": user_email,
        "agent_email": agent_email,
        "notification_type": "assigned",
    })


def notify_ticket_resolved(
    ticket_number: str,
    title: str,
    status: str,
    priority: str,
    category: Optional[str],
    user_email: Optional[str],
    agent_email: Optional[str],
    message: Optional[str] = None,
) -> None:
    if not user_email and not agent_email:
        return
    _fire("/notify/ticket", {
        "ticket_number": ticket_number,
        "title": title,
        "status": status,
        "priority": priority,
        "category": category,
        "user_email": user_email,
        "agent_email": agent_email,
        "notification_type": "resolved",
        "message": message,
    })


def notify_ticket_updated(
    ticket_number: str,
    title: str,
    status: str,
    priority: str,
    category: Optional[str],
    user_email: Optional[str],
    agent_email: Optional[str],
) -> None:
    if not user_email and not agent_email:
        return
    _fire("/notify/ticket", {
        "ticket_number": ticket_number,
        "title": title,
        "status": status,
        "priority": priority,
        "category": category,
        "user_email": user_email,
        "agent_email": agent_email,
        "notification_type": "updated",
    })
