from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from app.models.device import Device, EnrollmentToken, DeviceEnrollment, DeviceCheckin, DeviceCommand


def generate_uid():
    return "DEV-" + secrets.token_hex(4).upper()


def generate_enrollment_token(db: Session, platform: str, created_by: str, expires_hours: int = 24):
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=expires_hours)
    enrollment_token = EnrollmentToken(
        token=token,
        platform=platform,
        created_by=created_by,
        expires_at=expires_at,
    )
    db.add(enrollment_token)
    db.commit()
    db.refresh(enrollment_token)
    return enrollment_token


def get_all_tokens(db: Session):
    return db.query(EnrollmentToken).order_by(
        EnrollmentToken.created_at.desc()
    ).all()


def revoke_token(db: Session, token_id: int):
    token = db.query(EnrollmentToken).filter(EnrollmentToken.id == token_id).first()
    if not token:
        return False
    token.used = True
    token.used_at = datetime.utcnow()
    db.commit()
    return True


def enroll_device(db: Session, data):
    # Validate token
    token_record = db.query(EnrollmentToken).filter(
        EnrollmentToken.token == data.token
    ).first()

    if not token_record:
        return None, "Invalid enrollment token"
    if token_record.used:
        return None, "Token has already been used"
    if datetime.utcnow() > token_record.expires_at:
        return None, "Token has expired"
    if token_record.platform != "all" and token_record.platform != data.platform.lower():
        return None, f"Token is for platform '{token_record.platform}', not '{data.platform}'"

    # Create device
    device = Device(
        device_uid=generate_uid(),
        name=data.name,
        platform=data.platform.lower(),
        os_version=data.os_version,
        owner=data.owner,
        department=data.department,
        device_model=data.device_model,
        manufacturer=data.manufacturer,
        serial_number=data.serial_number,
        mac_address=data.mac_address,
        enrollment_status="enrolled",
        status="active",
        last_seen=datetime.utcnow(),
    )
    db.add(device)
    db.flush()

    # Mark token used
    token_record.used = True
    token_record.used_at = datetime.utcnow()
    token_record.used_by_device_id = device.id

    # Enrollment record
    enrollment = DeviceEnrollment(
        device_id=device.id,
        token_id=token_record.id,
        enrolled_by=data.owner,
        enrollment_method="token",
        status="active",
    )
    db.add(enrollment)
    db.commit()
    db.refresh(device)
    return device, None


def get_all_devices(db: Session):
    return db.query(Device).order_by(Device.created_at.desc()).all()


def get_device_by_id(db: Session, device_id: int):
    return db.query(Device).filter(Device.id == device_id).first()


def get_device_by_uid(db: Session, device_uid: str):
    return db.query(Device).filter(Device.device_uid == device_uid).first()


def device_checkin(db: Session, data):
    device = db.query(Device).filter(Device.device_uid == data.device_uid).first()
    if not device:
        return None, "Device not found"

    device.last_seen = datetime.utcnow()
    checkin = DeviceCheckin(
        device_id=device.id,
        battery=data.battery,
        network=data.network,
        ip_address=data.ip_address,
    )
    db.add(checkin)
    db.commit()
    db.refresh(device)
    return device, None


def get_enrollment_history(db: Session):
    enrollments = db.query(DeviceEnrollment).order_by(
        DeviceEnrollment.enrolled_at.desc()
    ).all()
    result = []
    for e in enrollments:
        device = db.query(Device).filter(Device.id == e.device_id).first()
        token = db.query(EnrollmentToken).filter(EnrollmentToken.id == e.token_id).first()
        result.append({
            "id": e.id,
            "device_id": e.device_id,
            "device_name": device.name if device else "Unknown",
            "device_uid": device.device_uid if device else "Unknown",
            "platform": device.platform if device else "Unknown",
            "enrolled_at": e.enrolled_at,
            "enrolled_by": e.enrolled_by,
            "enrollment_method": e.enrollment_method,
            "status": e.status,
            "token_preview": token.token[:8] + "..." if token else "Unknown",
        })
    return result


