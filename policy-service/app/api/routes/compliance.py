from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.services.compliance_scan_service import (
    run_compliance_scan, scan_all_assignments, get_compliance_dashboard,
)
from app.models.device import PolicyDeviceAssignment, ComplianceResult
from app.models.policy import Policy

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/compliance/dashboard")
def compliance_dashboard(db: Session = Depends(get_db)):
    """Full compliance dashboard data — summary, check breakdown, violations, queues."""
    return get_compliance_dashboard(db)


@router.post("/compliance/scan/all")
def trigger_full_scan(db: Session = Depends(get_db)):
    """Manually trigger a compliance scan across all successful assignments."""
    result = scan_all_assignments(db)
    return result


@router.post("/compliance/scan/assignment/{assignment_id}")
def scan_single_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Run compliance scan for a single assignment."""
    assignment = db.query(PolicyDeviceAssignment).filter(
        PolicyDeviceAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    policy = db.query(Policy).filter(Policy.id == assignment.policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return run_compliance_scan(db, assignment, policy)


@router.get("/compliance/device/{device_id}")
def device_compliance(device_id: int, db: Session = Depends(get_db)):
    """Get all compliance check results for a specific device."""
    results = db.query(ComplianceResult).filter(
        ComplianceResult.device_id == device_id
    ).order_by(ComplianceResult.checked_at.desc()).all()

    grouped = {}
    for r in results:
        key = (r.policy_id, r.assignment_id)
        if key not in grouped:
            grouped[key] = {
                "policy_id": r.policy_id,
                "assignment_id": r.assignment_id,
                "checked_at": r.checked_at,
                "checks": [],
            }
        grouped[key]["checks"].append({
            "type": r.compliance_type,
            "status": r.status,
            "severity": r.severity,
            "weight": r.weight,
            "detail": r.detail,
            "remediation_required": r.remediation_required,
        })

    return {"device_id": device_id, "scan_results": list(grouped.values())}


@router.get("/compliance/assignment/{assignment_id}")
def assignment_compliance(assignment_id: int, db: Session = Depends(get_db)):
    """Get all check results for a specific assignment."""
    results = db.query(ComplianceResult).filter(
        ComplianceResult.assignment_id == assignment_id
    ).all()
    return [
        {
            "type": r.compliance_type,
            "status": r.status,
            "severity": r.severity,
            "weight": r.weight,
            "detail": r.detail,
            "remediation_required": r.remediation_required,
            "checked_at": r.checked_at,
        }
        for r in results
    ]
