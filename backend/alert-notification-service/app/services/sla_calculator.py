from datetime import datetime, timedelta
from typing import Dict, Any


def calculate_sla_status(created_at: datetime, sla_deadline_hours: int, status: str) -> Dict[str, Any]:
    """Calculate SLA deadline remaining hours and breach risk state."""
    if status in ("RESOLVED", "DISMISSED"):
        return {
            "sla_status": "MET",
            "hours_remaining": 0.0,
            "is_breached": False,
        }

    now = datetime.utcnow()
    deadline = created_at + timedelta(hours=sla_deadline_hours)
    seconds_remaining = (deadline - now).total_seconds()
    hours_remaining = round(seconds_remaining / 3600.0, 1)

    if hours_remaining <= 0:
        sla_status = "BREACHED"
        is_breached = True
    elif hours_remaining <= max(1.0, sla_deadline_hours * 0.25):
        sla_status = "NEAR_BREACH"
        is_breached = False
    else:
        sla_status = "ON_TRACK"
        is_breached = False

    return {
        "sla_status": sla_status,
        "hours_remaining": hours_remaining,
        "is_breached": is_breached,
    }
