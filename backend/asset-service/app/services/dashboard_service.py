from sqlalchemy.orm import Session
from app.models.asset import Asset
from app.models.device import Device, EnrollmentToken, DeviceEnrollment, DeviceCheckin
from datetime import datetime


def get_dashboard_data(db: Session):
    assets = db.query(Asset).all()
    total = len(assets)
    high = len([a for a in assets if a.risk_level == "high"])
    medium = len([a for a in assets if a.risk_level == "medium"])
    low = len([a for a in assets if a.risk_level == "low"])
    by_type = {}
    for a in assets:
        by_type[a.type or "unknown"] = by_type.get(a.type or "unknown", 0) + 1
    return {
        "total_assets": total,
        "high_risk": high,
        "medium_risk": medium,
        "low_risk": low,
        "by_type": by_type,
    }


def get_enrollment_status(db: Session) -> dict:
    enrolled = db.query(Device).filter(Device.enrollment_status == "enrolled").count()
    pending = db.query(Device).filter(Device.enrollment_status == "pending").count()
    failed = db.query(Device).filter(Device.enrollment_status == "failed").count()
    awaiting = db.query(Device).filter(Device.enrollment_status == "unenrolled").count()
    return {
        "successfully_enrolled": enrolled,
        "pending": pending,
        "failed": failed,
        "awaiting_action": awaiting,
    }


def get_recent_activity(db: Session, limit: int = 10) -> list:
    checkins = (
        db.query(DeviceCheckin)
        .order_by(DeviceCheckin.checked_in_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for c in checkins:
        device = db.query(Device).filter(Device.id == c.device_id).first()
        result.append({
            "device": device.name if device else f"Device#{c.device_id}",
            "user": device.owner if device else "",
            "event": "Device check-in",
            "time": c.checked_in_at.strftime("%Y-%m-%d %H:%M") if c.checked_in_at else "",
        })
    return result


def get_policy_status(db: Session) -> dict:
    enrollments = db.query(DeviceEnrollment).all()
    success = len([e for e in enrollments if e.status == "active"])
    pending = len([e for e in enrollments if e.status == "pending"])
    failed = len([e for e in enrollments if e.status == "failed"])
    return {
        "success": success,
        "pending": pending,
        "failed": failed,
    }