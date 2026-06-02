import smtplib
import logging
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from functools import partial

from app.core.config import settings

logger = logging.getLogger("notification-service")


def _smtp_configured() -> bool:
    return bool(settings.smtp_user and settings.smtp_password)


def _build_message(to: str, subject: str, body: str, html: bool = False) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to
    mime_type = "html" if html else "plain"
    msg.attach(MIMEText(body, mime_type))
    return msg


def _send_sync(to: str, subject: str, body: str, html: bool = False) -> None:
    """Blocking SMTP send — run inside a thread executor."""
    msg = _build_message(to, subject, body, html)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        if settings.smtp_tls:
            server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from, [to], msg.as_string())


async def send_email(to: str, subject: str, body: str, html: bool = False) -> dict:
    """
    Send an email via SMTP.
    Falls back to console logging if SMTP is not configured.
    Returns {"success": bool, "mode": "sent"|"logged"}.
    """
    if not _smtp_configured():
        logger.info("[LOG-ONLY] EMAIL → %s | Subject: %s\n%s", to, subject, body)
        return {"success": True, "mode": "logged"}

    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(None, partial(_send_sync, to, subject, body, html))
        logger.info("Email sent → %s | %s", to, subject)
        return {"success": True, "mode": "sent"}
    except Exception as exc:
        logger.error("Email failed → %s: %s", to, exc)
        raise


# ── Pre-built email composers ────────────────────────────────────────────────

def compose_ticket_email(
    notification_type: str,
    ticket_number: str,
    title: str,
    status: str,
    priority: str,
    category: str | None,
    assigned_to: str | None,
    extra_message: str | None,
) -> tuple[str, str]:
    """Returns (subject, body) for a ticket notification."""
    type_label = {
        "created": "New Ticket Created",
        "updated": "Ticket Updated",
        "resolved": "Ticket Resolved",
        "assigned": "Ticket Assigned to You",
    }.get(notification_type, "Ticket Notification")

    subject = f"[RiskTrix] {type_label} — {ticket_number}"
    lines = [
        f"Ticket: {ticket_number}",
        f"Title:  {title}",
        f"Status: {status}",
        f"Priority: {priority}",
    ]
    if category:
        lines.append(f"Category: {category}")
    if assigned_to:
        lines.append(f"Assigned To: {assigned_to}")
    if extra_message:
        lines.append(f"\nNote: {extra_message}")
    lines.append("\n— RiskTrix Notification Service")
    body = "\n".join(lines)
    return subject, body


def compose_alert_email(
    alert_type: str,
    severity: str,
    message: str,
    details: dict | None,
) -> tuple[str, str]:
    subject = f"[RiskTrix ALERT] {severity.upper()} — {alert_type}"
    lines = [
        f"Alert Type: {alert_type}",
        f"Severity:   {severity.upper()}",
        f"Message:    {message}",
    ]
    if details:
        lines.append("\nDetails:")
        for k, v in details.items():
            lines.append(f"  {k}: {v}")
    lines.append("\n— RiskTrix Notification Service")
    body = "\n".join(lines)
    return subject, body


def compose_assignment_email(
    ticket_number: str,
    title: str,
    priority: str,
    assignment_group: str | None,
    assigned_to: str,
    assigned_by: str,
    due_date: str | None,
) -> tuple[str, str]:
    subject = f"[RiskTrix] Ticket Assigned — {ticket_number}"
    lines = [
        f"Hi {assigned_to},",
        f"\nTicket {ticket_number} has been assigned to you.",
        f"\nTitle:    {title}",
        f"Priority: {priority}",
    ]
    if assignment_group:
        lines.append(f"Team:     {assignment_group}")
    lines.append(f"Assigned by: {assigned_by}")
    if due_date:
        lines.append(f"Due Date: {due_date}")
    lines.append("\n— RiskTrix Notification Service")
    body = "\n".join(lines)
    return subject, body
