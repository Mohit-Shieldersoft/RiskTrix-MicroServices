from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import SecurityAlert, WebhookIntegration
from app.schemas.alerts import AlertSummaryResponse

router = APIRouter()


@router.get("/notifications/summary", response_model=AlertSummaryResponse)
@router.get("/alerts/summary", response_model=AlertSummaryResponse)
async def get_alert_notifications_summary(db: AsyncSession = Depends(get_db)):
    alerts = (await db.execute(select(SecurityAlert))).scalars().all()
    webhooks = (await db.execute(select(WebhookIntegration))).scalars().all()
    tot_alerts = len(alerts)
    open_alerts = len([a for a in alerts if (a.status or "").upper() in ("OPEN", "IN_PROGRESS")])
    crit_count = len([a for a in alerts if (a.severity or "").upper() == "CRITICAL"])
    high_count = len([a for a in alerts if (a.severity or "").upper() == "HIGH"])
    med_count = len([a for a in alerts if (a.severity or "").upper() == "MEDIUM"])
    sla_breached = len([a for a in alerts if getattr(a, "sla_status", "") == "BREACHED"])
    sla_near = len([a for a in alerts if getattr(a, "sla_status", "") == "NEAR_BREACH"])
    return AlertSummaryResponse(
        total_alerts=tot_alerts,
        open_alerts=open_alerts,
        critical_alerts=crit_count,
        high_alerts=high_count,
        medium_alerts=med_count,
        sla_breached_count=sla_breached,
        sla_near_breach_count=sla_near,
        active_webhook_channels=len([w for w in webhooks if getattr(w, "enabled", True)]),
    )
