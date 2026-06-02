"""
automation.py — REST API for Automation Rules & Execution history
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.automation import AutomationRule, AutomationExecution

router = APIRouter(prefix="/automation", tags=["Automation"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Schemas ───────────────────────────────────────────────────────────────────

class ConditionSchema(BaseModel):
    field: str
    op: str         # eq | neq | gt | gte | lt | lte | is_true | is_false | contains
    value: Optional[str | int | float | bool] = None


class ActionSchema(BaseModel):
    type: str       # lock_device | wipe_device | restart_device | sync_device |
                    # push_policy | create_alert | log_remediation | log_activity
    severity: Optional[str] = None
    message: Optional[str] = None
    alert_type: Optional[str] = None
    action_type: Optional[str] = None
    notes: Optional[str] = None


class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    trigger_type: str           # risk_evaluated | device_offline | agent_checkin | manual
    conditions_json: List[dict] = []
    actions_json: List[dict] = []
    enabled: bool = True
    created_by: Optional[str] = "admin"


class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_type: Optional[str] = None
    conditions_json: Optional[List[dict]] = None
    actions_json: Optional[List[dict]] = None
    enabled: Optional[bool] = None


def _rule_out(r: AutomationRule) -> dict:
    return {
        "id": r.id,
        "name": r.name,
        "description": r.description,
        "trigger_type": r.trigger_type,
        "conditions_json": r.conditions_json or [],
        "actions_json": r.actions_json or [],
        "enabled": r.enabled,
        "created_by": r.created_by,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


def _exec_out(e: AutomationExecution) -> dict:
    return {
        "id": e.id,
        "rule_id": e.rule_id,
        "rule_name": e.rule_name,
        "trigger_type": e.trigger_type,
        "device_id": e.device_id,
        "actions_taken": e.actions_taken or [],
        "status": e.status,
        "detail": e.detail,
        "executed_at": e.executed_at.isoformat() if e.executed_at else None,
    }


# ── Rules CRUD ────────────────────────────────────────────────────────────────

@router.get("/rules", response_model=List[dict])
def list_rules(
    trigger_type: Optional[str] = Query(None),
    enabled: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(AutomationRule)
    if trigger_type:
        q = q.filter(AutomationRule.trigger_type == trigger_type)
    if enabled is not None:
        q = q.filter(AutomationRule.enabled == enabled)
    return [_rule_out(r) for r in q.order_by(AutomationRule.created_at.desc()).all()]


@router.post("/rules", response_model=dict, status_code=201)
def create_rule(body: RuleCreate, db: Session = Depends(get_db)):
    rule = AutomationRule(
        name=body.name,
        description=body.description,
        trigger_type=body.trigger_type,
        conditions_json=body.conditions_json,
        actions_json=body.actions_json,
        enabled=body.enabled,
        created_by=body.created_by,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return _rule_out(rule)


@router.get("/rules/{rule_id}", response_model=dict)
def get_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(404, "Rule not found")
    return _rule_out(rule)


@router.put("/rules/{rule_id}", response_model=dict)
def update_rule(rule_id: int, body: RuleUpdate, db: Session = Depends(get_db)):
    rule = db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(404, "Rule not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(rule, field, val)
    rule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rule)
    return _rule_out(rule)


@router.delete("/rules/{rule_id}", status_code=204)
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(404, "Rule not found")
    db.delete(rule)
    db.commit()


@router.patch("/rules/{rule_id}/toggle", response_model=dict)
def toggle_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(404, "Rule not found")
    rule.enabled = not rule.enabled
    rule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rule)
    return _rule_out(rule)


@router.post("/rules/{rule_id}/test", response_model=dict)
def test_rule(rule_id: int, context: dict = {}, db: Session = Depends(get_db)):
    """
    Manually trigger a rule against an optional context dict.
    Useful for testing from the UI without waiting for a real event.
    """
    rule = db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(404, "Rule not found")
    from app.services.automation_executor import _conditions_match, _run_action
    conditions = rule.conditions_json or []
    matched = _conditions_match(conditions, context)
    actions_taken = []
    if matched:
        for action in (rule.actions_json or []):
            result = _run_action(action, context.get("device_id"), rule.name, db)
            actions_taken.append(result)
        # Log it
        db.add(AutomationExecution(
            rule_id=rule.id,
            rule_name=rule.name,
            trigger_type="manual_test",
            device_id=context.get("device_id"),
            actions_taken=actions_taken,
            status="success",
            detail=f"Manual test with context: {context}",
        ))
        db.commit()
    return {
        "rule_id": rule_id,
        "conditions_matched": matched,
        "actions_taken": actions_taken,
        "context_used": context,
    }


# ── Execution history ─────────────────────────────────────────────────────────

@router.get("/executions", response_model=List[dict])
def list_executions(
    rule_id: Optional[int] = Query(None),
    device_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(AutomationExecution)
    if rule_id is not None:
        q = q.filter(AutomationExecution.rule_id == rule_id)
    if device_id is not None:
        q = q.filter(AutomationExecution.device_id == device_id)
    if status:
        q = q.filter(AutomationExecution.status == status)
    execs = q.order_by(AutomationExecution.executed_at.desc()).limit(limit).all()
    return [_exec_out(e) for e in execs]


@router.get("/stats", response_model=dict)
def automation_stats(db: Session = Depends(get_db)):
    total_rules   = db.query(AutomationRule).count()
    enabled_rules = db.query(AutomationRule).filter(AutomationRule.enabled == True).count()
    total_execs   = db.query(AutomationExecution).count()
    failed_execs  = db.query(AutomationExecution).filter(AutomationExecution.status == "failed").count()
    return {
        "total_rules": total_rules,
        "enabled_rules": enabled_rules,
        "total_executions": total_execs,
        "failed_executions": failed_execs,
    }
