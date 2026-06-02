from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.device import PolicyDeviceAssignment, ComplianceViolation, Device, AuditLog
from app.models.policy import Policy

# ── Thresholds (can be made configurable later) ───────────
COMPLIANCE_RATE_THRESHOLD = 70     # % — alert if overall compliance < this
DEVICE_COMPLIANCE_THRESHOLD = 60   # % — alert if a single device score < this
VIOLATION_CRITICAL_LIMIT = 0       # alert if any critical violations exist
FAILED_DEPLOYMENT_LIMIT = 5        # alert if more than this many failed deployments


def get_alerts(db: Session) -> dict:
    """
    Evaluate current system state and return actionable alerts.
    Each alert has: id, severity (critical|warning|info), category,
    title, message, count, action_url
    """
    alerts = []

    # ── 1. Critical compliance violations ─────────────────
    critical_violations = db.query(ComplianceViolation).filter(
        ComplianceViolation.severity == "critical",
        ComplianceViolation.resolved == False,
    ).count()

    if critical_violations > VIOLATION_CRITICAL_LIMIT:
        alerts.append({
            "id": "critical-violations",
            "severity": "critical",
            "category": "compliance",
            "title": "Critical Violations Detected",
            "message": f"{critical_violations} unresolved critical compliance violation{'s' if critical_violations != 1 else ''} require immediate attention.",
            "count": critical_violations,
            "action_url": "/devices",
        })

    # ── 2. Overall compliance rate ─────────────────────────
    assignments = db.query(PolicyDeviceAssignment).all()
    if assignments:
        compliant = sum(1 for a in assignments if a.compliance_status == "compliant")
        compliance_rate = round(compliant / len(assignments) * 100)
        if compliance_rate < COMPLIANCE_RATE_THRESHOLD:
            alerts.append({
                "id": "low-compliance-rate",
                "severity": "warning",
                "category": "compliance",
                "title": "Compliance Rate Below Threshold",
                "message": f"Overall compliance rate is {compliance_rate}%, below the {COMPLIANCE_RATE_THRESHOLD}% target. {len(assignments) - compliant} assignments are non-compliant.",
                "count": len(assignments) - compliant,
                "action_url": "/policies/assignments",
            })

    # ── 3. Failed deployments ──────────────────────────────
    failed_deployments = sum(1 for a in assignments if a.deployment_status == "failed")
    if failed_deployments > FAILED_DEPLOYMENT_LIMIT:
        alerts.append({
            "id": "failed-deployments",
            "severity": "warning",
            "category": "deployment",
            "title": "High Deployment Failure Count",
            "message": f"{failed_deployments} policy deployments have failed. Review and retry failed assignments.",
            "count": failed_deployments,
            "action_url": "/policies/assignments",
        })

    # ── 4. Devices with very low compliance score ──────────
    low_score_count = sum(
        1 for a in assignments
        if (a.compliance_score or 0) < DEVICE_COMPLIANCE_THRESHOLD
        and a.compliance_status != "unknown"
    )
    if low_score_count > 0:
        alerts.append({
            "id": "low-device-scores",
            "severity": "warning",
            "category": "compliance",
            "title": "Devices With Low Compliance Score",
            "message": f"{low_score_count} device assignment{'s' if low_score_count != 1 else ''} {'have' if low_score_count != 1 else 'has'} a compliance score below {DEVICE_COMPLIANCE_THRESHOLD}%.",
            "count": low_score_count,
            "action_url": "/devices",
        })

    # ── 5. Pending deployments (stale) ────────────────────
    pending_count = sum(1 for a in assignments if a.deployment_status == "pending")
    if pending_count > 0:
        alerts.append({
            "id": "pending-deployments",
            "severity": "info",
            "category": "deployment",
            "title": "Pending Deployments",
            "message": f"{pending_count} policy deployment{'s are' if pending_count != 1 else ' is'} still pending and have not been applied yet.",
            "count": pending_count,
            "action_url": "/policies/assignments",
        })

    # ── 6. Devices with no policy assigned ────────────────
    all_device_ids = {d.id for d in db.query(Device).filter(Device.status == "active").all()}
    assigned_device_ids = {a.device_id for a in assignments}
    uncovered = len(all_device_ids - assigned_device_ids)
    if uncovered > 0:
        alerts.append({
            "id": "unprotected-devices",
            "severity": "info",
            "category": "coverage",
            "title": "Devices Without Policy Coverage",
            "message": f"{uncovered} active device{'s have' if uncovered != 1 else ' has'} no policy assigned.",
            "count": uncovered,
            "action_url": "/policies/bulk-assign",
        })

    # Sort: critical first, then warning, then info
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    alerts.sort(key=lambda a: severity_order.get(a["severity"], 3))

    return {
        "total_alerts": len(alerts),
        "critical": sum(1 for a in alerts if a["severity"] == "critical"),
        "warnings": sum(1 for a in alerts if a["severity"] == "warning"),
        "info": sum(1 for a in alerts if a["severity"] == "info"),
        "alerts": alerts,
    }
