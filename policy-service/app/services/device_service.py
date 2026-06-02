from sqlalchemy.orm import Session
from datetime import datetime
from app.models.device import Device, PolicyDeviceAssignment, ComplianceViolation, AuditLog, DeviceActivity
from app.models.policy import Policy


def get_all_devices(db: Session):
    return db.query(Device).all()


def delete_assignment_by_id(db: Session, assignment_id: int, deleted_by: str = "admin") -> bool:
    """Remove a policy-device assignment by its own ID."""
    from app.services.compliance_engine import log_audit
    assignment = db.query(PolicyDeviceAssignment).filter(
        PolicyDeviceAssignment.id == assignment_id
    ).first()
    if not assignment:
        return False
    policy_id = assignment.policy_id
    device_id = assignment.device_id
    db.delete(assignment)
    db.commit()
    log_audit(
        db, deleted_by, "unassign", "policy", policy_id,
        f"Removed assignment #{assignment_id} (policy {policy_id} from device {device_id})",
    )
    return True


def bulk_assign(db: Session, policy_ids: list, device_ids: list, assigned_by: str = "admin"):
    """Assign multiple policies to multiple devices in one operation."""
    from app.services.compliance_engine import simulate_deployment, log_audit

    results = []
    skipped = 0

    for policy_id in policy_ids:
        policy = db.query(Policy).filter(Policy.id == policy_id).first()
        if not policy:
            continue
        for device_id in device_ids:
            existing = db.query(PolicyDeviceAssignment).filter(
                PolicyDeviceAssignment.policy_id == policy_id,
                PolicyDeviceAssignment.device_id == device_id,
            ).first()
            if existing:
                skipped += 1
                continue
            assignment = PolicyDeviceAssignment(
                policy_id=policy_id,
                device_id=device_id,
                assigned_by=assigned_by,
                deployment_status="pending",
            )
            db.add(assignment)
            db.commit()
            db.refresh(assignment)
            simulate_deployment(db, assignment, policy)
            results.append({
                "policy_id": policy_id,
                "device_id": device_id,
                "deployment_status": assignment.deployment_status,
                "compliance_status": assignment.compliance_status,
                "compliance_score": assignment.compliance_score,
            })

    log_audit(
        db, assigned_by, "bulk_assign", "policy", None,
        f"Bulk assigned {len(policy_ids)} polic(ies) to {len(device_ids)} device(s) — "
        f"{len(results)} created, {skipped} skipped",
    )

    success = sum(1 for r in results if r["deployment_status"] == "success")
    failed = sum(1 for r in results if r["deployment_status"] == "failed")
    return {
        "total_assignments": len(results),
        "skipped": skipped,
        "deployment_success": success,
        "deployment_failed": failed,
        "assignments": results,
    }


def get_device_with_policies(db: Session, device_id: int):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        return None

    assignments = db.query(PolicyDeviceAssignment).filter(
        PolicyDeviceAssignment.device_id == device_id
    ).all()

    policies = []
    for a in assignments:
        policy = db.query(Policy).filter(Policy.id == a.policy_id).first()
        if policy:
            policies.append({
                "id": policy.id,
                "name": policy.name,
                "category": policy.category,
                "platform": policy.platform,
                "status": policy.status,
                "deployment_status": a.deployment_status,
                "deployment_message": a.deployment_message,
                "compliance_status": a.compliance_status,
                "compliance_score": a.compliance_score,
                "assigned_at": a.assigned_at,
                "applied_at": a.applied_at,
                "last_checked_at": a.last_checked_at,
                "assignment_id": a.id,
            })

    return {
        "id": device.id,
        "device_uid": device.device_uid,
        "name": device.name,
        "platform": device.platform,
        "os_version": device.os_version,
        "status": device.status,
        "owner": device.owner,
        "department": device.department,
        "enrollment_status": device.enrollment_status,
        "risk_level": device.risk_level,
        "last_seen": device.last_seen,
        "online": device.online,
        "created_at": device.created_at,
        "assigned_policies": policies,
    }


def get_devices_for_policy(db: Session, policy_id: int):
    devices = db.query(Device).all()
    assignments = db.query(PolicyDeviceAssignment).filter(
        PolicyDeviceAssignment.policy_id == policy_id
    ).all()
    assignment_map = {a.device_id: a for a in assignments}
    result = []
    for device in devices:
        a = assignment_map.get(device.id)
        result.append({
            "id": device.id,
            "name": device.name,
            "platform": device.platform,
            "os_version": device.os_version,
            "status": device.status,
            "owner": device.owner,
            "assigned": device.id in assignment_map,
            "deployment_status": a.deployment_status if a else None,
            "deployment_message": a.deployment_message if a else None,
            "compliance_status": a.compliance_status if a else None,
            "compliance_score": a.compliance_score if a else None,
            "assignment_id": a.id if a else None,
        })
    return result


