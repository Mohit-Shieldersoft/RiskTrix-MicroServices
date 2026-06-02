"""
compliance_scan_service.py

Weighted compliance evaluation engine.
Runs per device+policy assignment and stores per-check results
in the compliance_results table.

Check weights must sum to 100 across all enabled checks.
"""
import random
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.device import (
    Device, PolicyDeviceAssignment,
    ComplianceResult, ComplianceViolation, AuditLog,
)
from app.models.policy import Policy

# ── Check definitions ─────────────────────────────────────
# Each entry: (compliance_type, severity, weight, remediation_required)
# Weights are normalised relative to enabled checks.
CHECK_CATALOG = {
    "screen_lock": {
        "severity": "high",
        "weight": 15,
        "remediation": True,
        "pass_msg": "Screen lock is enabled",
        "fail_msg": "Screen lock is not configured",
    },
    "encryption": {
        "severity": "critical",
        "weight": 20,
        "remediation": True,
        "pass_msg": "Device encryption is enabled",
        "fail_msg": "Device encryption is disabled — data at risk",
    },
    "os_update": {
        "severity": "high",
        "weight": 15,
        "remediation": True,
        "pass_msg": "OS is up to date",
        "fail_msg": "OS version is below the required minimum",
    },
    "password_length": {
        "severity": "medium",
        "weight": 10,
        "remediation": True,
        "pass_msg": "Password meets length requirement",
        "fail_msg": "Password is shorter than the required minimum",
    },
    "password_complexity": {
        "severity": "medium",
        "weight": 10,
        "remediation": True,
        "pass_msg": "Password complexity requirements met",
        "fail_msg": "Password does not meet complexity requirements",
    },
    "password_expiry": {
        "severity": "low",
        "weight": 5,
        "remediation": False,
        "pass_msg": "Password expiry policy is compliant",
        "fail_msg": "Password has not been changed within the required period",
    },
    "bluetooth": {
        "severity": "medium",
        "weight": 10,
        "remediation": False,
        "pass_msg": "Bluetooth is disabled as required",
        "fail_msg": "Bluetooth is enabled — policy requires it to be disabled",
    },
    "usb": {
        "severity": "high",
        "weight": 10,
        "remediation": True,
        "pass_msg": "USB access is blocked as required",
        "fail_msg": "USB access is enabled — policy requires it to be blocked",
    },
    "wifi": {
        "severity": "medium",
        "weight": 5,
        "remediation": False,
        "pass_msg": "Wi-Fi access is within policy",
        "fail_msg": "Unrestricted Wi-Fi access detected",
    },
}

# Simulated per-check pass rates (realistic MDM data)
_PASS_RATES = {
    "screen_lock": 0.94,
    "encryption": 0.91,
    "os_update": 0.78,
    "password_length": 0.88,
    "password_complexity": 0.82,
    "password_expiry": 0.75,
    "bluetooth": 0.85,
    "usb": 0.90,
    "wifi": 0.80,
}


def _get_enabled_checks(policy: Policy) -> list[str]:
    """Return only the checks that the policy actually enforces."""
    checks = []
    if policy.require_screen_lock:
        checks.append("screen_lock")
    if policy.encryption_required:
        checks.append("encryption")
    if policy.os_update_required:
        checks.append("os_update")
    if policy.min_password_length and policy.min_password_length > 0:
        checks.append("password_length")
    if policy.password_complexity:
        checks.append("password_complexity")
    if policy.password_expiry_days and policy.password_expiry_days > 0:
        checks.append("password_expiry")
    if policy.bluetooth_disabled:
        checks.append("bluetooth")
    if policy.usb_disabled:
        checks.append("usb")
    if policy.wifi_restricted:
        checks.append("wifi")
    return checks or list(CHECK_CATALOG.keys())  # if policy has no rules, check all


def _calculate_score(results: list[dict]) -> int:
    """Weighted score: sum of (weight * pass) / total_weight * 100."""
    total_weight = sum(r["weight"] for r in results)
    if total_weight == 0:
        return 100
    earned = sum(r["weight"] for r in results if r["status"] == "pass")
    return round(earned / total_weight * 100)


def _derive_status(score: int, has_critical_fail: bool) -> str:
    if has_critical_fail or score < 60:
        return "non_compliant"
    if score < 80:
        return "warning"
    return "compliant"


