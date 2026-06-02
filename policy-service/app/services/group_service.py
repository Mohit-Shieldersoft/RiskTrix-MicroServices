import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.device import (
    Device, DeviceGroup, DeviceGroupMember,
    GroupPolicyAssignment, PolicyDeviceAssignment,
)
from app.models.policy import Policy


# ── SMART GROUP RULE ENGINE ────────────────────────────────────────────────────
SMART_RULE_OPERATORS = {
    "eq": lambda a, b: str(a).lower() == str(b).lower(),
    "neq": lambda a, b: str(a).lower() != str(b).lower(),
    "contains": lambda a, b: str(b).lower() in str(a).lower(),
    "gt": lambda a, b: float(a or 0) > float(b),
    "lt": lambda a, b: float(a or 0) < float(b),
}

SMART_RULE_FIELDS = {
    "platform": lambda d: d.platform,
    "os_version": lambda d: d.os_version,
    "status": lambda d: d.status,
    "owner": lambda d: d.owner,
}


def _device_matches_rule(device: Device, rule: dict) -> bool:
    field = rule.get("field")
    op = rule.get("op", "eq")
    value = rule.get("value", "")
    getter = SMART_RULE_FIELDS.get(field)
    if not getter:
        return False
    operator = SMART_RULE_OPERATORS.get(op)
    if not operator:
        return False
    try:
        return operator(getter(device), value)
    except Exception:
        return False


def resolve_smart_group_members(db: Session, group: DeviceGroup) -> list[Device]:
    """Return all devices that match the group's smart rule."""
    if not group.smart_rule:
        return []
    try:
        rule = json.loads(group.smart_rule)
    except (json.JSONDecodeError, ValueError):
        return []
    all_devices = db.query(Device).all()
    return [d for d in all_devices if _device_matches_rule(d, rule)]


# ── GROUP CRUD ─────────────────────────────────────────────────────────────────
def get_all_groups(db: Session):
    groups = db.query(DeviceGroup).order_by(DeviceGroup.created_at.desc()).all()
    result = []
    for g in groups:
        member_count = db.query(DeviceGroupMember).filter(
            DeviceGroupMember.group_id == g.id
        ).count()
        if g.group_type == "smart":
            smart_members = resolve_smart_group_members(db, g)
            member_count = len(smart_members)
        policy_count = db.query(GroupPolicyAssignment).filter(
            GroupPolicyAssignment.group_id == g.id
        ).count()
        result.append({
            "id": g.id,
            "name": g.name,
            "description": g.description,
            "group_type": g.group_type,
            "smart_rule": g.smart_rule,
            "created_by": g.created_by,
            "created_at": g.created_at,
            "member_count": member_count,
            "policy_count": policy_count,
        })
    return result


def get_group_by_id(db: Session, group_id: int):
    return db.query(DeviceGroup).filter(DeviceGroup.id == group_id).first()


