"""
Live Security Alert Engine & SLA Pipeline Service for RiskTrix
Manages persistent security alert lifecycle (OPEN, IN_PROGRESS, RESOLVED, DISMISSED),
SLA breach detection, and automated webhook notification dispatching.
"""
import hmac
import hashlib
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.models import SecurityAlert, WebhookIntegration, SLAPolicy
from app.services.seed_data import DEFAULT_ALERTS, DEFAULT_WEBHOOKS, DEFAULT_SLA_POLICIES
from app.services.sla_calculator import calculate_sla_status
from app.services.webhook_dispatcher import dispatch_webhook_notification

logger = logging.getLogger("alert.engine")


from sqlalchemy import delete

class AlertEngineService:
    """Enterprise Alert Engine for persistent database state, SLA tracking, and SIEM/Webhook dispatching."""

    SLA_HOURS_MAP = {
        "CRITICAL": 4,
        "HIGH": 12,
        "MEDIUM": 24,
        "LOW": 48,
        "INFO": 72
    }

    async def ensure_seeded_data(self, db: AsyncSession):
        """Ensure initial SLA policies exist in PostgreSQL."""
        pol_result = await db.execute(select(SLAPolicy))
        if not pol_result.scalars().all():
            for p in DEFAULT_SLA_POLICIES:
                db.add(SLAPolicy(**p))
            await db.commit()

        # Purge legacy dummy alerts
        seed_alert_ids = ["ALT-CSPM-001", "ALT-K8S-002", "ALT-CIEM-003", "ALT-THREAT-004", "ALT-INTEG-005", "ALT-APP-006"]
        await db.execute(delete(SecurityAlert).where(SecurityAlert.alert_id.in_(seed_alert_ids)))
        await db.commit()

    async def list_alerts_with_sla(
        self,
        db: AsyncSession,
        severity: Optional[str] = None,
        source: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """List security alerts from database with real-time SLA status evaluation."""
        await self.ensure_seeded_data(db)

        query = select(SecurityAlert)
        if severity:
            query = query.where(SecurityAlert.severity == severity.upper())
        if source:
            query = query.where(SecurityAlert.source_service == source.upper())
        if status:
            query = query.where(SecurityAlert.status == status.upper())

        result = await db.execute(query)
        alerts = result.scalars().all()

        output = []
        for a in alerts:
            sla_info = calculate_sla_status(a.created_at, a.sla_deadline_hours, a.status)
            output.append({
                "id": a.id,
                "alert_id": a.alert_id,
                "title": a.title,
                "source_service": a.source_service,
                "severity": a.severity,
                "status": a.status,
                "assigned_to": a.assigned_to,
                "asset_id": a.asset_id,
                "description": a.description,
                "remediation_steps": a.remediation_steps,
                "sla_deadline_hours": a.sla_deadline_hours,
                "sla_status": sla_info["sla_status"],
                "hours_remaining": sla_info["hours_remaining"],
                "created_at": a.created_at,
                "updated_at": a.updated_at,
            })

        return output

    async def ingest_alert(self, db: AsyncSession, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Ingest a new security alert, calculate SLA deadline, save to DB, and auto-dispatch webhooks."""
        sev = alert_data.get("severity", "HIGH").upper()
        deadline_hrs = alert_data.get("sla_deadline_hours") or self.SLA_HOURS_MAP.get(sev, 24)
        alert_id = alert_data.get("alert_id") or f"ALT-{sev[:4]}-{int(datetime.utcnow().timestamp())}"

        alert_obj = SecurityAlert(
            alert_id=alert_id,
            title=alert_data.get("title", "Security Finding Alert"),
            source_service=alert_data.get("source_service", "CSPM").upper(),
            severity=sev,
            status="OPEN",
            assigned_to=alert_data.get("assigned_to"),
            asset_id=alert_data.get("asset_id"),
            description=alert_data.get("description"),
            remediation_steps=alert_data.get("remediation_steps"),
            sla_deadline_hours=deadline_hrs,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(alert_obj)
        await db.commit()
        await db.refresh(alert_obj)

        # Auto-dispatch webhooks for CRITICAL / HIGH alerts
        if sev in ["CRITICAL", "HIGH"]:
            wh_query = select(WebhookIntegration).where(WebhookIntegration.enabled == True)
            wh_result = await db.execute(wh_query)
            channels = wh_result.scalars().all()
            for ch in channels:
                if sev in (ch.events_filter or "CRITICAL,HIGH"):
                    payload = {
                        "alert_id": alert_obj.alert_id,
                        "title": alert_obj.title,
                        "severity": alert_obj.severity,
                        "source_service": alert_obj.source_service,
                        "description": alert_obj.description,
                        "remediation_steps": alert_obj.remediation_steps,
                        "asset_id": alert_obj.asset_id,
                    }
                    await dispatch_webhook_notification(ch.channel_type, ch.target_url, payload)

        sla_info = calculate_sla_status(alert_obj.created_at, alert_obj.sla_deadline_hours, alert_obj.status)
        return {
            "id": alert_obj.id,
            "alert_id": alert_obj.alert_id,
            "title": alert_obj.title,
            "source_service": alert_obj.source_service,
            "severity": alert_obj.severity,
            "status": alert_obj.status,
            "assigned_to": alert_obj.assigned_to,
            "asset_id": alert_obj.asset_id,
            "description": alert_obj.description,
            "remediation_steps": alert_obj.remediation_steps,
            "sla_deadline_hours": alert_obj.sla_deadline_hours,
            "sla_status": sla_info["sla_status"],
            "hours_remaining": sla_info["hours_remaining"],
            "created_at": alert_obj.created_at,
            "updated_at": alert_obj.updated_at,
        }

    async def update_alert(self, db: AsyncSession, alert_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Transition alert status (OPEN -> IN_PROGRESS -> RESOLVED/DISMISSED), update assignee, recalculate SLA."""
        query = select(SecurityAlert).where(SecurityAlert.alert_id == alert_id)
        result = await db.execute(query)
        alert = result.scalars().first()

        if not alert:
            return None

        if "status" in update_data and update_data["status"]:
            alert.status = update_data["status"].upper()
        if "assigned_to" in update_data and update_data["assigned_to"]:
            alert.assigned_to = update_data["assigned_to"]
        if "severity" in update_data and update_data["severity"]:
            alert.severity = update_data["severity"].upper()

        alert.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(alert)

        sla_info = calculate_sla_status(alert.created_at, alert.sla_deadline_hours, alert.status)
        return {
            "id": alert.id,
            "alert_id": alert.alert_id,
            "title": alert.title,
            "source_service": alert.source_service,
            "severity": alert.severity,
            "status": alert.status,
            "assigned_to": alert.assigned_to,
            "asset_id": alert.asset_id,
            "description": alert.description,
            "remediation_steps": alert.remediation_steps,
            "sla_deadline_hours": alert.sla_deadline_hours,
            "sla_status": sla_info["sla_status"],
            "hours_remaining": sla_info["hours_remaining"],
            "created_at": alert.created_at,
            "updated_at": alert.updated_at,
        }


alert_engine_service = AlertEngineService()