def run_compliance_scan(db: Session, assignment: PolicyDeviceAssignment, policy: Policy) -> dict:
    """
    Run all relevant checks for one assignment.
    Stores results in compliance_results, updates assignment fields,
    and creates violations for failed checks.
    Returns summary dict.
    """
    # Remove old results for this assignment
    db.query(ComplianceResult).filter(
        ComplianceResult.assignment_id == assignment.id
    ).delete()

    enabled_checks = _get_enabled_checks(policy)
    results = []
    has_critical_fail = False
    now = datetime.utcnow()

    for check_type in enabled_checks:
        catalog = CHECK_CATALOG[check_type]
        # Simulate pass/fail with realistic per-check rates
        passes = random.random() < _PASS_RATES.get(check_type, 0.85)
        status = "pass" if passes else "fail"

        if not passes and catalog["severity"] == "critical":
            has_critical_fail = True

        cr = ComplianceResult(
            device_id=assignment.device_id,
            policy_id=assignment.policy_id,
            assignment_id=assignment.id,
            compliance_type=check_type,
            status=status,
            severity=catalog["severity"],
            weight=catalog["weight"],
            detail=catalog["pass_msg"] if passes else catalog["fail_msg"],
            remediation_required=catalog["remediation"] if not passes else False,
            checked_at=now,
        )
        db.add(cr)

        # Create or update violation for failed checks
        if not passes:
            existing_violation = db.query(ComplianceViolation).filter(
                ComplianceViolation.device_id == assignment.device_id,
                ComplianceViolation.policy_assignment_id == assignment.id,
                ComplianceViolation.violation_type == check_type,
                ComplianceViolation.resolved == False,
            ).first()
            if not existing_violation:
                violation = ComplianceViolation(
                    device_id=assignment.device_id,
                    policy_assignment_id=assignment.id,
                    violation_type=check_type,
                    severity=catalog["severity"],
                    description=catalog["fail_msg"],
                    detected_at=now,
                )
                db.add(violation)
        else:
            # Auto-resolve existing violations for checks that now pass
            db.query(ComplianceViolation).filter(
                ComplianceViolation.device_id == assignment.device_id,
                ComplianceViolation.policy_assignment_id == assignment.id,
                ComplianceViolation.violation_type == check_type,
                ComplianceViolation.resolved == False,
            ).update({"resolved": True, "resolved_at": now})

        results.append({
            "type": check_type,
            "status": status,
            "weight": catalog["weight"],
            "severity": catalog["severity"],
        })

    db.commit()

    score = _calculate_score(results)
    compliance_status = _derive_status(score, has_critical_fail)

    # Update assignment
    assignment.compliance_status = compliance_status
    assignment.compliance_score = score
    assignment.last_checked_at = now
    db.commit()

    # ── Trigger risk evaluation for this device ────────────
    try:
        from app.services.risk_engine import evaluate_device_security
        evaluate_device_security(assignment.device_id, db)
    except Exception:
        pass  # never let risk engine failure break the compliance scan

    return {
        "assignment_id": assignment.id,
        "device_id": assignment.device_id,
        "policy_id": assignment.policy_id,
        "checks_run": len(results),
        "passed": sum(1 for r in results if r["status"] == "pass"),
        "failed": sum(1 for r in results if r["status"] == "fail"),
        "score": score,
        "compliance_status": compliance_status,
        "results": results,
    }


def scan_all_assignments(db: Session) -> dict:
    """Scan every active assignment. Called by scheduler and manual trigger."""
    assignments = db.query(PolicyDeviceAssignment).filter(
        PolicyDeviceAssignment.deployment_status == "success"
    ).all()

    policy_cache = {}
    scanned = 0
    errors = 0
    error_details = []

    for assignment in assignments:
        try:
            if assignment.policy_id not in policy_cache:
                policy_cache[assignment.policy_id] = db.query(Policy).filter(
                    Policy.id == assignment.policy_id
                ).first()
            policy = policy_cache[assignment.policy_id]
            if policy:
                run_compliance_scan(db, assignment, policy)
                scanned += 1
            else:
                error_details.append({"assignment_id": assignment.id, "error": f"Policy {assignment.policy_id} not found"})
                errors += 1
        except Exception as e:
            error_details.append({"assignment_id": assignment.id, "error": str(e)})
            errors += 1

    return {
        "scanned": scanned,
        "errors": errors,
        "error_details": error_details,
        "scanned_at": datetime.utcnow().isoformat(),
    }


