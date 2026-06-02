from sqlalchemy.orm import Session
from app.models.policy import Policy


def get_policies(db: Session):
    return db.query(Policy).all()


def get_policy_by_id(db: Session, policy_id: int):
    return db.query(Policy).filter(Policy.id == policy_id).first()


def create_policy(db: Session, policy_data):
    policy = Policy(**policy_data.dict())
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


def update_policy(db: Session, policy_id: int, policy_data):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        return None
    for key, value in policy_data.dict(exclude_unset=True).items():
        setattr(policy, key, value)
    db.commit()
    db.refresh(policy)
    return policy


def delete_policy(db: Session, policy_id: int):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        return False
    db.delete(policy)
    db.commit()
    return True


def get_policy_details(db: Session, policy_id: int):
    """Full policy detail: settings + assignment stats + assigned devices."""
    from app.models.device import Device, PolicyDeviceAssignment
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        return None

    assignments = db.query(PolicyDeviceAssignment).filter(
        PolicyDeviceAssignment.policy_id == policy_id
    ).all()

    total = len(assignments)
    success_count = sum(1 for a in assignments if a.deployment_status == "success")
    failed_count = sum(1 for a in assignments if a.deployment_status == "failed")
    pending_count = sum(1 for a in assignments if a.deployment_status == "pending")
    compliant_count = sum(1 for a in assignments if a.compliance_status == "compliant")
    non_compliant_count = sum(1 for a in assignments if a.compliance_status == "non_compliant")
    avg_score = (
        round(sum(a.compliance_score or 0 for a in assignments) / total)
        if total else 0
    )
    deployment_rate = round(success_count / total * 100) if total else 0
    compliance_rate = round(compliant_count / total * 100) if total else 0

    device_ids = [a.device_id for a in assignments]
    devices = db.query(Device).filter(Device.id.in_(device_ids)).all() if device_ids else []
    device_map = {d.id: d for d in devices}

    assigned_devices = []
    for a in assignments:
        d = device_map.get(a.device_id)
        assigned_devices.append({
            "device_id": a.device_id,
            "device_name": d.name if d else "Unknown",
            "platform": d.platform if d else "",
            "owner": d.owner if d else "",
            "assignment_id": a.id,
            "deployment_status": a.deployment_status,
            "deployment_message": a.deployment_message,
            "compliance_status": a.compliance_status,
            "compliance_score": a.compliance_score,
            "assigned_at": a.assigned_at,
            "applied_at": a.applied_at,
        })

    return {
        "id": policy.id,
        "name": policy.name,
        "description": policy.description,
        "category": policy.category,
        "platform": policy.platform,
        "status": policy.status,
        "created_at": policy.created_at,
        # Settings
        "settings": {
            "require_screen_lock": policy.require_screen_lock,
            "min_password_length": policy.min_password_length,
            "password_complexity": policy.password_complexity,
            "password_expiry_days": policy.password_expiry_days,
            "bluetooth_disabled": policy.bluetooth_disabled,
            "usb_disabled": policy.usb_disabled,
            "wifi_restricted": policy.wifi_restricted,
            "os_update_required": policy.os_update_required,
            "min_os_version": policy.min_os_version,
            "encryption_required": policy.encryption_required,
        },
        # Stats
        "stats": {
            "total_assignments": total,
            "deployment_success": success_count,
            "deployment_failed": failed_count,
            "deployment_pending": pending_count,
            "deployment_rate": deployment_rate,
            "compliant": compliant_count,
            "non_compliant": non_compliant_count,
            "compliance_rate": compliance_rate,
            "avg_compliance_score": avg_score,
        },
        "assigned_devices": assigned_devices,
    }


def get_policy_stats(db: Session):
    policies = db.query(Policy).all()
    total = len(policies)
    active = len([p for p in policies if p.status == "active"])
    draft = len([p for p in policies if p.status == "draft"])
    by_platform = {}
    for p in policies:
        by_platform[p.platform] = by_platform.get(p.platform, 0) + 1
    by_category = {}
    for p in policies:
        by_category[p.category] = by_category.get(p.category, 0) + 1
    return {
        "total": total,
        "active": active,
        "draft": draft,
        "by_platform": by_platform,
        "by_category": by_category,
    }