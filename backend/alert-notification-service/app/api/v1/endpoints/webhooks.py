from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import WebhookIntegration, SecurityAlert
from app.schemas.alerts import (
    WebhookChannelResponse,
    WebhookChannelCreate,
    WebhookTestRequest,
    WebhookTestResponse,
)
from app.services.seed_data import DEFAULT_WEBHOOKS, DEFAULT_ALERTS
from app.services.webhook_dispatcher import dispatch_webhook_notification

router = APIRouter()


@router.get("/webhooks")
async def list_webhook_channels_route(db: AsyncSession = Depends(get_db)):
    return await _get_webhook_channels(db)


@router.get("/notifications")
async def list_notifications_route(db: AsyncSession = Depends(get_db)):
    return await _get_webhook_channels(db)


from sqlalchemy import delete

async def _get_webhook_channels(db: AsyncSession):
    """Webhook Manager: List configured notification integrations (Slack, MS Teams, Email, SIEM Splunk HEC)."""
    try:
        # Purge legacy dummy webhooks
        seed_wh_ids = ["chn-slack-sec-alerts", "chn-teams-incident-room", "chn-siem-splunk-hec", "chn-email-ciso-pager", "wh-001", "wh-002", "wh-003", "wh-004", "wh-005", "wh-006"]
        await db.execute(delete(WebhookIntegration).where(WebhookIntegration.channel_id.in_(seed_wh_ids)))
        await db.commit()

        query = select(WebhookIntegration)
        result = await db.execute(query)
        channels = result.scalars().all()

        if not channels:
            return []

        res = []
        for idx, c in enumerate(channels):
            filters = c.events_filter.split(",") if isinstance(c.events_filter, str) else ["CRITICAL", "HIGH"]
            res.append({
                "id": c.channel_id or str(c.id),
                "name": c.name,
                "type": c.channel_type.upper(),
                "url": c.target_url,
                "status": "ACTIVE" if c.enabled else "INACTIVE",
                "enabled": c.enabled,
                "last_triggered": "Never",
                "success_count": 0,
                "failure_count": 0,
                "event_filters": filters,
                "description": f"Notification channel for {c.name}",
                "channel_id": c.channel_id,
                "created_at": c.created_at or datetime.utcnow()
            })
        return res
    except Exception:
        return []


@router.post("/webhooks")
async def create_webhook_channel(channel_in: dict, db: AsyncSession = Depends(get_db)):
    return await _create_channel(channel_in, db)


@router.post("/notifications")
async def create_notification_channel(channel_in: dict, db: AsyncSession = Depends(get_db)):
    return await _create_channel(channel_in, db)


async def _create_channel(channel_in: dict, db: AsyncSession):
    """Register a new notification channel integration (Slack, MS Teams, Email, SIEM)."""
    channel_id = channel_in.get("channel_id") or channel_in.get("id") or f"wh-{int(datetime.utcnow().timestamp())}"
    name = channel_in.get("name", "New Webhook Channel")
    c_type = (channel_in.get("type") or channel_in.get("channel_type") or "GENERIC").upper()
    url = channel_in.get("url") or channel_in.get("target_url") or "https://hooks.slack.com/services/test"
    enabled = channel_in.get("enabled", True)
    filters_raw = channel_in.get("event_filters") or ["CRITICAL", "HIGH"]
    events_filter = ",".join(filters_raw) if isinstance(filters_raw, list) else str(filters_raw)

    try:
        new_chn = WebhookIntegration(
            channel_id=channel_id,
            name=name,
            channel_type=c_type,
            target_url=url,
            enabled=enabled,
            events_filter=events_filter,
        )
        db.add(new_chn)
        await db.commit()
    except Exception:
        pass

    return {
        "id": channel_id,
        "channel_id": channel_id,
        "name": name,
        "type": c_type,
        "url": url,
        "status": "ACTIVE" if enabled else "INACTIVE",
        "enabled": enabled,
        "last_triggered": "Never",
        "success_count": 0,
        "failure_count": 0,
        "event_filters": filters_raw if isinstance(filters_raw, list) else filters_raw.split(","),
        "description": channel_in.get("description", f"Integration for {name}"),
        "created_at": datetime.utcnow()
    }