def get_enrollment_stats(db: Session):
    total = db.query(Device).count()
    enrolled = db.query(Device).filter(Device.enrollment_status == "enrolled").count()
    active_tokens = db.query(EnrollmentToken).filter(
        EnrollmentToken.used == False,
        EnrollmentToken.expires_at > datetime.utcnow()
    ).count()
    expired_tokens = db.query(EnrollmentToken).filter(
        EnrollmentToken.used == False,
        EnrollmentToken.expires_at < datetime.utcnow()
    ).count()
    used_tokens = db.query(EnrollmentToken).filter(EnrollmentToken.used == True).count()

    return {
        "total_devices": total,
        "enrolled_devices": enrolled,
        "unenrolled_devices": total - enrolled,
        "active_tokens": active_tokens,
        "expired_tokens": expired_tokens,
        "used_tokens": used_tokens,
    }


# ── Device Commands ───────────────────────────────────────────────────────────

VALID_COMMANDS = {"lock", "wipe", "reboot", "sync_policy", "collect_logs"}


def send_command(db: Session, device_id: int, command: str):
    if command not in VALID_COMMANDS:
        return None, f"Invalid command. Must be one of: {VALID_COMMANDS}"
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        return None, "Device not found"
    cmd = DeviceCommand(device_id=device_id, command=command, status="pending")
    db.add(cmd)
    db.commit()
    db.refresh(cmd)
    return cmd, None


def get_commands(db: Session, device_id: int):
    return (
        db.query(DeviceCommand)
        .filter(DeviceCommand.device_id == device_id)
        .order_by(DeviceCommand.created_at.desc())
        .all()
    )


def complete_command(db: Session, command_id: int):
    cmd = db.query(DeviceCommand).filter(DeviceCommand.id == command_id).first()
    if not cmd:
        return None
    cmd.status = "executed"
    cmd.executed_at = datetime.utcnow()
    db.commit()
    db.refresh(cmd)
    return cmd


# ── Bulk Upload ───────────────────────────────────────────────────────────────

from app.schemas.device import VALID_PLATFORMS, VALID_RISK_LEVELS, VALID_STATUSES


def bulk_create_devices(db: Session, rows: list[dict]) -> dict:
    """
    Create multiple devices from a list of dicts (parsed from CSV/Excel).
    Returns {created, skipped, errors}.
    Skips rows where the device_uid or serial_number already exists.
    """
    created = 0
    skipped = 0
    errors = []

    for idx, row in enumerate(rows, start=2):  # row 1 = headers
        row_num = idx

        # ── Required fields ──────────────────────────────
        name = str(row.get("name", "")).strip()
        platform = str(row.get("platform", "")).strip().lower()

        if not name:
            errors.append({"row": row_num, "error": "Missing required field: name"})
            continue
        if not platform or platform not in VALID_PLATFORMS:
            errors.append({
                "row": row_num,
                "error": f"Invalid or missing platform '{platform}'. Must be one of: {sorted(VALID_PLATFORMS)}",
            })
            continue

        # ── Optional fields with defaults ────────────────
        risk_level = str(row.get("risk_level", "low")).strip().lower()
        if risk_level not in VALID_RISK_LEVELS:
            risk_level = "low"

        status = str(row.get("status", "active")).strip().lower()
        if status not in VALID_STATUSES:
            status = "active"

        serial_number = str(row.get("serial_number", "")).strip()
        device_uid_raw = str(row.get("device_uid", "")).strip()

        # ── Duplicate check ───────────────────────────────
        if serial_number:
            existing = db.query(Device).filter(Device.serial_number == serial_number).first()
            if existing:
                skipped += 1
                continue
        if device_uid_raw:
            existing = db.query(Device).filter(Device.device_uid == device_uid_raw).first()
            if existing:
                skipped += 1
                continue

        device = Device(
            device_uid=device_uid_raw or generate_uid(),
            name=name,
            platform=platform,
            os_version=str(row.get("os_version", "")).strip(),
            serial_number=serial_number,
            device_model=str(row.get("device_model", "")).strip(),
            manufacturer=str(row.get("manufacturer", "")).strip(),
            mac_address=str(row.get("mac_address", "")).strip(),
            owner=str(row.get("owner", "")).strip(),
            department=str(row.get("department", "")).strip(),
            enrollment_status="unenrolled",
            status=status,
            risk_level=risk_level,
        )
        db.add(device)
        created += 1

    if created > 0:
        db.commit()

    return {
        "created": created,
        "skipped": skipped,
        "errors": errors,
        "message": f"{created} device(s) created, {skipped} skipped (duplicates), {len(errors)} error(s)",
    }