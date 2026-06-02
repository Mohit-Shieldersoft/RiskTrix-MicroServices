"""
risk_engine.py

Core security evaluation engine for Policy Service.

Responsibilities:
  1. Derive security flags from ComplianceViolation records
  2. Honour agent-reported flags (is_rooted, blacklisted_app_detected)
  3. Calculate risk score + risk level
  4. Persist DeviceSecurityProfile
  5. Generate SecurityAlert records for each active threat
"""
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.device import ComplianceViolation, Device
from app.models.security import DeviceSecurityProfile, SecurityAlert

# ── Violation → flag mapping ──────────────────────────────────────────────────
# Maps compliance_scan_service CHECK_CATALOG keys to DeviceSecurityProfile fields.
# "fail" on a check sets the security flag as shown below.
_VIOLATION_FLAGS = {
    "encryption":   ("encryption_enabled",   False),  # fail → encryption off
    "screen_lock":  ("screen_lock_enabled",  False),  # fail → screen lock off
    "os_update":    ("os_outdated",          True),   # fail → OS is outdated
}

# Alert templates keyed by flag state
_ALERT_TEMPLATES = {
    "is_rooted": {
        "type": "rooted_device",
        "severity": "critical",
        "message": "Rooted/Jailbroken device detected — device integrity compromised",
    },
    "encryption_disabled": {
        "type": "encryption_disabled",
        "severity": "critical",
        "message": "Storage encryption is disabled — data at risk",
    },
    "screen_lock_disabled": {
        "type": "no_screen_lock",
        "severity": "high",
        "message": "Screen lock / PIN is not enabled on this device",
    },
    "os_outdated": {
        "type": "os_outdated",
        "severity": "high",
        "message": "Operating system is outdated and may have known vulnerabilities",
    },
    "blacklisted_app": {
        "type": "blacklisted_app",
        "severity": "critical",
        "message": "A blacklisted or malicious application has been detected",
    },
}


# ── Risk score calculation ────────────────────────────────────────────────────

def calculate_risk(profile: DeviceSecurityProfile) -> tuple[int, str]:
    """Return (score 0-120, level) based on security flags."""
    score = 0
    if profile.is_rooted:
        score += 40
    if not profile.encryption_enabled:
        score += 25
    if not profile.screen_lock_enabled:
        score += 20
    if profile.os_outdated:
        score += 15
    if profile.blacklisted_app_detected:
        score += 20

    if score >= 81:
        level = "critical"
    elif score >= 51:
        level = "high"
    elif score >= 21:
        level = "medium"
    else:
        level = "low"

    return score, level


# ── Core evaluation ───────────────────────────────────────────────────────────

def evaluate_device_security(device_id: int, db: Session) -> DeviceSecurityProfile:
    """
    Full security evaluation pipeline for one device:
      - Derive flags from unresolved ComplianceViolations
      - Preserve agent-reported flags (is_rooted, blacklisted_app_detected)
      - Calculate risk score / level
      - Upsert DeviceSecurityProfile
      - Generate SecurityAlerts
    Returns the updated DeviceSecurityProfile.
    """
    # ── 1. Get or create the security profile ─────────────
    profile = (
        db.query(DeviceSecurityProfile)
        .filter(DeviceSecurityProfile.device_id == device_id)
        .first()
    )
    if not profile:
        profile = DeviceSecurityProfile(device_id=device_id)
        db.add(profile)
        db.flush()

    # ── 2. Derive flags from active compliance violations ──
    active_violations = (
        db.query(ComplianceViolation)
        .filter(
            ComplianceViolation.device_id == device_id,
            ComplianceViolation.resolved == False,
        )
        .all()
    )
    violation_types = {v.violation_type for v in active_violations}

    # Reset compliance-derived flags (not agent-reported ones)
    profile.encryption_enabled = True
    profile.screen_lock_enabled = True
    profile.os_outdated = False

    for vtype, (field, value) in _VIOLATION_FLAGS.items():
        if vtype in violation_types:
            setattr(profile, field, value)

    # ── 3. Recalculate risk ────────────────────────────────
    score, level = calculate_risk(profile)
    profile.risk_score = score
    profile.risk_level = level
    profile.last_evaluated_at = datetime.utcnow()

    db.commit()
    db.refresh(profile)

    # ── 4. Generate alerts ─────────────────────────────────
    _generate_alerts(device_id, profile, db)

    # ── 5. Run automated actions ───────────────────────────
    try:
        from app.services.automation_engine import run_automated_actions
        run_automated_actions(profile, db)
    except Exception:
        pass  # never let automation failure break risk evaluation
    # ── 6. Run user-defined automation rules ────────────────────────
    try:
        from app.services.automation_executor import run_rules_for_trigger
        run_rules_for_trigger(
            trigger_type="risk_evaluated",
            context={
                "device_id": device_id,
                "risk_score": profile.risk_score,
                "risk_level": profile.risk_level,
                "is_rooted": profile.is_rooted,
                "encryption_enabled": profile.encryption_enabled,
                "screen_lock_enabled": profile.screen_lock_enabled,
                "os_outdated": profile.os_outdated,
                "blacklisted_app_detected": profile.blacklisted_app_detected,
            },
            db=db,
        )
    except Exception:
        pass
    return profile


def _generate_alerts(device_id: int, profile: DeviceSecurityProfile, db: Session):
    """Create SecurityAlert rows for each active threat. Avoids duplicates."""
    # Collect which alert types should be active right now
    active_types: list[dict] = []

    if profile.is_rooted:
        active_types.append(_ALERT_TEMPLATES["is_rooted"])
    if not profile.encryption_enabled:
        active_types.append(_ALERT_TEMPLATES["encryption_disabled"])
    if not profile.screen_lock_enabled:
        active_types.append(_ALERT_TEMPLATES["screen_lock_disabled"])
    if profile.os_outdated:
        active_types.append(_ALERT_TEMPLATES["os_outdated"])
    if profile.blacklisted_app_detected:
        active_types.append(_ALERT_TEMPLATES["blacklisted_app"])

    active_type_keys = {t["type"] for t in active_types}

    # Auto-resolve alerts whose condition is now cleared
    open_alerts = (
        db.query(SecurityAlert)
        .filter(SecurityAlert.device_id == device_id, SecurityAlert.status == "open")
        .all()
    )
    for alert in open_alerts:
        if alert.alert_type not in active_type_keys:
            alert.status = "resolved"

    # Create new alerts for any type not already open
    existing_open_types = {a.alert_type for a in open_alerts if a.status == "open"}
    for tmpl in active_types:
        if tmpl["type"] not in existing_open_types:
            db.add(SecurityAlert(
                device_id=device_id,
                alert_type=tmpl["type"],
                severity=tmpl["severity"],
                message=tmpl["message"],
            ))

    db.commit()


# ── Convenience: evaluate all devices ────────────────────────────────────────

def evaluate_all_devices(db: Session) -> dict:
    """Run security evaluation for every device that has a policy assignment."""
    from app.models.device import PolicyDeviceAssignment

    device_ids = {
        row.device_id
        for row in db.query(PolicyDeviceAssignment.device_id).distinct()
    }

    evaluated = 0
    errors = []
    for device_id in device_ids:
        try:
            evaluate_device_security(device_id, db)
            evaluated += 1
        except Exception as e:
            errors.append({"device_id": device_id, "error": str(e)})

    return {"evaluated": evaluated, "total": len(device_ids), "errors": errors}
