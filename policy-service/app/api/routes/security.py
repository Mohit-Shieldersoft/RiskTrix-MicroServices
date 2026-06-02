"""
security.py — Security & Risk API routes (Policy Service)

Endpoints:
  GET  /security/summary                    — overview counts
  GET  /security/alerts                     — all security alerts (newest first)
  GET  /security/risky-devices              — devices with risk_score >= 50
  GET  /security/trend                      — alert counts grouped by day (last 7 days)
  GET  /security/issues                     — aggregated security issue counts
  POST /security/evaluate/all               — trigger risk evaluation for all devices
  POST /security/evaluate/{id}              — trigger risk evaluation for one device
  POST /security/profile/{id}               — submit agent-reported security scan
  PATCH /security/alerts/{id}               — update alert status
  GET  /security/device/{id}                — full security profile for one device
  POST /security/remediation/{device_id}    — create remediation action
  GET  /security/remediation/{device_id}    — list remediation actions for a device
  PATCH /security/remediation/action/{id}   — update remediation action status
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.device import Device
from app.models.security import DeviceSecurityProfile, SecurityAlert, RemediationAction
from app.services.risk_engine import evaluate_device_security, evaluate_all_devices
from app.services.asset_client import get_device as fetch_asset_device

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class AgentSecurityReport(BaseModel):
    """Posted by a device agent after a local security scan."""
    is_rooted: bool = False
    encryption_enabled: bool = True
    screen_lock_enabled: bool = True
    os_outdated: bool = False
    blacklisted_app_detected: bool = False


class AlertStatusUpdate(BaseModel):
    status: str                    # resolved | suppressed | open
    acknowledged_by: str = "admin"


class RemediationRequest(BaseModel):
    action_type: str   # manual_fix | policy_push | wipe | lock | note
    performed_by: str = "admin"
    notes: str = ""
    alert_id: int | None = None


class RemediationStatusUpdate(BaseModel):
    status: str        # pending | in_progress | completed | failed
    notes: str = ""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _enrich_with_asset(device_id: int) -> dict:
    """Try to fetch device metadata from Asset Service. Falls back to defaults."""
    data = fetch_asset_device(device_id) or {}
    return {
        "name": data.get("name", f"Device #{device_id}"),
        "owner": data.get("owner", "Unknown"),
        "platform": data.get("platform", "unknown"),
        "device_uid": data.get("device_uid", ""),
        "department": data.get("department", ""),
    }


# ── GET /security/summary ─────────────────────────────────────────────────────

@router.get("/security/summary")
def get_security_summary(db: Session = Depends(get_db)):
    profiles = db.query(DeviceSecurityProfile).all()
    total = len(profiles)
    critical = sum(1 for p in profiles if p.risk_level == "critical")
    high     = sum(1 for p in profiles if p.risk_level == "high")
    medium   = sum(1 for p in profiles if p.risk_level == "medium")
    low      = sum(1 for p in profiles if p.risk_level == "low")
    open_alerts = (
        db.query(SecurityAlert)
        .filter(SecurityAlert.status == "open")
        .count()
    )
    return {
        "total_devices_evaluated": total,
        "critical_risk": critical,
        "high_risk": high,
        "medium_risk": medium,
        "low_risk": low,
        "open_alerts": open_alerts,
    }


# ── GET /security/alerts ──────────────────────────────────────────────────────

@router.get("/security/alerts")
def get_security_alerts(
    db: Session = Depends(get_db),
    severity: str | None = None,
    status: str | None = None,
    alert_type: str | None = None,
    device_id: int | None = None,
):
    q = db.query(SecurityAlert)
    if severity:
        q = q.filter(SecurityAlert.severity == severity)
    if status:
        q = q.filter(SecurityAlert.status == status)
    if alert_type:
        q = q.filter(SecurityAlert.alert_type == alert_type)
    if device_id:
        q = q.filter(SecurityAlert.device_id == device_id)
    alerts = q.order_by(SecurityAlert.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "device_id": a.device_id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "message": a.message,
            "status": a.status,
            "acknowledged_by": a.acknowledged_by,
            "resolved_at": a.resolved_at,
            "created_at": a.created_at,
        }
        for a in alerts
    ]


# ── GET /security/risky-devices ───────────────────────────────────────────────

@router.get("/security/risky-devices")
def get_risky_devices(db: Session = Depends(get_db)):
    profiles = (
        db.query(DeviceSecurityProfile)
        .filter(DeviceSecurityProfile.risk_score >= 50)
        .order_by(DeviceSecurityProfile.risk_score.desc())
        .all()
    )
    result = []
    for p in profiles:
        meta = _enrich_with_asset(p.device_id)

        if p.is_rooted:
            main_issue = "Rooted Device"
        elif p.blacklisted_app_detected:
            main_issue = "Blacklisted App"
        elif not p.encryption_enabled:
            main_issue = "Encryption Disabled"
        elif p.os_outdated:
            main_issue = "OS Outdated"
        elif not p.screen_lock_enabled:
            main_issue = "No Screen Lock"
        else:
            main_issue = "Multiple Issues"

        result.append({
            "profile_id": p.id,
            "device_id": p.device_id,
            "device_uid": meta["device_uid"],
            "name": meta["name"],
            "owner": meta["owner"],
            "department": meta["department"],
            "platform": meta["platform"],
            "risk_score": p.risk_score,
            "risk_level": p.risk_level,
            "main_issue": main_issue,
            "last_evaluated_at": p.last_evaluated_at,
        })
    return result


# ── GET /security/trend ───────────────────────────────────────────────────────

@router.get("/security/trend")
def get_threat_trend(db: Session = Depends(get_db)):
    result = []
    for days_ago in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=days_ago)
        day_start = datetime(day.year, day.month, day.day)
        day_end = day_start + timedelta(days=1)
        count = (
            db.query(SecurityAlert)
            .filter(
                SecurityAlert.created_at >= day_start,
                SecurityAlert.created_at < day_end,
            )
            .count()
        )
        result.append({"date": day.strftime("%a"), "full_date": str(day), "alerts": count})
    return result


# ── GET /security/issues ──────────────────────────────────────────────────────

@router.get("/security/issues")
def get_security_issues(db: Session = Depends(get_db)):
    profiles = db.query(DeviceSecurityProfile).all()
    return {
        "rooted_count": sum(1 for p in profiles if p.is_rooted),
        "unencrypted_count": sum(1 for p in profiles if not p.encryption_enabled),
        "no_screen_lock_count": sum(1 for p in profiles if not p.screen_lock_enabled),
        "os_outdated_count": sum(1 for p in profiles if p.os_outdated),
        "blacklisted_app_count": sum(1 for p in profiles if p.blacklisted_app_detected),
    }


# ── POST /security/evaluate/all ───────────────────────────────────────────────
# MUST be defined before /{device_id} so FastAPI doesn't try to cast "all" as int

@router.post("/security/evaluate/all")
def evaluate_all(db: Session = Depends(get_db)):
    return evaluate_all_devices(db)


# ── POST /security/evaluate/{device_id} ──────────────────────────────────────

@router.post("/security/evaluate/{device_id}")
def evaluate_device(device_id: int, db: Session = Depends(get_db)):
    profile = evaluate_device_security(device_id, db)
    return {
        "device_id": device_id,
        "risk_score": profile.risk_score,
        "risk_level": profile.risk_level,
        "last_evaluated_at": profile.last_evaluated_at,
    }


# ── POST /security/profile/{device_id} ───────────────────────────────────────

@router.post("/security/profile/{device_id}")
def submit_agent_report(device_id: int, report: AgentSecurityReport, db: Session = Depends(get_db)):
    """
    Called by device agents after a local security scan.
    Updates agent-reported flags (rooted, blacklisted apps), then re-evaluates.
    """
    profile = (
        db.query(DeviceSecurityProfile)
        .filter(DeviceSecurityProfile.device_id == device_id)
        .first()
    )
    if not profile:
        profile = DeviceSecurityProfile(device_id=device_id)
        db.add(profile)
        db.flush()

    # Only agent-reported flags are set here; compliance-derived flags
    # are always refreshed by evaluate_device_security below.
    profile.is_rooted = report.is_rooted
    profile.blacklisted_app_detected = report.blacklisted_app_detected
    # Allow agent to override compliance-derived flags too if it has evidence
    profile.encryption_enabled = report.encryption_enabled
    profile.screen_lock_enabled = report.screen_lock_enabled
    profile.os_outdated = report.os_outdated
    db.commit()

    # Full evaluation with updated flags
    profile = evaluate_device_security(device_id, db)
    return {
        "device_id": device_id,
        "risk_score": profile.risk_score,
        "risk_level": profile.risk_level,
        "last_evaluated_at": profile.last_evaluated_at,
        "message": "Security profile updated and risk re-evaluated",
    }


# ── PATCH /security/alerts/{alert_id} ────────────────────────────────────────

@router.patch("/security/alerts/{alert_id}")
def update_alert_status(alert_id: int, body: AlertStatusUpdate, db: Session = Depends(get_db)):
    alert = db.query(SecurityAlert).filter(SecurityAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    valid = {"open", "resolved", "suppressed"}
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"status must be one of {valid}")
    alert.status = body.status
    alert.acknowledged_by = body.acknowledged_by
    if body.status == "resolved":
        alert.resolved_at = datetime.utcnow()
    elif body.status == "open":
        alert.resolved_at = None
    db.commit()
    return {"id": alert_id, "status": alert.status, "acknowledged_by": alert.acknowledged_by, "resolved_at": alert.resolved_at}


# ── GET /security/device/{device_id} ─────────────────────────────────────────

@router.get("/security/device/{device_id}")
def get_device_security(device_id: int, db: Session = Depends(get_db)):
    profile = (
        db.query(DeviceSecurityProfile)
        .filter(DeviceSecurityProfile.device_id == device_id)
        .first()
    )
    alerts = (
        db.query(SecurityAlert)
        .filter(SecurityAlert.device_id == device_id)
        .order_by(SecurityAlert.created_at.desc())
        .all()
    )
    meta = _enrich_with_asset(device_id)
    return {
        "device_id": device_id,
        **meta,
        "profile": {
            "risk_score": profile.risk_score if profile else 0,
            "risk_level": profile.risk_level if profile else "unknown",
            "is_rooted": profile.is_rooted if profile else False,
            "encryption_enabled": profile.encryption_enabled if profile else None,
            "screen_lock_enabled": profile.screen_lock_enabled if profile else None,
            "os_outdated": profile.os_outdated if profile else False,
            "blacklisted_app_detected": profile.blacklisted_app_detected if profile else False,
            "last_evaluated_at": profile.last_evaluated_at if profile else None,
        } if profile else None,
        "alerts": [
            {
                "id": a.id,
                "alert_type": a.alert_type,
                "severity": a.severity,
                "message": a.message,
                "status": a.status,
                "created_at": a.created_at,
            }
            for a in alerts
        ],
    }


# ── POST /security/remediation/{device_id} ───────────────────────────────────

@router.post("/security/remediation/{device_id}")
def create_remediation(device_id: int, body: RemediationRequest, db: Session = Depends(get_db)):
    valid_types = {"manual_fix", "policy_push", "wipe", "lock", "note"}
    if body.action_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"action_type must be one of {valid_types}")

    action = RemediationAction(
        device_id=device_id,
        alert_id=body.alert_id,
        action_type=body.action_type,
        performed_by=body.performed_by,
        notes=body.notes,
        status="pending",
    )
    db.add(action)
    db.commit()
    db.refresh(action)
    return {
        "id": action.id,
        "device_id": action.device_id,
        "alert_id": action.alert_id,
        "action_type": action.action_type,
        "performed_by": action.performed_by,
        "notes": action.notes,
        "status": action.status,
        "created_at": action.created_at,
    }


# ── GET /security/remediation/{device_id} ────────────────────────────────────

@router.get("/security/remediation/{device_id}")
def get_remediation_actions(device_id: int, db: Session = Depends(get_db)):
    actions = (
        db.query(RemediationAction)
        .filter(RemediationAction.device_id == device_id)
        .order_by(RemediationAction.created_at.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "device_id": a.device_id,
            "alert_id": a.alert_id,
            "action_type": a.action_type,
            "performed_by": a.performed_by,
            "notes": a.notes,
            "status": a.status,
            "created_at": a.created_at,
            "completed_at": a.completed_at,
        }
        for a in actions
    ]


# ── PATCH /security/remediation/action/{action_id} ───────────────────────────

@router.patch("/security/remediation/action/{action_id}")
def update_remediation_status(action_id: int, body: RemediationStatusUpdate, db: Session = Depends(get_db)):
    action = db.query(RemediationAction).filter(RemediationAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Remediation action not found")
    valid = {"pending", "in_progress", "completed", "failed"}
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"status must be one of {valid}")
    action.status = body.status
    if body.notes:
        action.notes = body.notes
    if body.status == "completed":
        action.completed_at = datetime.utcnow()
    db.commit()
    return {
        "id": action.id,
        "status": action.status,
        "completed_at": action.completed_at,
    }
