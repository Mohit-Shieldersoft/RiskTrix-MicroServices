from datetime import datetime, timedelta

# SLA time limits per priority (in hours)
SLA_RESPONSE_HOURS = {
    "critical": 1,
    "high": 4,
    "medium": 8,
    "low": 24,
}

SLA_RESOLUTION_HOURS = {
    "critical": 4,
    "high": 24,     
    "medium": 48,    
    "low": 72,      
}


def get_sla_deadlines(priority: str, created_at: datetime):
    response_hours = SLA_RESPONSE_HOURS.get(priority, 24)
    resolution_hours = SLA_RESOLUTION_HOURS.get(priority, 72)
    return {
        "sla_response_due": created_at + timedelta(hours=response_hours),
        "sla_resolution_due": created_at + timedelta(hours=resolution_hours),
    }


def check_sla_status(ticket):
    now = datetime.utcnow()
    result = {
        "response_due": ticket.sla_response_due,
        "resolution_due": ticket.sla_resolution_due,
        "response_breached": False,
        "resolution_breached": False,
        "response_remaining_minutes": None,
        "resolution_remaining_minutes": None,
        "response_status": "ok",    
        "resolution_status": "ok",  
    }

    # Response SLA
    if ticket.sla_response_due:
        if ticket.sla_response_met_at:
            result["response_status"] = "met"
        elif ticket.sla_response_breached or now > ticket.sla_response_due:
            result["response_breached"] = True
            result["response_status"] = "breached"
        else:
            remaining = (ticket.sla_response_due - now).total_seconds() / 60
            result["response_remaining_minutes"] = round(remaining)
            # Warning if less than 25% time left
            total = SLA_RESPONSE_HOURS.get(ticket.priority, 24) * 60
            if remaining < (total * 0.25):
                result["response_status"] = "warning"

    # Resolution SLA
    if ticket.sla_resolution_due:
        if ticket.status in ["resolved", "closed"]:
            result["resolution_status"] = "met"
        elif ticket.sla_resolution_breached or now > ticket.sla_resolution_due:
            result["resolution_breached"] = True
            result["resolution_status"] = "breached"
        else:
            remaining = (ticket.sla_resolution_due - now).total_seconds() / 60
            result["resolution_remaining_minutes"] = round(remaining)
            total = SLA_RESOLUTION_HOURS.get(ticket.priority, 72) * 60
            if remaining < (total * 0.25):
                result["resolution_status"] = "warning"

    return result


def format_remaining(minutes):
    if minutes is None:
        return "—"
    if minutes < 0:
        return "Breached"
    if minutes < 60:
        return f"{int(minutes)}m remaining"
    hours = minutes / 60
    if hours < 24:
        return f"{int(hours)}h {int(minutes % 60)}m remaining"
    days = hours / 24
    return f"{int(days)}d {int(hours % 24)}h remaining"