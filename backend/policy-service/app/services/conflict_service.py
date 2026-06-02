from sqlalchemy.orm import Session
from app.models.policy import Policy
from app.models.device import Device, PolicyDeviceAssignment

# Fields that conflict when two policies have OPPOSITE boolean values
BOOL_FIELDS = [
    ("bluetooth_disabled",   "Bluetooth access"),
    ("usb_disabled",         "USB access"),
    ("wifi_restricted",      "Wi-Fi access"),
    ("encryption_required",  "Device encryption"),
    ("require_screen_lock",  "Screen lock"),
    ("os_update_required",   "OS update enforcement"),
    ("password_complexity",  "Password complexity"),
]

# Numeric fields that conflict when both policies set a non-zero value
# and those values differ
NUMERIC_FIELDS = [
    ("min_password_length",  "Minimum password length"),
    ("password_expiry_days", "Password expiry days"),
]

# String fields that conflict when both set a non-empty value and they differ
STRING_FIELDS = [
    ("min_os_version", "Minimum OS version"),
]


def _platforms_compatible(p1: Policy, p2: Policy) -> bool:
    """Two policies are comparable if at least one targets 'all' or they share a platform."""
    return p1.platform == "all" or p2.platform == "all" or p1.platform == p2.platform


def _detect_conflicts_between(policy_a: Policy, policy_b: Policy) -> list[dict]:
    """Return a list of conflict dicts for every field that conflicts between two policies."""
    conflicts = []

    for field, label in BOOL_FIELDS:
        val_a = getattr(policy_a, field, None)
        val_b = getattr(policy_b, field, None)
        # Both explicitly set (non-None) but to opposite values
        if val_a is not None and val_b is not None and bool(val_a) != bool(val_b):
            conflicts.append({
                "field": field,
                "label": label,
                "conflict_type": "boolean_conflict",
                "severity": "high",
                "description": (
                    f'"{policy_a.name}" sets {label} to '
                    f'{"DISABLED" if val_a else "ALLOWED"}, '
                    f'but "{policy_b.name}" sets it to '
                    f'{"DISABLED" if val_b else "ALLOWED"}.'
                ),
                "policy_a_value": str(val_a),
                "policy_b_value": str(val_b),
            })

    for field, label in NUMERIC_FIELDS:
        val_a = getattr(policy_a, field, 0) or 0
        val_b = getattr(policy_b, field, 0) or 0
        if val_a > 0 and val_b > 0 and val_a != val_b:
            conflicts.append({
                "field": field,
                "label": label,
                "conflict_type": "numeric_mismatch",
                "severity": "medium",
                "description": (
                    f'"{policy_a.name}" requires {label} = {val_a}, '
                    f'but "{policy_b.name}" requires {label} = {val_b}.'
                ),
                "policy_a_value": str(val_a),
                "policy_b_value": str(val_b),
            })

    for field, label in STRING_FIELDS:
        val_a = (getattr(policy_a, field, "") or "").strip()
        val_b = (getattr(policy_b, field, "") or "").strip()
        if val_a and val_b and val_a != val_b:
            conflicts.append({
                "field": field,
                "label": label,
                "conflict_type": "version_mismatch",
                "severity": "medium",
                "description": (
                    f'"{policy_a.name}" requires {label} = {val_a}, '
                    f'but "{policy_b.name}" requires {label} = {val_b}.'
                ),
                "policy_a_value": val_a,
                "policy_b_value": val_b,
            })

    return conflicts


def check_conflicts_for_device(db: Session, device_id: int) -> dict:
    """Return all policy conflicts for a single device."""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        return {"device_id": device_id, "device_name": "Unknown", "conflicts": []}

    assignments = (
        db.query(PolicyDeviceAssignment)
        .filter(
            PolicyDeviceAssignment.device_id == device_id,
            PolicyDeviceAssignment.deployment_status != "removed",
        )
        .all()
    )

    policy_ids = [a.policy_id for a in assignments]
    policies = db.query(Policy).filter(Policy.id.in_(policy_ids)).all()
    policy_map = {p.id: p for p in policies}

    conflicts = []
    seen_pairs = set()

    for i, pid_a in enumerate(policy_ids):
        for pid_b in policy_ids[i + 1:]:
            pair_key = tuple(sorted([pid_a, pid_b]))
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            pol_a = policy_map.get(pid_a)
            pol_b = policy_map.get(pid_b)
            if not pol_a or not pol_b:
                continue
            if not _platforms_compatible(pol_a, pol_b):
                continue

            field_conflicts = _detect_conflicts_between(pol_a, pol_b)
            if field_conflicts:
                conflicts.append({
                    "policy_a_id": pid_a,
                    "policy_a_name": pol_a.name,
                    "policy_b_id": pid_b,
                    "policy_b_name": pol_b.name,
                    "conflict_count": len(field_conflicts),
                    "fields": field_conflicts,
                })

    return {
        "device_id": device_id,
        "device_name": device.name,
        "device_platform": device.platform,
        "total_assigned_policies": len(policy_ids),
        "conflicting_pairs": len(conflicts),
        "conflicts": conflicts,
    }


def get_all_conflicts(db: Session) -> dict:
    """Scan every device and return a summary of all conflicts."""
    # Only look at devices that have 2+ active assignments
    from sqlalchemy import func
    device_counts = (
        db.query(PolicyDeviceAssignment.device_id, func.count().label("cnt"))
        .filter(PolicyDeviceAssignment.deployment_status != "removed")
        .group_by(PolicyDeviceAssignment.device_id)
        .having(func.count() > 1)
        .all()
    )

    device_results = []
    total_conflicts = 0
    critical_devices = 0

    for row in device_counts:
        result = check_conflicts_for_device(db, row.device_id)
        if result["conflicting_pairs"] > 0:
            total_conflicts += result["conflicting_pairs"]
            critical_devices += 1
            device_results.append({
                "device_id": result["device_id"],
                "device_name": result["device_name"],
                "device_platform": result["device_platform"],
                "conflicting_pairs": result["conflicting_pairs"],
                "conflicts": result["conflicts"],
            })

    # Count severity breakdown
    high_count = 0
    medium_count = 0
    for d in device_results:
        for pair in d["conflicts"]:
            for f in pair["fields"]:
                if f["severity"] == "high":
                    high_count += 1
                else:
                    medium_count += 1

    return {
        "total_devices_scanned": len(device_counts),
        "devices_with_conflicts": critical_devices,
        "total_conflict_pairs": total_conflicts,
        "severity_breakdown": {
            "high": high_count,
            "medium": medium_count,
        },
        "devices": device_results,
    }


def get_conflict_summary(db: Session) -> dict:
    """Lightweight summary for banners / KPI cards."""
    full = get_all_conflicts(db)
    return {
        "devices_with_conflicts": full["devices_with_conflicts"],
        "total_conflict_pairs": full["total_conflict_pairs"],
        "severity_breakdown": full["severity_breakdown"],
        "has_conflicts": full["devices_with_conflicts"] > 0,
    }
