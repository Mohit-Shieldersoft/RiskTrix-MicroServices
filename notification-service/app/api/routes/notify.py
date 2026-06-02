import asyncio
import logging
from fastapi import APIRouter, HTTPException

from app.schemas.notify import (
    EmailRequest,
    TicketNotifyRequest,
    AlertNotifyRequest,
    AssignmentNotifyRequest,
    NotifyResponse,
)
from app.services.email_service import (
    send_email,
    compose_ticket_email,
    compose_alert_email,
    compose_assignment_email,
)

router = APIRouter(prefix="/notify", tags=["Notifications"])
logger = logging.getLogger("notification-service")


@router.post("/email", response_model=NotifyResponse)
async def notify_email(payload: EmailRequest):
    """Send a raw email to any recipient."""
    try:
        result = await send_email(
            to=payload.to,
            subject=payload.subject,
            body=payload.body,
            html=payload.html,
        )
        return NotifyResponse(
            success=True,
            detail=f"Email dispatched to {payload.to}",
            mode=result["mode"],
        )
    except Exception as exc:
        logger.error("notify_email error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to send email: {exc}")


@router.post("/ticket", response_model=NotifyResponse)
async def notify_ticket(payload: TicketNotifyRequest):
    """
    Send a ticket lifecycle notification to both USER and AGENT (per diagram).
    At least one of user_email / agent_email must be provided.
    """
    if not payload.user_email and not payload.agent_email:
        raise HTTPException(status_code=422, detail="At least one of user_email or agent_email is required.")

    subject, body = compose_ticket_email(
        notification_type=payload.notification_type,
        ticket_number=payload.ticket_number,
        title=payload.title,
        status=payload.status,
        priority=payload.priority,
        category=payload.category,
        assigned_to=payload.assigned_to,
        extra_message=payload.message,
    )

    recipients = [r for r in [payload.user_email, payload.agent_email] if r]
    errors = []
    sent = 0
    mode = "logged"

    for recipient in recipients:
        try:
            result = await send_email(to=recipient, subject=subject, body=body)
            mode = result["mode"]
            sent += 1
        except Exception as exc:
            logger.error("notify_ticket failed for %s: %s", recipient, exc)
            errors.append(recipient)

    if errors:
        return NotifyResponse(
            success=False,
            detail=f"Ticket notification sent to {sent}/{len(recipients)}, failed: {errors}",
            mode=mode,
        )

    return NotifyResponse(
        success=True,
        detail=f"Ticket notification ({payload.notification_type}) sent to {sent} recipient(s): {recipients}",
        mode=mode,
    )


@router.post("/alert", response_model=NotifyResponse)
async def notify_alert(payload: AlertNotifyRequest):
    """
    Broadcast an alert notification to multiple recipients.
    """
    subject, body = compose_alert_email(
        alert_type=payload.alert_type,
        severity=payload.severity,
        message=payload.message,
        details=payload.details,
    )

    errors = []
    sent = 0
    mode = "logged"

    for recipient in payload.recipient_emails:
        try:
            result = await send_email(to=recipient, subject=subject, body=body)
            mode = result["mode"]
            sent += 1
        except Exception as exc:
            logger.error("notify_alert failed for %s: %s", recipient, exc)
            errors.append(recipient)

    if errors:
        detail = f"Alert sent to {sent}/{len(payload.recipient_emails)} recipients. Failed: {errors}"
        return NotifyResponse(success=False, detail=detail, mode=mode)

    return NotifyResponse(
        success=True,
        detail=f"Alert dispatched to {sent} recipient(s)",
        mode=mode,
    )


@router.post("/assignment", response_model=NotifyResponse)
async def notify_assignment(payload: AssignmentNotifyRequest):
    """
    Notify an assignee that a ticket has been assigned to them.
    """
    subject, body = compose_assignment_email(
        ticket_number=payload.ticket_number,
        title=payload.title,
        priority=payload.priority,
        assignment_group=payload.assignment_group,
        assigned_to=payload.assigned_to,
        assigned_by=payload.assigned_by,
        due_date=payload.due_date,
    )
    try:
        result = await send_email(to=payload.assigned_to_email, subject=subject, body=body)
        return NotifyResponse(
            success=True,
            detail=f"Assignment notification sent to {payload.assigned_to_email}",
            mode=result["mode"],
        )
    except Exception as exc:
        logger.error("notify_assignment error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to send assignment notification: {exc}")
