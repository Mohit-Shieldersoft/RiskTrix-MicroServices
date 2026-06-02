from sqlalchemy.orm import Session
from app.models.policy import Policy
from app.models.device import Device, PolicyDeviceAssignment, ComplianceViolation, AuditLog


def get_dashboard_data(db: Session):
    policies = db.query(Policy).all()
    devices = db.query(Device).all()
    assignments = db.query(PolicyDeviceAssignment).all()

    # Policy counts
    total_policies = len(policies)
    active_policies = len([p for p in policies if p.status == "active"])
    draft_policies = len([p for p in policies if p.status == "draft"])

    # Assignment counts
    total_assigned = len(assignments)
    success = len([a for a in assignments if a.deployment_status == "success"])
    failed = len([a for a in assignments if a.deployment_status == "failed"])
    pending = len([a for a in assignments if a.deployment_status == "pending"])

    # By platform
    by_platform = {}
    for d in devices:
        by_platform[d.platform] = by_platform.get(d.platform, 0) + 1

    # By category
    by_category = {}
    for p in policies:
        by_category[p.category] = by_category.get(p.category, 0) + 1

    # Deployment table — each policy with its stats
    deployment_rows = []
    for policy in policies:
        policy_assignments = [a for a in assignments if a.policy_id == policy.id]
        deployment_rows.append({
            "id": policy.id,
            "name": policy.name,
            "platform": policy.platform,
            "status": policy.status,
            "assigned_devices": len(policy_assignments),
            "successful": len([a for a in policy_assignments if a.deployment_status == "success"]),
            "failed": len([a for a in policy_assignments if a.deployment_status == "failed"]),
            "pending": len([a for a in policy_assignments if a.deployment_status == "pending"]),
        })

    return {
        "total_policies": total_policies,
        "active_policies": active_policies,
        "draft_policies": draft_policies,
        "total_devices": len(devices),
        "total_assigned": total_assigned,
        "deployment_status": {
            "success": success,
            "failed": failed,
            "pending": pending,
        },
        "by_platform": by_platform,
        "by_category": by_category,
        "deployment_table": deployment_rows,
    }


def get_widget_data(db: Session):
    """
    Returns structured data for 4 dashboard widgets:
    IT Operations, Security, Compliance, Executive
    """
    policies = db.query(Policy).all()
    devices = db.query(Device).all()
    assignments = db.query(PolicyDeviceAssignment).all()
    violations = db.query(ComplianceViolation).all()
    audit_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()

    total_assignments = len(assignments)
    successful = [a for a in assignments if a.deployment_status == "success"]
    failed = [a for a in assignments if a.deployment_status == "failed"]
    pending = [a for a in assignments if a.deployment_status == "pending"]
    retrying = [a for a in assignments if a.deployment_status == "retrying"]

    compliant = [a for a in assignments if a.compliance_status == "compliant"]
    non_compliant = [a for a in assignments if a.compliance_status == "non_compliant"]
    warning = [a for a in assignments if a.compliance_status == "warning"]

    unresolved_violations = [v for v in violations if not v.resolved]
    critical_violations = [v for v in unresolved_violations if v.severity == "critical"]
    high_violations = [v for v in unresolved_violations if v.severity == "high"]

    # Devices with non-compliant assignments
    risky_device_ids = list({a.device_id for a in non_compliant})
    risky_devices = []
    for d in devices:
        if d.id in risky_device_ids:
            device_violations = len([v for v in unresolved_violations if v.device_id == d.id])
            device_assignments = [a for a in non_compliant if a.device_id == d.id]
            avg_score = (
                sum(a.compliance_score for a in device_assignments) // len(device_assignments)
                if device_assignments else 0
            )
            risky_devices.append({
                "id": d.id,
                "name": d.name,
                "platform": d.platform,
                "owner": d.owner,
                "violations": device_violations,
                "compliance_score": avg_score,
            })
    risky_devices.sort(key=lambda x: x["compliance_score"])

    # Compliance score average
    scored = [a for a in assignments if a.compliance_score > 0]
    avg_compliance_score = (
        sum(a.compliance_score for a in scored) // len(scored) if scored else 0
    )

    # Overall health score (weighted)
    compliance_rate = (len(compliant) / total_assignments * 100) if total_assignments else 0
    deployment_rate = (len(successful) / total_assignments * 100) if total_assignments else 0
    health_score = round((compliance_rate * 0.6 + deployment_rate * 0.4), 1)

    # Pending actions = failed + pending deployments + critical violations
    pending_actions = len(failed) + len(pending) + len(critical_violations)

    # Recently failed deployments
    recently_failed = []
    for a in failed[-5:]:
        device = next((d for d in devices if d.id == a.device_id), None)
        policy = next((p for p in policies if p.id == a.policy_id), None)
        recently_failed.append({
            "device_name": device.name if device else f"Device #{a.device_id}",
            "policy_name": policy.name if policy else f"Policy #{a.policy_id}",
            "message": a.deployment_message or "Unknown error",
            "device_id": a.device_id,
            "policy_id": a.policy_id,
        })

    # Policy coverage: devices with at least one assigned policy
    assigned_device_ids = {a.device_id for a in assignments}
    policy_coverage_pct = (
        round(len(assigned_device_ids) / len(devices) * 100) if devices else 0
    )

    # Recent audit logs
    recent_audit = [
        {
            "id": log.id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "user_id": log.user_id,
            "created_at": log.created_at,
        }
        for log in audit_logs
    ]

    return {
        # ── IT Operations ──────────────────────────────────
        "it_ops": {
            "total_assignments": total_assignments,
            "deployment_success": len(successful),
            "deployment_failed": len(failed),
            "deployment_pending": len(pending),
            "deployment_retrying": len(retrying),
            "success_rate": round(deployment_rate, 1),
            "recently_failed": recently_failed,
            "recent_audit": recent_audit,
        },
        # ── Security ───────────────────────────────────────
        "security": {
            "total_violations": len(unresolved_violations),
            "critical_violations": len(critical_violations),
            "high_violations": len(high_violations),
            "high_risk_devices": len(risky_device_ids),
            "risky_devices": risky_devices[:5],
            "violation_breakdown": {
                "critical": len(critical_violations),
                "high": len(high_violations),
                "medium": len([v for v in unresolved_violations if v.severity == "medium"]),
                "low": len([v for v in unresolved_violations if v.severity == "low"]),
            },
        },
        # ── Compliance ─────────────────────────────────────
        "compliance": {
            "compliant": len(compliant),
            "non_compliant": len(non_compliant),
            "warning": len(warning),
            "compliance_rate": round(compliance_rate, 1),
            "avg_compliance_score": avg_compliance_score,
            "total_evaluated": len(compliant) + len(non_compliant) + len(warning),
        },
        # ── Executive ──────────────────────────────────────
        "executive": {
            "health_score": health_score,
            "policy_coverage_pct": policy_coverage_pct,
            "total_policies": len(policies),
            "active_policies": len([p for p in policies if p.status == "active"]),
            "total_devices": len(devices),
            "devices_covered": len(assigned_device_ids),
            "pending_actions": pending_actions,
            "high_risk_devices": len(risky_device_ids),
        },
    }
