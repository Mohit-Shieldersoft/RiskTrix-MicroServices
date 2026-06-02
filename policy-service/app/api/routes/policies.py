from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.schemas.policy import PolicyCreate, PolicyResponse, PolicyUpdate
# from app.schemas.dashboard import AssetDashboardResponse
from app.services.policy_service import (
    get_policies, get_policy_by_id, create_policy,
    update_policy, delete_policy, get_policy_stats,
    get_policy_details,
)
from app.services.dashboard_service import get_dashboard_data, get_widget_data
from app.services.conflict_service import (
    check_conflicts_for_device, get_all_conflicts, get_conflict_summary,
)
from app.services.template_service import (
    get_all_templates, get_template_by_id, apply_template,
)
from app.services.alert_service import get_alerts
from pydantic import BaseModel
from typing import Optional


router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/policies/stats")
def policy_stats(db: Session = Depends(get_db)):
    return get_policy_stats(db)


@router.get("/policies/dashboard")
def policy_dashboard(db: Session = Depends(get_db)):
    return get_dashboard_data(db)


@router.get("/policies/dashboard/widgets")
def policy_dashboard_widgets(db: Session = Depends(get_db)):
    return get_widget_data(db)


@router.get("/policies/alerts")
def policy_alerts(db: Session = Depends(get_db)):
    return get_alerts(db)


# ── Conflict Detection ────────────────────────────────────
@router.get("/policies/conflicts/summary")
def conflict_summary(db: Session = Depends(get_db)):
    return get_conflict_summary(db)


@router.get("/policies/conflicts/all")
def all_conflicts(db: Session = Depends(get_db)):
    return get_all_conflicts(db)


@router.get("/policies/conflicts/device/{device_id}")
def device_conflicts(device_id: int, db: Session = Depends(get_db)):
    return check_conflicts_for_device(db, device_id)


@router.get("/policies", response_model=list[PolicyResponse])
def read_policies(db: Session = Depends(get_db)):
    return get_policies(db)


@router.post("/policies", response_model=PolicyResponse, status_code=201)
def add_policy(policy: PolicyCreate, db: Session = Depends(get_db)):
    return create_policy(db, policy)


@router.put("/policies/{policy_id}", response_model=PolicyResponse)
def edit_policy(policy_id: int, policy: PolicyUpdate, db: Session = Depends(get_db)):
    updated = update_policy(db, policy_id, policy)
    if not updated:
        raise HTTPException(status_code=404, detail="Policy not found")
    return updated


@router.delete("/policies/{policy_id}")
def remove_policy(policy_id: int, db: Session = Depends(get_db)):
    success = delete_policy(db, policy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"message": "Policy deleted successfully"}


@router.get("/policies/{policy_id}/details")
def read_policy_details(policy_id: int, db: Session = Depends(get_db)):
    details = get_policy_details(db, policy_id)
    if not details:
        raise HTTPException(status_code=404, detail="Policy not found")
    return details


@router.get("/policies/{policy_id}", response_model=PolicyResponse)
def read_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = get_policy_by_id(db, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


# ── Policy Templates ────────────────────────────────────
class ApplyTemplateRequest(BaseModel):
    name_override: Optional[str] = None


@router.get("/policies/templates/list")
def list_templates():
    return get_all_templates()


@router.get("/policies/templates/{template_id}")
def get_template(template_id: str):
    template = get_template_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/policies/templates/{template_id}/apply", status_code=201)
def apply_template_endpoint(
    template_id: str,
    body: ApplyTemplateRequest,
    db: Session = Depends(get_db),
):
    policy = apply_template(db, template_id, body.name_override)
    if not policy:
        raise HTTPException(status_code=404, detail="Template not found")
    return {
        "id": policy.id,
        "name": policy.name,
        "message": f'Policy "{policy.name}" created from template "{template_id}"',
    }