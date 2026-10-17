"""Application Reminders endpoint.

Returns applications grouped by owner with open vulnerability counts and delay (days open).
Used by the /application-reminder frontend page.
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_session
from app.models.models import Application, Vulnerability, VulnerabilityStatus, RiskLevel

router = APIRouter()


def _days_since(dt) -> int:
    """Return how many days ago a datetime was, timezone-safe."""
    if dt is None:
        return 0
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return max(0, (now - dt).days)


@router.get("/")
async def get_reminder_data(db: AsyncSession = Depends(get_session)):
    """
    Returns reminder data grouped by owner and by application.
    Response shape:
    {
      ownerData: [{ id, name, applicationCount, totalVulnerabilities, applications: [...] }],
      applicationData: [{ id, name, owner, vulnerabilities, delay, lastReminded }],
      stats: { owners, applications, totalVulnerabilities }
    }
    """
    # Fetch all applications
    apps_result = await db.execute(select(Application))
    applications = apps_result.scalars().all()

    # Fetch all OPEN vulnerabilities
    vulns_result = await db.execute(
        select(Vulnerability).where(Vulnerability.status == VulnerabilityStatus.OPEN)
    )
    open_vulns = vulns_result.scalars().all()

    # Index open vulns by application_id
    vulns_by_app: dict[int, list] = {}
    for v in open_vulns:
        if v.application_id not in vulns_by_app:
            vulns_by_app[v.application_id] = []
        vulns_by_app[v.application_id].append(v)

    # Build per-application summary
    app_summaries = []
    for app in applications:
        app_vulns = vulns_by_app.get(app.id, [])

        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        max_delay = {"critical": 0, "high": 0, "medium": 0, "low": 0}

        for v in app_vulns:
            sev = v.severity.value.lower() if v.severity else "low"
            if sev in counts:
                counts[sev] += 1
                days = _days_since(v.discovered_date)
                if days > max_delay[sev]:
                    max_delay[sev] = days

        total = sum(counts.values())
        max_days = max(max_delay.values())

        app_summaries.append({
            "id": str(app.id),
            "name": app.name,
            "owner": app.owner or "Unassigned",
            "vulnerabilities": {**counts, "total": total},
            "delay": {**max_delay, "max": max_days},
            "lastReminded": None,  # future: query application_reminders table
        })

    # Group by owner → ownerData
    owner_map: dict[str, dict] = {}
    for app in app_summaries:
        owner_name = app["owner"]
        if owner_name not in owner_map:
            owner_map[owner_name] = {
                "id": f"OWN-{len(owner_map)}",
                "name": owner_name,
                "applicationCount": 0,
                "totalVulnerabilities": 0,
                "applications": [],
            }
        owner_map[owner_name]["applicationCount"] += 1
        owner_map[owner_name]["totalVulnerabilities"] += app["vulnerabilities"]["total"]
        owner_map[owner_name]["applications"].append(app)

    owner_data = list(owner_map.values())

    # applicationData — grouped by app name, each entry has instances array
    app_name_map: dict[str, dict] = {}
    for app in app_summaries:
        name = app["name"]
        if name not in app_name_map:
            app_name_map[name] = {
                "id": f"APPGRP-{len(app_name_map)}",
                "name": name,
                "instances": [],
            }
        app_name_map[name]["instances"].append({
            "id": app["id"],
            "owner": app["owner"],
            "vulnerabilities": app["vulnerabilities"],
            "delay": app["delay"],
            "lastReminded": app["lastReminded"],
        })
    application_data = list(app_name_map.values())

    total_vulns = sum(a["vulnerabilities"]["total"] for a in app_summaries)

    return {
        "ownerData": owner_data,
        "applicationData": application_data,
        "stats": {
            "owners": len(owner_data),
            "applications": len(app_summaries),
            "totalVulnerabilities": total_vulns,
        },
    }


@router.post("/send")
async def send_reminder(
    payload: dict = Body(...),
    db: AsyncSession = Depends(get_session),
):
    """Send an application/EOSL reminder by email when SMTP is configured."""
    import smtplib
    import os
    from email.mime.text import MIMEText

    application_id = payload.get("applicationId") or payload.get("assetId")
    to_email = payload.get("email") or payload.get("ownerEmail")
    if application_id and not to_email and str(application_id).isdigit():
        result = await db.execute(select(Application).where(Application.id == int(application_id)))
        app_row = result.scalar_one_or_none()
        if app_row and getattr(app_row, "owner", None) and "@" in str(app_row.owner):
            to_email = app_row.owner
    if not to_email or "@" not in str(to_email):
        raise HTTPException(status_code=400, detail="No recipient email on this record")
    user = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    host = os.getenv("SMTP_SERVER") or os.getenv("SMTP_HOST") or "smtp.gmail.com"
    port = int(os.getenv("SMTP_PORT") or 587)
    if not user or not password:
        raise HTTPException(status_code=503, detail="SMTP is not configured or the email could not be sent")
    try:
        msg = MIMEText(payload.get("message") or f"RiskTrix reminder for record {application_id}")
        msg["Subject"] = "RiskTrix reminder"
        msg["From"] = user
        msg["To"] = to_email
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(user, password)
            server.send_message(msg)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"SMTP send failed: {exc}") from exc
    return {
        "success": True,
        "message": f"Reminder sent to {to_email}",
        "applicationId": application_id,
        "remindedAt": datetime.utcnow().isoformat() if hasattr(datetime, "utcnow") else None,
    }