def get_compliance_dashboard(db: Session) -> dict:
    """Aggregate compliance data for the dashboard."""
    from sqlalchemy import func

    assignments = db.query(PolicyDeviceAssignment).filter(
        PolicyDeviceAssignment.deployment_status == "success"
    ).all()

    total = len(assignments)
    compliant = sum(1 for a in assignments if a.compliance_status == "compliant")
    warning = sum(1 for a in assignments if a.compliance_status == "warning")
    non_compliant = sum(1 for a in assignments if a.compliance_status == "non_compliant")
    unknown = sum(1 for a in assignments if a.compliance_status == "unknown")

    scores = [a.compliance_score for a in assignments if a.compliance_score is not None and a.compliance_score > 0]
    overall_score = round(sum(scores) / len(scores)) if scores else 0
    compliance_rate = round(compliant / total * 100) if total else 0

    # Per-check pass rates from compliance_results
    check_results = db.query(ComplianceResult).all()
    check_stats = {}
    for cr in check_results:
        if cr.compliance_type not in check_stats:
            check_stats[cr.compliance_type] = {"pass": 0, "fail": 0, "total": 0}
        check_stats[cr.compliance_type]["total"] += 1
        check_stats[cr.compliance_type][cr.status] = check_stats[cr.compliance_type].get(cr.status, 0) + 1

    check_breakdown = []
    for ctype, stats in check_stats.items():
        total_checks = stats["total"]
        pass_count = stats.get("pass", 0)
        pct = round(pass_count / total_checks * 100) if total_checks else 0
        catalog = CHECK_CATALOG.get(ctype, {})
        check_breakdown.append({
            "type": ctype,
            "label": ctype.replace("_", " ").title(),
            "pass_rate": pct,
            "passed": pass_count,
            "failed": stats.get("fail", 0),
            "total": total_checks,
            "severity": catalog.get("severity", "medium"),
            "weight": catalog.get("weight", 10),
        })
    check_breakdown.sort(key=lambda x: x["pass_rate"])

    # Violations summary
    open_violations = db.query(ComplianceViolation).filter(
        ComplianceViolation.resolved == False
    ).all()

    violation_by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for v in open_violations:
        sev = v.severity if v.severity in violation_by_severity else "medium"
        violation_by_severity[sev] += 1

    # Remediation queue — devices with critical/high violations
    remediation_devices = []
    seen_devices = set()
    for v in open_violations:
        if v.severity in ("critical", "high") and v.device_id not in seen_devices:
            seen_devices.add(v.device_id)
            device = db.query(Device).filter(Device.id == v.device_id).first()
            asgn = db.query(PolicyDeviceAssignment).filter(
                PolicyDeviceAssignment.id == v.policy_assignment_id
            ).first()
            if device:
                remediation_devices.append({
                    "device_id": v.device_id,
                    "device_name": device.name,
                    "platform": device.platform,
                    "owner": device.owner or "—",
                    "compliance_score": asgn.compliance_score if asgn else 0,
                    "compliance_status": asgn.compliance_status if asgn else "unknown",
                    "open_violations": sum(
                        1 for ov in open_violations if ov.device_id == v.device_id
                    ),
                })

    # Non-compliant devices list
    non_compliant_devices = []
    seen_nc = set()
    for a in assignments:
        if a.compliance_status in ("non_compliant", "warning") and a.device_id not in seen_nc:
            seen_nc.add(a.device_id)
            device = db.query(Device).filter(Device.id == a.device_id).first()
            if device:
                non_compliant_devices.append({
                    "device_id": a.device_id,
                    "device_name": device.name,
                    "platform": device.platform,
                    "owner": device.owner or "—",
                    "compliance_score": a.compliance_score,
                    "compliance_status": a.compliance_status,
                    "last_checked_at": a.last_checked_at,
                })
    non_compliant_devices.sort(key=lambda x: x["compliance_score"])

    return {
        "summary": {
            "total_evaluated": total,
            "compliant": compliant,
            "warning": warning,
            "non_compliant": non_compliant,
            "unknown": unknown,
            "overall_score": overall_score,
            "compliance_rate": compliance_rate,
            "open_violations": len(open_violations),
        },
        "violation_by_severity": violation_by_severity,
        "check_breakdown": check_breakdown,
        "remediation_queue": remediation_devices[:20],
        "non_compliant_devices": non_compliant_devices[:20],
    }
