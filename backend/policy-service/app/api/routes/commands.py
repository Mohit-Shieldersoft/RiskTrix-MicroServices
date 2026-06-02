"""
commands.py — Remote Device Command API (Policy Service)

Endpoints:
  POST   /devices/{device_id}/commands           — issue any command
  POST   /devices/{device_id}/commands/lock       — shortcut: lock device
  POST   /devices/{device_id}/commands/wipe       — shortcut: factory wipe
  POST   /devices/{device_id}/commands/restart    — shortcut: restart
  POST   /devices/{device_id}/commands/sync       — shortcut: force policy sync
  POST   /devices/{device_id}/commands/message    — send message to device
  POST   /devices/{device_id}/commands/clear_passcode  — clear device passcode
  POST   /devices/{device_id}/commands/enable_lost_mode — enable lost mode

  GET    /devices/{device_id}/commands            — list all commands for a device
  GET    /devices/{device_id}/commands/pending    — pending commands (polled by agent)
  PATCH  /commands/{command_id}                   — update command status / response
  DELETE /commands/{command_id}                   — cancel a pending command
"""
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.security import DeviceCommand

router = APIRouter()

VALID_COMMAND_TYPES = {
    "lock",
    "wipe",
    "restart",
    "sync",
    "message",
    "clear_passcode",
    "enable_lost_mode",
}

VALID_STATUSES = {"pending", "sent", "acknowledged", "completed", "failed", "cancelled"}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class CommandRequest(BaseModel):
    command_type: str
    payload: dict[str, Any] = {}
    issued_by: str = "admin"


class CommandStatusUpdate(BaseModel):
    status: str
    response: str | None = None


# ── Serializer ────────────────────────────────────────────────────────────────

def _serialize(cmd: DeviceCommand) -> dict:
    return {
        "id": cmd.id,
        "device_id": cmd.device_id,
        "command_type": cmd.command_type,
        "status": cmd.status,
        "payload": cmd.payload,
        "issued_by": cmd.issued_by,
        "created_at": cmd.created_at,
        "executed_at": cmd.executed_at,
        "response": cmd.response,
    }


# ── Shared helper ─────────────────────────────────────────────────────────────

def _issue_command(device_id: int, command_type: str, payload: dict, issued_by: str, db: Session) -> DeviceCommand:
    if command_type not in VALID_COMMAND_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"command_type must be one of {sorted(VALID_COMMAND_TYPES)}",
        )
    cmd = DeviceCommand(
        device_id=device_id,
        command_type=command_type,
        payload=payload,
        issued_by=issued_by,
        status="pending",
    )
    db.add(cmd)
    db.commit()
    db.refresh(cmd)
    return cmd


# ── POST /devices/{device_id}/commands ───────────────────────────────────────

@router.post("/devices/{device_id}/commands")
def issue_command(device_id: int, body: CommandRequest, db: Session = Depends(get_db)):
    """Issue any command type with an optional payload."""
    cmd = _issue_command(device_id, body.command_type, body.payload, body.issued_by, db)
    return _serialize(cmd)


# ── Shortcut endpoints ────────────────────────────────────────────────────────

class SimpleCommandBody(BaseModel):
    issued_by: str = "admin"


class MessageCommandBody(BaseModel):
    message: str
    issued_by: str = "admin"


@router.post("/devices/{device_id}/commands/lock")
def lock_device(device_id: int, body: SimpleCommandBody = SimpleCommandBody(), db: Session = Depends(get_db)):
    cmd = _issue_command(device_id, "lock", {}, body.issued_by, db)
    return _serialize(cmd)


@router.post("/devices/{device_id}/commands/wipe")
def wipe_device(device_id: int, body: SimpleCommandBody = SimpleCommandBody(), db: Session = Depends(get_db)):
    cmd = _issue_command(device_id, "wipe", {}, body.issued_by, db)
    return _serialize(cmd)


