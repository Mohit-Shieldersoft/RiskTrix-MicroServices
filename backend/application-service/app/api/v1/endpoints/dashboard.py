"""Dashboard API router for vulnerability ageing and statistics"""
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from typing import List, Dict, Any
import logging

from app.db.session import get_session
from app.models.models import Vulnerability, Application, VulnerabilityStatus, RiskLevel as ModelRiskLevel

logger = logging.getLogger(__name__)

router = APIRouter()


def _as_utc(dt: datetime) -> datetime:
    """Ensure a datetime is timezone-aware (UTC). Handles naive datetimes from DB."""
    if dt is None:
        return datetime.now(timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _days_since(dt: datetime, now: datetime) -> int:
    """Calculate days between two datetimes, safely handling tz-naive values."""
    return max(0, (now - _as_utc(dt)).days)


@router.get("")
@router.get("/")
@router.get("/data")
async def get_dashboard_data(
    db: AsyncSession = Depends(get_session)
):
    """
    Get complete dashboard data for vulnerability ageing page.
    Returns all necessary data for charts and tables.
    """
    try:
        now = datetime.now(timezone.utc)

        # ── Applications ────────────────────────────────────────────────────
        apps_result = await db.execute(select(Application))
        all_apps = apps_result.scalars().all()

        applications_data = []
        for app in all_apps:
            vulns_result = await db.execute(
                select(Vulnerability).where(
                    Vulnerability.application_id == app.id,
                    Vulnerability.status == VulnerabilityStatus.OPEN
                )
            )
            vulns = vulns_result.scalars().all()

            critical_count = sum(1 for v in vulns if v.severity == ModelRiskLevel.CRITICAL)
            high_count    = sum(1 for v in vulns if v.severity == ModelRiskLevel.HIGH)
            medium_count  = sum(1 for v in vulns if v.severity == ModelRiskLevel.MEDIUM)
            low_count     = sum(1 for v in vulns if v.severity == ModelRiskLevel.LOW)

            critical_delay_days = 0
            if critical_count > 0:
                critical_vulns = [v for v in vulns if v.severity == ModelRiskLevel.CRITICAL]
                critical_delay_days = max(
                    _days_since(v.discovered_date, now) for v in critical_vulns
                )

            risk_level = "low"
            if critical_count > 0:
                risk_level = "critical" if critical_count >= 3 else "high"
            elif high_count > 0:
                risk_level = "high" if high_count >= 5 else "medium"
            elif medium_count > 0:
                risk_level = "medium"

            applications_data.append({
                "id": str(app.id),
                "name": app.name,
                "vulnerabilities": {
                    "critical": critical_count,
                    "high": high_count,
                    "medium": medium_count,
                    "low": low_count
                },
                "riskLevel": risk_level,
                "criticalDelayDays": critical_delay_days
            })

        # ── Delayed vulnerabilities by time frame ────────────────────────────
        all_open_result = await db.execute(
            select(Vulnerability).where(Vulnerability.status == VulnerabilityStatus.OPEN)
        )
        all_open_vulns = all_open_result.scalars().all()

        delayed_data = {
            "0-30":  {"critical": 0, "high": 0, "medium": 0, "low": 0},
            "30-60": {"critical": 0, "high": 0, "medium": 0, "low": 0},
            "60-90": {"critical": 0, "high": 0, "medium": 0, "low": 0},
            "90+":   {"critical": 0, "high": 0, "medium": 0, "low": 0},
        }

        for vuln in all_open_vulns:
            days_open = _days_since(vuln.discovered_date, now)
            severity_key = vuln.severity.value.lower() if vuln.severity else "low"
            if severity_key not in ("critical", "high", "medium", "low"):
                severity_key = "low"

            if days_open <= 30:
                delayed_data["0-30"][severity_key] += 1
            elif days_open <= 60:
                delayed_data["30-60"][severity_key] += 1
            elif days_open <= 90:
                delayed_data["60-90"][severity_key] += 1
            else:
                delayed_data["90+"][severity_key] += 1

        delayed_vulnerabilities = [
            {"timeFrame": "0-30",  **delayed_data["0-30"]},
            {"timeFrame": "30-60", **delayed_data["30-60"]},
            {"timeFrame": "60-90", **delayed_data["60-90"]},
            {"timeFrame": "90+",   **delayed_data["90+"]},
        ]

        # ── Overall status ────────────────────────────────────────────────────
        open_result   = await db.execute(
            select(func.count(Vulnerability.id)).where(Vulnerability.status == VulnerabilityStatus.OPEN)
        )
        closed_result = await db.execute(
            select(func.count(Vulnerability.id)).where(Vulnerability.status == VulnerabilityStatus.CLOSED)
        )
        open_count   = open_result.scalar() or 0
        closed_count = closed_result.scalar() or 0

        overall_status = [
            {"name": "Open",   "value": open_count,   "color": "#ff6384"},
            {"name": "Closed", "value": closed_count, "color": "#36a2eb"},
        ]

        # ── Vulnerabilities by application type ───────────────────────────────
        type_data: Dict[str, list] = {}
        for app in all_apps:
            app_type = app.application_type.value if app.application_type else "Unknown"
            if app_type not in type_data:
                type_data[app_type] = []

            count_result = await db.execute(
                select(func.count(Vulnerability.id)).where(
                    Vulnerability.application_id == app.id,
                    Vulnerability.status == VulnerabilityStatus.OPEN
                )
            )
            vuln_count = count_result.scalar() or 0
            if vuln_count > 0:
                type_data[app_type].append({"name": app.name, "value": vuln_count})

        application_type_vulnerabilities = [
            {"type": app_type, "data": apps}
            for app_type, apps in type_data.items()
        ]

        # ── Detailed vulnerability table (per-application grouped) ───────────
        # Fetch all vulnerabilities (open + closed) joined to applications
        all_detailed_result = await db.execute(
            select(Vulnerability, Application)
            .join(Application, Vulnerability.application_id == Application.id)
            .limit(500)
        )
        all_detailed_rows = all_detailed_result.all()

        # Group by application into the shape DetailedVulnerabilityTable expects:
        # [{ id, name, open: {critical,high,medium,low}, closed: {critical,high,medium,low} }]
        app_detail_map: Dict[int, dict] = {}
        for vuln, app in all_detailed_rows:
            if app.id not in app_detail_map:
                app_detail_map[app.id] = {
                    "id": str(app.id),
                    "name": app.name,
                    "open":   {"critical": 0, "high": 0, "medium": 0, "low": 0},
                    "closed": {"critical": 0, "high": 0, "medium": 0, "low": 0},
                }
            bucket = "open" if vuln.status == VulnerabilityStatus.OPEN else "closed"
            sev = vuln.severity.value.lower() if vuln.severity else "low"
            if sev in app_detail_map[app.id][bucket]:
                app_detail_map[app.id][bucket][sev] += 1

        detailed_vulnerabilities = list(app_detail_map.values())

        return {
            "applications": applications_data,
            "delayedVulnerabilities": delayed_vulnerabilities,
            "overallVulnerabilityStatus": overall_status,
            "applicationTypeVulnerabilities": application_type_vulnerabilities,
            "detailedVulnerabilities": detailed_vulnerabilities,
        }

    except Exception as exc:
        logger.exception("Error building dashboard data: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal error: {type(exc).__name__}: {str(exc)}"}
        )
