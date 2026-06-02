import random
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.device import PolicyDeviceAssignment, ComplianceViolation, DeviceActivity
from app.models.policy import Policy
from app.models.device import Device


DEPLOYMENT_MESSAGES = {
    "success": [
        "Policy applied successfully",
        "All rules deployed and verified",
        "Policy synced and active",
    ],
    "failed": [
        "Device offline — could not reach agent",
        "Agent version outdated — upgrade required",
        "Permission denied — insufficient privileges",
        "Unsupported OS version",
        "Network timeout during deployment",
    ],
}

VIOLATION_TEMPLATES = [
    {
        "violation_type": "encryption_disabled",
        "severity": "critical",
        "description": "Device storage encryption is not enabled",
        "policy_check": lambda p: p.encryption_required,
    },
    {
        "violation_type": "screen_lock_missing",
        "severity": "high",
        "description": "Screen lock / PIN is not configured on the device",
        "policy_check": lambda p: p.require_screen_lock,
    },
    {
        "violation_type": "password_too_short",
        "severity": "medium",
        "description": "Device password does not meet minimum length requirement",
        "policy_check": lambda p: p.min_password_length > 0,
    },
    {
        "violation_type": "os_not_updated",
        "severity": "high",
        "description": "Device OS version is below the required minimum",
        "policy_check": lambda p: p.os_update_required,
    },
    {
        "violation_type": "bluetooth_enabled",
        "severity": "medium",
        "description": "Bluetooth is enabled but policy requires it disabled",
        "policy_check": lambda p: p.bluetooth_disabled,
    },
    {
        "violation_type": "usb_enabled",
        "severity": "medium",
        "description": "USB access is enabled but policy requires it disabled",
        "policy_check": lambda p: p.usb_disabled,
    },
]


def simulate_deployment(db: Session, assignment: PolicyDeviceAssignment, policy: Policy):
    """
    Simulate deployment: pending → success or failed.
    Called right after assignment creation.
    """
    # 80% success rate
    outcome = "success" if random.random() < 0.80 else "failed"
    messages = DEPLOYMENT_MESSAGES[outcome]
    message = random.choice(messages)

    assignment.deployment_status = outcome
    assignment.deployment_message = message
    assignment.last_checked_at = datetime.utcnow()

    if outcome == "success":
        assignment.applied_at = datetime.utcnow()
        # Run compliance evaluation
        score, violations = evaluate_compliance(policy)
        assignment.compliance_score = score
        assignment.compliance_status = (
            "compliant" if score >= 80
            else "warning" if score >= 50
            else "non_compliant"
        )
        # Write violations
        _write_violations(db, assignment, violations)
    else:
        assignment.compliance_status = "unknown"
        assignment.compliance_score = 0

    db.commit()
    db.refresh(assignment)

    # Log device activity
    _log_activity(db, assignment.device_id, "policy_deployed" if outcome == "success" else "policy_failed",
                  f"Policy #{assignment.policy_id}: {message}")

    # ── Trigger security/risk evaluation ──────────────────
    if outcome == "success":
        try:
            from app.services.risk_engine import evaluate_device_security
            evaluate_device_security(assignment.device_id, db)
        except Exception:
            pass

    return assignment


def retry_deployment(db: Session, assignment: PolicyDeviceAssignment, policy: Policy):
    assignment.deployment_status = "retrying"
    assignment.deployment_message = "Retry in progress..."
    db.commit()

    # Same simulation — slightly higher success rate on retry
    outcome = "success" if random.random() < 0.90 else "failed"
    messages = DEPLOYMENT_MESSAGES[outcome]
    message = random.choice(messages)

    assignment.deployment_status = outcome
    assignment.deployment_message = message
    assignment.last_checked_at = datetime.utcnow()

    if outcome == "success":
        assignment.applied_at = datetime.utcnow()
        score, violations = evaluate_compliance(policy)
        assignment.compliance_score = score
        assignment.compliance_status = (
            "compliant" if score >= 80
            else "warning" if score >= 50
            else "non_compliant"
        )
        _write_violations(db, assignment, violations)
    else:
        assignment.compliance_status = "unknown"

    db.commit()
    db.refresh(assignment)
    _log_activity(db, assignment.device_id, "policy_retried",
                  f"Policy #{assignment.policy_id} retry → {outcome}: {message}")
    return assignment


def evaluate_compliance(policy: Policy):
    """
    Check policy rules. Return (score 0-100, list of triggered violations).
    """
    applicable = [v for v in VIOLATION_TEMPLATES if v["policy_check"](policy)]
    if not applicable:
        return 100, []

    # Randomly some rules fail (simulate device state)
    failed = [v for v in applicable if random.random() < 0.25]
    passed = len(applicable) - len(failed)
    score = round((passed / len(applicable)) * 100) if applicable else 100
    return score, failed


def _write_violations(db: Session, assignment: PolicyDeviceAssignment, violations: list):
    # Clear old unresolved violations for this assignment
    db.query(ComplianceViolation).filter(
        ComplianceViolation.policy_assignment_id == assignment.id,
        ComplianceViolation.resolved == False,
    ).delete()
    db.commit()

    for v in violations:
        violation = ComplianceViolation(
            device_id=assignment.device_id,
            policy_assignment_id=assignment.id,
            violation_type=v["violation_type"],
            severity=v["severity"],
            description=v["description"],
        )
        db.add(violation)
    db.commit()


def _log_activity(db: Session, device_id: int, event_type: str, message: str):
    from app.models.device import DeviceActivity
    activity = DeviceActivity(
        device_id=device_id,
        event_type=event_type,
        message=message,
    )
    db.add(activity)
    db.commit()


def log_audit(db: Session, admin: str, action: str, target_type: str, target_id: int, details: str):
    from app.models.device import AuditLog
    log = AuditLog(
        admin=admin,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
    )
    db.add(log)
    db.commit()