def create_group(db: Session, name: str, description: str = "",
                 group_type: str = "static", smart_rule: str = None,
                 created_by: str = "admin"):
    group = DeviceGroup(
        name=name,
        description=description,
        group_type=group_type,
        smart_rule=smart_rule,
        created_by=created_by,
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


def update_group(db: Session, group_id: int, **kwargs):
    group = db.query(DeviceGroup).filter(DeviceGroup.id == group_id).first()
    if not group:
        return None
    for k, v in kwargs.items():
        if hasattr(group, k) and v is not None:
            setattr(group, k, v)
    group.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(group)
    return group


def delete_group(db: Session, group_id: int) -> bool:
    group = db.query(DeviceGroup).filter(DeviceGroup.id == group_id).first()
    if not group:
        return False
    db.query(DeviceGroupMember).filter(DeviceGroupMember.group_id == group_id).delete()
    db.query(GroupPolicyAssignment).filter(GroupPolicyAssignment.group_id == group_id).delete()
    db.delete(group)
    db.commit()
    return True


# ── MEMBER MANAGEMENT ─────────────────────────────────────────────────────────
def get_group_members(db: Session, group_id: int):
    group = db.query(DeviceGroup).filter(DeviceGroup.id == group_id).first()
    if not group:
        return []
    if group.group_type == "smart":
        devices = resolve_smart_group_members(db, group)
    else:
        memberships = db.query(DeviceGroupMember).filter(
            DeviceGroupMember.group_id == group_id
        ).all()
        device_ids = [m.device_id for m in memberships]
        devices = db.query(Device).filter(Device.id.in_(device_ids)).all()
    return [{"id": d.id, "name": d.name, "platform": d.platform,
             "os_version": d.os_version, "status": d.status, "owner": d.owner}
            for d in devices]


def add_members_to_group(db: Session, group_id: int, device_ids: list[int]):
    added = []
    for device_id in device_ids:
        existing = db.query(DeviceGroupMember).filter(
            DeviceGroupMember.group_id == group_id,
            DeviceGroupMember.device_id == device_id,
        ).first()
        if not existing:
            m = DeviceGroupMember(group_id=group_id, device_id=device_id)
            db.add(m)
            added.append(device_id)
    db.commit()
    return {"added": len(added), "device_ids": added}


def remove_member_from_group(db: Session, group_id: int, device_id: int) -> bool:
    m = db.query(DeviceGroupMember).filter(
        DeviceGroupMember.group_id == group_id,
        DeviceGroupMember.device_id == device_id,
    ).first()
    if not m:
        return False
    db.delete(m)
    db.commit()
    return True


# ── GROUP POLICY ASSIGNMENT ───────────────────────────────────────────────────
def get_group_policies(db: Session, group_id: int):
    assignments = db.query(GroupPolicyAssignment).filter(
        GroupPolicyAssignment.group_id == group_id
    ).all()
    result = []
    for a in assignments:
        policy = db.query(Policy).filter(Policy.id == a.policy_id).first()
        if policy:
            result.append({
                "assignment_id": a.id,
                "policy_id": policy.id,
                "name": policy.name,
                "category": policy.category,
                "platform": policy.platform,
                "status": policy.status,
                "assigned_by": a.assigned_by,
                "assigned_at": a.assigned_at,
            })
    return result


def assign_policy_to_group(db: Session, group_id: int, policy_id: int,
                            assigned_by: str = "admin"):
    """Assign a policy to a group AND deploy it to all current group members."""
    from app.services.compliance_engine import simulate_deployment, log_audit

    # Check existing
    existing = db.query(GroupPolicyAssignment).filter(
        GroupPolicyAssignment.group_id == group_id,
        GroupPolicyAssignment.policy_id == policy_id,
    ).first()
    if existing:
        return {"message": "Policy already assigned to this group", "deployed": 0}

    # Create group policy record
    gpa = GroupPolicyAssignment(
        group_id=group_id,
        policy_id=policy_id,
        assigned_by=assigned_by,
    )
    db.add(gpa)
    db.commit()

    # Get group members
    members = get_group_members(db, group_id)
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    deployed = 0

    for member in members:
        device_id = member["id"]
        # Skip if already assigned
        existing_assign = db.query(PolicyDeviceAssignment).filter(
            PolicyDeviceAssignment.policy_id == policy_id,
            PolicyDeviceAssignment.device_id == device_id,
        ).first()
        if existing_assign:
            continue

        assignment = PolicyDeviceAssignment(
            policy_id=policy_id,
            device_id=device_id,
            assigned_by=f"group:{group_id}",
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        if policy:
            simulate_deployment(db, assignment, policy)
        deployed += 1

    log_audit(
        db,
        admin=assigned_by,
        action="assign_policy_to_group",
        target_type="group",
        target_id=group_id,
        details=f"Policy #{policy_id} assigned to group #{group_id} — {deployed} devices deployed",
    )

    return {
        "message": f"Policy assigned to group and deployed to {deployed} devices",
        "group_id": group_id,
        "policy_id": policy_id,
        "deployed": deployed,
    }


def remove_policy_from_group(db: Session, group_id: int, policy_id: int) -> bool:
    gpa = db.query(GroupPolicyAssignment).filter(
        GroupPolicyAssignment.group_id == group_id,
        GroupPolicyAssignment.policy_id == policy_id,
    ).first()
    if not gpa:
        return False
    db.delete(gpa)
    db.commit()
    return True


def get_group_detail(db: Session, group_id: int):
    group = db.query(DeviceGroup).filter(DeviceGroup.id == group_id).first()
    if not group:
        return None
    members = get_group_members(db, group_id)
    policies = get_group_policies(db, group_id)
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "group_type": group.group_type,
        "smart_rule": group.smart_rule,
        "created_by": group.created_by,
        "created_at": group.created_at,
        "updated_at": group.updated_at,
        "members": members,
        "policies": policies,
    }
