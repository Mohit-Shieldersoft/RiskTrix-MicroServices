"""
agent.py — Device Agent / Heartbeat API (Policy Service)

Endpoints:
  POST  /agent/checkin                  — device agent reports health metrics
  GET   /agent/status/{device_id}       — current heartbeat status for a device
  GET   /agent/status                   — heartbeat status for all devices
  POST  /agent/mark-offline             — manually mark stale devices offline
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.device import Device, DeviceActivity

router = APIRouter()

OFFLINE_THRESHOLD_MINUTES = 15


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class AgentCheckin(BaseModel):
    device_id: int
    battery_level: int | None = None        # 0-100
    storage_used: float | None = None       # GB
    storage_total: float | None = None      # GB
    agent_version: str | None = None
    network_status: str | None = None       # wifi | cellular | ethernet | none
    ip_address: str | None = None
    os_version: str | None = None


# ── Serializer ────────────────────────────────────────────────────────────────

def _serialize_status(device: Device) -> dict:
    now = datetime.utcnow()
    if device.last_seen:
        seconds_ago = (now - device.last_seen).total_seconds()
        is_online = seconds_ago <= OFFLINE_THRESHOLD_MINUTES * 60
    else:
        seconds_ago = None
        is_online = False

    storage_pct = None
    if device.storage_used is not None and device.storage_total and device.storage_total > 0:
        storage_pct = round(device.storage_used / device.storage_total * 100, 1)

    return {
        "device_id": device.id,
        "name": device.name,
        "platform": device.platform,
        "owner": device.owner,
        "online": is_online,
        "status": device.status,
        "last_seen": device.last_seen,
        "seconds_since_seen": round(seconds_ago) if seconds_ago is not None else None,
        "battery_level": device.battery_level,
        "storage_used": device.storage_used,
        "storage_total": device.storage_total,
        "storage_pct": storage_pct,
        "agent_version": device.agent_version,
        "network_status": device.network_status,
        "ip_address": device.ip_address,
        "os_version": device.os_version,
    }


# ── POST /agent/checkin ───────────────────────────────────────────────────────

@router.post("/agent/checkin")
def agent_checkin(payload: AgentCheckin, db: Session = Depends(get_db)):
    """
    Called by device agents at regular intervals to report health metrics.
    Updates Device fields and marks the device online.
    Also triggers pending remote commands delivery.
    """
    device = db.query(Device).filter(Device.id == payload.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail=f"Device {payload.device_id} not found")

    now = datetime.utcnow()
    device.last_seen = now
    device.online = True

    # Update any provided fields
    if payload.battery_level is not None:
        device.battery_level = payload.battery_level
    if payload.storage_used is not None:
        device.storage_used = payload.storage_used
    if payload.storage_total is not None:
        device.storage_total = payload.storage_total
    if payload.agent_version is not None:
        device.agent_version = payload.agent_version
    if payload.network_status is not None:
        device.network_status = payload.network_status
    if payload.ip_address is not None:
        device.ip_address = payload.ip_address
    if payload.os_version is not None:
        device.os_version = payload.os_version

    # Log activity
    db.add(DeviceActivity(
        device_id=device.id,
        event_type="heartbeat",
        message=f"Agent check-in — battery: {payload.battery_level}%, network: {payload.network_status}",
    ))

    db.commit()

    # Return any pending commands so the agent can execute them
    from app.models.security import DeviceCommand
    pending_cmds = (
        db.query(DeviceCommand)
        .filter(DeviceCommand.device_id == payload.device_id, DeviceCommand.status == "pending")
        .order_by(DeviceCommand.created_at.asc())
        .all()
    )
    for cmd in pending_cmds:
        cmd.status = "sent"
    db.commit()

    # Run automation rules for agent_checkin trigger
    try:
        from app.services.automation_executor import run_rules_for_trigger
        storage_pct = None
        if payload.storage_used and payload.storage_total and payload.storage_total > 0:
            storage_pct = round(payload.storage_used / payload.storage_total * 100, 1)
        run_rules_for_trigger(
            trigger_type="agent_checkin",
            context={
                "device_id": payload.device_id,
                "battery_level": payload.battery_level,
                "storage_pct": storage_pct,
                "network_status": payload.network_status,
            },
            db=db,
        )
    except Exception:
        pass

    return {
        "acknowledged": True,
        "device_id": device.id,
        "server_time": now.isoformat(),
        "pending_commands": [
            {"id": c.id, "command_type": c.command_type, "payload": c.payload}
            for c in pending_cmds
        ],
    }


# ── GET /agent/status/{device_id} ────────────────────────────────────────────

@router.get("/agent/status/{device_id}")
def get_device_heartbeat(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return _serialize_status(device)


# ── GET /agent/status ─────────────────────────────────────────────────────────

@router.get("/agent/status")
def get_all_heartbeats(db: Session = Depends(get_db)):
    """Returns heartbeat status for every device."""
    devices = db.query(Device).all()
    return [_serialize_status(d) for d in devices]


# ── POST /agent/mark-offline ──────────────────────────────────────────────────

@router.post("/agent/mark-offline")
def mark_stale_devices_offline(db: Session = Depends(get_db)):
    """
    Marks any device whose last_seen is older than OFFLINE_THRESHOLD_MINUTES as offline.
    Called by the scheduler every 5 minutes.
    """
    cutoff = datetime.utcnow() - timedelta(minutes=OFFLINE_THRESHOLD_MINUTES)
    stale = (
        db.query(Device)
        .filter(Device.online == True, Device.last_seen < cutoff)
        .all()
    )
    for d in stale:
        d.online = False
        db.add(DeviceActivity(
            device_id=d.id,
            event_type="offline",
            message=f"Device went offline — last seen {d.last_seen}",
        ))
    db.commit()
    return {"marked_offline": len(stale), "cutoff": cutoff.isoformat()}