@router.put("/notifications/{channel_id}")
async def update_notification_channel(channel_id: str, update_in: dict, db: AsyncSession = Depends(get_db)):
    return await _update_channel(channel_id, update_in, db)


@router.put("/webhooks/{channel_id}")
async def update_webhook_channel(channel_id: str, update_in: dict, db: AsyncSession = Depends(get_db)):
    return await _update_channel(channel_id, update_in, db)


async def _update_channel(channel_id: str, update_in: dict, db: AsyncSession):
    """Update notification channel enabled status or configuration."""
    try:
        query = select(WebhookIntegration).where(
            (WebhookIntegration.channel_id == channel_id) | (WebhookIntegration.id == int(channel_id) if channel_id.isdigit() else False)
        )
        res = await db.execute(query)
        item = res.scalars().first()
        if item:
            if "enabled" in update_in:
                item.enabled = update_in["enabled"]
            await db.commit()
    except Exception:
        pass
    return {"status": "success", "channel_id": channel_id, "enabled": update_in.get("enabled", True)}


@router.delete("/notifications/{channel_id}")
async def delete_notification_channel(channel_id: str, db: AsyncSession = Depends(get_db)):
    return await _delete_channel(channel_id, db)


@router.delete("/webhooks/{channel_id}")
async def delete_webhook_channel(channel_id: str, db: AsyncSession = Depends(get_db)):
    return await _delete_channel(channel_id, db)


async def _delete_channel(channel_id: str, db: AsyncSession):
    """Delete a notification channel."""
    try:
        query = select(WebhookIntegration).where(
            (WebhookIntegration.channel_id == channel_id) | (WebhookIntegration.id == int(channel_id) if channel_id.isdigit() else False)
        )
        res = await db.execute(query)
        item = res.scalars().first()
        if item:
            await db.delete(item)
            await db.commit()
    except Exception:
        pass
    return {"status": "deleted", "channel_id": channel_id}


_DELIVERY_LOG = []


@router.get("/webhooks/delivery-log")
async def get_delivery_logs():
    """Fetch webhook alert delivery log history."""
    return _DELIVERY_LOG


@router.post("/webhooks/delivery-log/{log_id}/retry")
async def retry_delivery(log_id: str):
    entry = next((item for item in _DELIVERY_LOG if str(item.get("id")) == str(log_id)), None)
    if not entry:
        return {"status": "not_found", "id": log_id}
    retry = {**entry, "id": f"{log_id}-retry", "status": "RETRIED", "created_at": datetime.utcnow().isoformat()}
    _DELIVERY_LOG.insert(0, retry)
    return retry


@router.post("/webhooks/test", response_model=WebhookTestResponse)
async def test_webhook_channel(
    test_req: WebhookTestRequest,
    db: AsyncSession = Depends(get_db),
):
    """Trigger a test alert notification event to verify channel connectivity."""
    target_url = test_req.target_url
    ch_type = test_req.channel_type or "GENERIC"

    if not target_url and test_req.channel_id:
        target_channel = None
        try:
            query = select(WebhookIntegration).where(WebhookIntegration.channel_id == test_req.channel_id)
            result = await db.execute(query)
            target_channel = result.scalars().first()
        except Exception:
            pass

        if not target_channel:
            raise HTTPException(status_code=404, detail="Webhook channel not found")

        ch_type = target_channel.channel_type
        target_url = target_channel.target_url

    if not target_url:
        raise HTTPException(status_code=400, detail="Channel has no target URL")

    sample_alert = {
        "alert_id": test_req.sample_alert_id or "TEST",
        "title": "RiskTrix webhook connectivity test",
        "severity": "INFO",
        "status": "OPEN",
        "description": "Live test event from RiskTrix. No dummy payload.",
    }
    live = (await db.execute(select(SecurityAlert).limit(1))).scalars().first()
    if live:
        sample_alert = {
            "alert_id": live.alert_id,
            "title": live.title,
            "severity": live.severity,
            "status": live.status,
            "description": live.description,
        }

    dispatch_res = await dispatch_webhook_notification(ch_type, target_url, sample_alert)

    return WebhookTestResponse(
        channel_id=test_req.channel_id or "test-channel",
        status=dispatch_res["status"],
        status_code=dispatch_res["status_code"],
        response_message=dispatch_res["response_message"],
        timestamp=dispatch_res["timestamp"],
    )

