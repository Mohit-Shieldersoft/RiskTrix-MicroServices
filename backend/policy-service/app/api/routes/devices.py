from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import SessionLocal
from app.schemas.device import AssignPolicyRequest, DeviceResponse
from app.services.device_service import (
    get_all_devices, get_devices_for_policy,
    assign_policy_to_devices, unassign_policy_from_device,
    get_assignment_stats, update_deployment_status,
    get_device_with_policies, retry_assignment,
    get_violations_for_device, get_device_activities,
    get_audit_logs, get_global_deployment_stats, bulk_assign,
    delete_assignment_by_id,
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Devices ───────────────────────────────────────────────
@router.get("/devices", response_model=list[DeviceResponse])
def read_devices(db: Session = Depends(get_db)):
    return get_all_devices(db)


@router.get("/devices/{device_id}")
def read_device(device_id: int, db: Session = Depends(get_db)):
    device = get_device_with_policies(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.get("/devices/{device_id}/violations")
def device_violations(device_id: int, db: Session = Depends(get_db)):
    return get_violations_for_device(db, device_id)


@router.get("/devices/{device_id}/activities")
def device_activities(device_id: int, db: Session = Depends(get_db)):
    return get_device_activities(db, device_id)


# ── Policy Assignment ─────────────────────────────────────
@router.get("/policies/{policy_id}/devices")
def get_policy_devices(policy_id: int, db: Session = Depends(get_db)):
    return get_devices_for_policy(db, policy_id)


class BulkAssignRequest(BaseModel):
    policy_ids: list[int]
    device_ids: list[int]
    assigned_by: str = "admin"


@router.post("/policies/assign/bulk")
def bulk_assign_endpoint(body: BulkAssignRequest, db: Session = Depends(get_db)):
    if not body.policy_ids:
        raise HTTPException(status_code=422, detail="No policies selected")
    if not body.device_ids:
        raise HTTPException(status_code=422, detail="No devices selected")
    return bulk_assign(db, body.policy_ids, body.device_ids, body.assigned_by)


@router.post("/policies/{policy_id}/assign")
def assign_devices(policy_id: int, body: AssignPolicyRequest, db: Session = Depends(get_db)):
    if not body.device_ids:
        raise HTTPException(status_code=422, detail="No devices selected")
    assigned_by = getattr(body, "assigned_by", "admin") or "admin"
    results = assign_policy_to_devices(db, policy_id, body.device_ids, assigned_by)
    success = sum(1 for r in results if r.deployment_status == "success")
    failed = sum(1 for r in results if r.deployment_status == "failed")
    return {
        "assigned": len(results),
        "policy_id": policy_id,
        "deployment_success": success,
        "deployment_failed": failed,
    }


@router.delete("/policies/{policy_id}/devices/{device_id}")
def unassign_device(policy_id: int, device_id: int, db: Session = Depends(get_db)):
    success = unassign_policy_from_device(db, policy_id, device_id)
    if not success:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"message": "Device unassigned successfully"}


@router.post("/policies/assignments/{assignment_id}/retry")
def retry_assignment_endpoint(assignment_id: int, db: Session = Depends(get_db)):
    result = retry_assignment(db, assignment_id)
    if not result:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {
        "assignment_id": assignment_id,
        "deployment_status": result.deployment_status,
        "deployment_message": result.deployment_message,
        "compliance_status": result.compliance_status,
        "compliance_score": result.compliance_score,
    }


@router.get("/policies/{policy_id}/assignment-stats")
def assignment_stats(policy_id: int, db: Session = Depends(get_db)):
    return get_assignment_stats(db, policy_id)


@router.patch("/policies/{policy_id}/devices/{device_id}/status")
def simulate_status(policy_id: int, device_id: int, body: dict, db: Session = Depends(get_db)):
    status = body.get("status")
    if status not in ["success", "failed", "pending"]:
        raise HTTPException(status_code=422, detail="status must be success, failed or pending")
    updated = update_deployment_status(db, policy_id, device_id, status)
    if not updated:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"message": f"Status updated to {status}"}


# ── Global Deployment Stats ───────────────────────────────
@router.get("/policies/deployment/stats")
def deployment_stats(db: Session = Depends(get_db)):
    return get_global_deployment_stats(db)


# ── Get Device Policies (spec alias) ─────────────────────
@router.get("/policies/device/{device_id}")
def get_policies_for_device(device_id: int, db: Session = Depends(get_db)):
    """
    Spec-compliant alias: GET /api/v1/policies/device/{device_id}
    Returns the device's assigned policies with deployment + compliance status.
    """
    result = get_device_with_policies(db, device_id)
    if not result:
        raise HTTPException(status_code=404, detail="Device not found")
    return {
        "device_id": result["id"],
        "device_name": result["name"],
        "platform": result["platform"],
        "assigned_policies": [
            {
                "id": p["id"],
                "name": p["name"],
                "category": p["category"],
                "platform": p["platform"],
                "status": p["status"],
                "deployment_status": p["deployment_status"],
                "deployment_message": p["deployment_message"],
                "compliance_status": p["compliance_status"],
                "compliance_score": p["compliance_score"],
                "assigned_at": p["assigned_at"],
                "applied_at": p["applied_at"],
                "assignment_id": p["assignment_id"],
            }
            for p in result["assigned_policies"]
        ],
    }


# ── Remove Assignment by ID ───────────────────────────────
@router.delete("/policies/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, deleted_by: str = "admin", db: Session = Depends(get_db)):
    success = delete_assignment_by_id(db, assignment_id, deleted_by)
    if not success:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"message": f"Assignment #{assignment_id} removed successfully"}


# ── Audit Logs ────────────────────────────────────────────
@router.get("/audit-logs")
def audit_logs(db: Session = Depends(get_db)):
    return get_audit_logs(db)