@router.post("/devices/{device_id}/commands/restart")
def restart_device(device_id: int, body: SimpleCommandBody = SimpleCommandBody(), db: Session = Depends(get_db)):
    cmd = _issue_command(device_id, "restart", {}, body.issued_by, db)
    return _serialize(cmd)


@router.post("/devices/{device_id}/commands/sync")
def sync_device(device_id: int, body: SimpleCommandBody = SimpleCommandBody(), db: Session = Depends(get_db)):
    cmd = _issue_command(device_id, "sync", {}, body.issued_by, db)
    return _serialize(cmd)


@router.post("/devices/{device_id}/commands/message")
def send_message(device_id: int, body: MessageCommandBody, db: Session = Depends(get_db)):
    cmd = _issue_command(device_id, "message", {"message": body.message}, body.issued_by, db)
    return _serialize(cmd)


@router.post("/devices/{device_id}/commands/clear_passcode")
def clear_passcode(device_id: int, body: SimpleCommandBody = SimpleCommandBody(), db: Session = Depends(get_db)):
    cmd = _issue_command(device_id, "clear_passcode", {}, body.issued_by, db)
    return _serialize(cmd)


@router.post("/devices/{device_id}/commands/enable_lost_mode")
def enable_lost_mode(device_id: int, body: SimpleCommandBody = SimpleCommandBody(), db: Session = Depends(get_db)):
    cmd = _issue_command(device_id, "enable_lost_mode", {}, body.issued_by, db)
    return _serialize(cmd)


# ── GET /devices/{device_id}/commands ────────────────────────────────────────

@router.get("/devices/{device_id}/commands")
def list_commands(device_id: int, db: Session = Depends(get_db)):
    cmds = (
        db.query(DeviceCommand)
        .filter(DeviceCommand.device_id == device_id)
        .order_by(DeviceCommand.created_at.desc())
        .all()
    )
    return [_serialize(c) for c in cmds]


# ── GET /devices/{device_id}/commands/pending ─────────────────────────────────

@router.get("/devices/{device_id}/commands/pending")
def get_pending_commands(device_id: int, db: Session = Depends(get_db)):
    """Polled by the device agent to retrieve commands it should execute."""
    cmds = (
        db.query(DeviceCommand)
        .filter(
            DeviceCommand.device_id == device_id,
            DeviceCommand.status == "pending",
        )
        .order_by(DeviceCommand.created_at.asc())
        .all()
    )
    # Mark as sent so agent knows they've been delivered
    for c in cmds:
        c.status = "sent"
    db.commit()
    return [_serialize(c) for c in cmds]


# ── PATCH /commands/{command_id} ──────────────────────────────────────────────

@router.patch("/commands/{command_id}")
def update_command(command_id: int, body: CommandStatusUpdate, db: Session = Depends(get_db)):
    """Called by the device agent to report completion or failure."""
    cmd = db.query(DeviceCommand).filter(DeviceCommand.id == command_id).first()
    if not cmd:
        raise HTTPException(status_code=404, detail="Command not found")
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(VALID_STATUSES)}")
    cmd.status = body.status
    if body.response is not None:
        cmd.response = body.response
    if body.status in ("completed", "failed"):
        cmd.executed_at = datetime.utcnow()
    db.commit()
    return _serialize(cmd)


# ── DELETE /commands/{command_id} ─────────────────────────────────────────────

@router.delete("/commands/{command_id}")
def cancel_command(command_id: int, db: Session = Depends(get_db)):
    """Cancel a command that has not yet been executed."""
    cmd = db.query(DeviceCommand).filter(DeviceCommand.id == command_id).first()
    if not cmd:
        raise HTTPException(status_code=404, detail="Command not found")
    if cmd.status not in ("pending", "sent"):
        raise HTTPException(status_code=400, detail="Only pending or sent commands can be cancelled")
    cmd.status = "cancelled"
    db.commit()
    return {"id": command_id, "status": "cancelled"}