def assign_policy_to_devices(db: Session, policy_id: int, device_ids: list, assigned_by: str = "admin"):
    from app.services.compliance_engine import simulate_deployment, log_audit
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    results = []
    for device_id in device_ids:
        existing = db.query(PolicyDeviceAssignment).filter(
            PolicyDeviceAssignment.policy_id == policy_id,
            PolicyDeviceAssignment.device_id == device_id,
        ).first()
        if existing:
            existing.deployment_status = "pending"
            existing.deployment_message = ""
            existing.assigned_by = assigned_by
            db.commit()
            db.refresh(existing)
            assignment = existing
        else:
            assignment = PolicyDeviceAssignment(
                policy_id=policy_id,
                device_id=device_id,
                assigned_by=assigned_by,
                deployment_status="pending",
            )
            db.add(assignment)
            db.commit()
            db.refresh(assignment)

        # Simulate deployment immediately
        if policy:
            simulate_deployment(db, assignment, policy)

        results.append(assignment)

    log_audit(db, assigned_by, "assign_policy", "policy", policy_id,
              f"Assigned policy #{policy_id} to {len(device_ids)} device(s)")
    return results


def unassign_policy_from_device(db: Session, policy_id: int, device_id: int, admin: str = "admin"):
    from app.services.compliance_engine import log_audit
    assignment = db.query(PolicyDeviceAssignment).filter(
        PolicyDeviceAssignment.policy_id == policy_id,
        PolicyDeviceAssignment.device_id == device_id,
    ).first()
    if not assignment:
        return False

    # Resolve violations
    db.query(ComplianceViolation).filter(
        ComplianceViolation.policy_assignment_id == assignment.id
    ).update({"resolved": True, "resolved_at": datetime.utcnow()})

    db.delete(assignment)
    db.commit()
    log_audit(db, admin, "remove_policy", "policy", policy_id,
              f"Removed policy #{policy_id} from device #{device_id}")
    return True


def retry_assignment(db: Session, assignment_id: int):
    from app.services.compliance_engine import retry_deployment, log_audit
    assignment = db.query(PolicyDeviceAssignment).filter(
        PolicyDeviceAssignment.id == assignment_id
    ).first()
    if not assignment:
        return None
    policy = db.query(Policy).filter(Policy.id == assignment.policy_id).first()
    if not policy:
        return None
    result = retry_deployment(db, assignment, policy)
    log_audit(db, assignment.assigned_by or "admin", "retry_deployment", "assignment",
              assignment_id, f"Retried deployment for assignment #{assignment_id}")
    return result


def update_deployment_status(db: Session, policy_id: int, device_id: int, status: str):
    assignment = db.query(PolicyDeviceAssignment).filter(
        PolicyDeviceAssignment.policy_id == policy_id,
        PolicyDeviceAssignment.device_id == device_id,
    ).first()
    if not assignment:
        return None
    assignment.deployment_status = status
    db.commit()
    db.refresh(assignment)
    return assignment


def get_assignment_stats(db: Session, policy_id: int):
    assignments = db.query(PolicyDeviceAssignment).filter(
        PolicyDeviceAssignment.policy_id == policy_id
    ).all()
    total = len(assignments)
    success = sum(1 for a in assignments if a.deployment_status == "success")
    failed = sum(1 for a in assignments if a.deployment_status == "failed")
    pending = sum(1 for a in assignments if a.deployment_status == "pending")
    compliant = sum(1 for a in assignments if a.compliance_status == "compliant")
    non_compliant = sum(1 for a in assignments if a.compliance_status == "non_compliant")
    warning = sum(1 for a in assignments if a.compliance_status == "warning")
    return {
        "total_assigned": total,
        "success": success,
        "failed": failed,
        "pending": pending,
        "compliant": compliant,
        "non_compliant": non_compliant,
        "warning": warning,
    }


def get_violations_for_device(db: Session, device_id: int):
    return db.query(ComplianceViolation).filter(
        ComplianceViolation.device_id == device_id,
        ComplianceViolation.resolved == False,
    ).order_by(ComplianceViolation.detected_at.desc()).all()


def get_device_activities(db: Session, device_id: int, limit: int = 20):
    return db.query(DeviceActivity).filter(
        DeviceActivity.device_id == device_id
    ).order_by(DeviceActivity.created_at.desc()).limit(limit).all()


def get_audit_logs(db: Session, limit: int = 50):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()


def get_global_deployment_stats(db: Session):
    assignments = db.query(PolicyDeviceAssignment).all()
    return {
        "total": len(assignments),
        "successful": sum(1 for a in assignments if a.deployment_status == "success"),
        "failed": sum(1 for a in assignments if a.deployment_status == "failed"),
        "pending": sum(1 for a in assignments if a.deployment_status == "pending"),
        "compliant": sum(1 for a in assignments if a.compliance_status == "compliant"),
        "non_compliant": sum(1 for a in assignments if a.compliance_status == "non_compliant"),
        "warning": sum(1 for a in assignments if a.compliance_status == "warning"),
        "unknown": sum(1 for a in assignments if a.compliance_status == "unknown"),
    }