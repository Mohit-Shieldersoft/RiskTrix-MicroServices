from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.schemas.alerts import (
    SecurityAlertResponse,
    SecurityAlertCreate,
    SecurityAlertUpdate,
    SLAPolicyResponse,
)
from app.services.alert_service import alert_engine_service
from app.services.seed_data import DEFAULT_SLA_POLICIES
from app.services.sla_calculator import calculate_sla_status
from app.services.demo_scope import is_demo_request, in_scope
from app.models.models import SecurityAlert

router = APIRouter()


@router.get("/alerts", response_model=List[SecurityAlertResponse])
async def list_security_alerts(
    request: Request,
    severity: Optional[str] = None,
    source: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Unified Security Alert Inbox: Fetch consolidated alerts with live SLA status calculation and DB persistence."""
    try:
        alerts = await alert_engine_service.list_alerts_with_sla(
            db=db, severity=severity, source=source, status=status
        )
        demo = is_demo_request(request)
        scoped = [a for a in alerts if in_scope(a.get("alert_id") or a.get("id"), demo)]
        return [SecurityAlertResponse(**a) for a in scoped]
    except Exception:
        return []


@router.post("/alerts/demo/provision")
async def provision_demo_alerts(request: Request, db: AsyncSession = Depends(get_db)):
    if not is_demo_request(request):
        raise HTTPException(status_code=403, detail="Demo alerts are only available to the demo account.")
    existing = (await db.execute(select(SecurityAlert).where(SecurityAlert.alert_id == "DEMO-ALRT-001"))).scalar_one_or_none()
    if not existing:
        db.add(SecurityAlert(
            alert_id="DEMO-ALRT-001",
            title="Demo: public security group on DEMO-AWS",
            source_service="CSPM",
            severity="CRITICAL",
            status="OPEN",
            asset_id="sg-demo0a8bf",
            description="Sample alert for the isolated demo workspace.",
            remediation_steps="Restrict 0.0.0.0/0 ingress. Guided only.",
            sla_deadline_hours=24,
        ))
        await db.commit()
    return {"status": "ready", "mode": "demo"}


@router.post("/alerts", response_model=SecurityAlertResponse)
async def create_security_alert(
    alert_in: SecurityAlertCreate,
    db: AsyncSession = Depends(get_db),
):
    """Ingest a new alert into the Unified Security Alert Inbox and trigger webhook notifications."""
    try:
        alert_dict = alert_in.model_dump()
        result = await alert_engine_service.ingest_alert(db=db, alert_data=alert_dict)
        return SecurityAlertResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/alerts/{alert_id}", response_model=SecurityAlertResponse)
async def update_security_alert(
    alert_id: str,
    update_in: SecurityAlertUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update status, assignee, or severity of an existing security alert with state transition logging."""
    try:
        update_dict = update_in.model_dump(exclude_unset=True)
        res = await alert_engine_service.update_alert(db=db, alert_id=alert_id, update_data=update_dict)
        if not res:
            raise HTTPException(status_code=404, detail="Alert not found")
        return SecurityAlertResponse(**res)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/alerts/{alert_id}/comments")
async def list_alert_comments(alert_id: str, db: AsyncSession = Depends(get_db)):
    from app.models.models import AlertComment
    result = await db.execute(select(AlertComment).where(AlertComment.alert_id == alert_id).order_by(AlertComment.created_at.desc()))
    return [
        {"id": row.id, "alert_id": row.alert_id, "author": row.author, "body": row.body, "created_at": row.created_at}
        for row in result.scalars().all()
    ]


@router.post("/alerts/{alert_id}/comments")
async def add_alert_comment(alert_id: str, body: str, author: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    from app.models.models import AlertComment
    comment = AlertComment(alert_id=alert_id, author=author or "analyst", body=body)
    db.add(comment)
    await db.commit()
    return {"alert_id": alert_id, "author": comment.author, "body": comment.body, "created_at": comment.created_at}


@router.patch("/alerts/{alert_id}/assign")
async def assign_alert(alert_id: str, assignee: str, db: AsyncSession = Depends(get_db)):
    from app.schemas.alerts import SecurityAlertUpdate
    update_in = SecurityAlertUpdate(assigned_to=assignee, status="IN_PROGRESS")
    return await update_security_alert(alert_id, update_in, db)


@router.post("/alerts/{alert_id}/suppress")
async def suppress_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    from app.schemas.alerts import SecurityAlertUpdate
    update_in = SecurityAlertUpdate(status="DISMISSED")
    return await update_security_alert(alert_id, update_in, db)


@router.get("/alerts/search")
async def search_alerts(q: str, db: AsyncSession = Depends(get_db)):
    alerts = await alert_engine_service.list_alerts_with_sla(db=db)
    needle = q.lower()
    return [
        {"type": "alert", "id": item.get("alert_id"), "title": item.get("title"), "url": "/alerts", "severity": item.get("severity")}
        for item in alerts
        if needle in str(item.get("title", "")).lower()
    ][:10]


@router.get("/alerts/sla/policies", response_model=List[SLAPolicyResponse])
async def list_sla_policies(db: AsyncSession = Depends(get_db)):
    """List SLA remediation time policies by severity."""
    now = datetime.utcnow()
    return [SLAPolicyResponse(**p, id=idx + 1, created_at=now) for idx, p in enumerate(DEFAULT_SLA_POLICIES)]
