from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, JSON, String, Boolean, ForeignKey, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import relationship

from app.db.session import Base, get_session
from app.modules.shared.api.auth import require_roles

router = APIRouter()

# Dependency: write operations restricted to admin and ciso
_write_auth = [Depends(require_roles("admin", "ciso"))]

# ── SQLAlchemy Models ─────────────────────────────────────────────────────────

class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    trigger_type = Column(String(50), nullable=False, default="manual")
    # Map to existing columns used by the current DB schema.
    conditions  = Column("conditions_json", JSON, nullable=True, default=list)
    actions     = Column("actions_json", JSON, nullable=True, default=list)
    enabled     = Column(Boolean, nullable=False, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    executions  = relationship("AutomationExecution", back_populates="rule", cascade="all, delete-orphan")


class AutomationExecution(Base):
    __tablename__ = "automation_executions"

    id          = Column(Integer, primary_key=True, index=True)
    rule_id     = Column(Integer, ForeignKey("automation_rules.id", ondelete="CASCADE"), nullable=False)
    rule_name   = Column(String(255), nullable=False)
    trigger_type = Column(String(50), nullable=False)
    device_id   = Column(Integer, nullable=True)
    actions_taken = Column(JSON, nullable=True)
    status      = Column(String(20), nullable=False, default="success")  # success / failed / skipped
    detail      = Column(String(1000), nullable=True)
    executed_at = Column(DateTime(timezone=True), server_default=func.now())

    rule = relationship("AutomationRule", back_populates="executions")


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class ConditionSchema(BaseModel):
    field: str
    op: str
    value: Any


class ActionSchema(BaseModel):
    type: str
    severity: Optional[str] = "high"
    alert_type: Optional[str] = None
    message: Optional[str] = None
    action_type: Optional[str] = None
    notes: Optional[str] = None


class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_type: str = "manual"
    conditions: List[Dict[str, Any]] = []
    actions: List[Dict[str, Any]] = []
    enabled: bool = True


class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_type: Optional[str] = None
    conditions: Optional[List[Dict[str, Any]]] = None
    actions: Optional[List[Dict[str, Any]]] = None
    enabled: Optional[bool] = None


class RuleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    trigger_type: str
    conditions: List[Dict[str, Any]]
    actions: List[Dict[str, Any]]
    enabled: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ExecutionResponse(BaseModel):
    id: int
    rule_id: int
    rule_name: str
    trigger_type: str
    device_id: Optional[int]
    actions_taken: Optional[List[Any]] = []
    status: str
    detail: Optional[str]
    executed_at: Optional[datetime]

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_rules: int
    enabled_rules: int
    total_executions: int
    failed_executions: int


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _ensure_tables(db: AsyncSession):
    """Create tables if not yet created (runs idempotently on first request)."""
    from sqlalchemy import inspect, text
    try:
        await db.execute(text("SELECT 1 FROM automation_rules LIMIT 1"))
    except Exception:
        await db.rollback()
        async with db.get_bind().begin() as conn:
            await conn.run_sync(Base.metadata.create_all)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/rules", response_model=List[RuleResponse])
async def list_rules(
    trigger_type: Optional[str] = Query(None),
    enabled: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_session),
):
    stmt = select(AutomationRule)
    if trigger_type:
        stmt = stmt.where(AutomationRule.trigger_type == trigger_type)
    if enabled is not None:
        stmt = stmt.where(AutomationRule.enabled == enabled)
    stmt = stmt.order_by(AutomationRule.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/rules/{rule_id}", response_model=RuleResponse)
async def get_rule(rule_id: int, db: AsyncSession = Depends(get_session)):
    rule = await db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    return rule


@router.post("/rules", response_model=RuleResponse, status_code=status.HTTP_201_CREATED, dependencies=_write_auth)
async def create_rule(body: RuleCreate, db: AsyncSession = Depends(get_session)):
    payload = body.model_dump()
    payload["conditions"] = payload.get("conditions") or []
    payload["actions"] = payload.get("actions") or []
    payload["created_at"] = datetime.utcnow()
    payload["updated_at"] = datetime.utcnow()
    rule = AutomationRule(**payload)
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.put("/rules/{rule_id}", response_model=RuleResponse, dependencies=_write_auth)
async def update_rule(rule_id: int, body: RuleUpdate, db: AsyncSession = Depends(get_session)):
    rule = await db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=_write_auth)
async def delete_rule(rule_id: int, db: AsyncSession = Depends(get_session)):
    rule = await db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    await db.delete(rule)
    await db.commit()


@router.patch("/rules/{rule_id}/toggle", response_model=RuleResponse, dependencies=_write_auth)
async def toggle_rule(rule_id: int, db: AsyncSession = Depends(get_session)):
    rule = await db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    rule.enabled = not rule.enabled
    await db.commit()
    await db.refresh(rule)
    return rule


@router.post("/rules/{rule_id}/test", dependencies=_write_auth)
async def test_rule(rule_id: int, context: Dict[str, Any] = {}, db: AsyncSession = Depends(get_session)):
    rule = await db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    # Simulate evaluation
    matched = True
    for cond in (rule.conditions or []):
        field = cond.get("field", "")
        op    = cond.get("op", "eq")
        val   = cond.get("value")
        ctx_val = context.get(field)
        if ctx_val is None:
            matched = False
            break
        try:
            if   op == "eq"      : matched = matched and (str(ctx_val) == str(val))
            elif op == "neq"     : matched = matched and (str(ctx_val) != str(val))
            elif op == "gt"      : matched = matched and (float(ctx_val) > float(val))
            elif op == "gte"     : matched = matched and (float(ctx_val) >= float(val))
            elif op == "lt"      : matched = matched and (float(ctx_val) < float(val))
            elif op == "lte"     : matched = matched and (float(ctx_val) <= float(val))
            elif op == "is_true" : matched = matched and bool(ctx_val)
            elif op == "is_false": matched = matched and not bool(ctx_val)
            elif op == "contains": matched = matched and (str(val) in str(ctx_val))
        except (ValueError, TypeError):
            matched = False
            break

    # Record execution
    execution = AutomationExecution(
        rule_id=rule_id,
        rule_name=rule.name,
        trigger_type=rule.trigger_type,
        device_id=context.get("device_id") if isinstance(context.get("device_id"), int) else None,
        actions_taken=[(a.get("type") or a.get("action_type") or "action") for a in (rule.actions or [])] if matched else [],
        status="success" if matched else "skipped",
        detail="Conditions matched" if matched else "Conditions not matched",
    )
    db.add(execution)
    await db.commit()

    return {
        "conditions_matched": matched,
        "rule_name": rule.name,
        "actions_taken": execution.actions_taken or [],
        "context_used": context,
    }


@router.get("/executions", response_model=List[ExecutionResponse])
async def list_executions(
    rule_id: Optional[int]  = Query(None),
    device_id: Optional[int] = Query(None),
    status: Optional[str]   = Query(None),
    limit: int               = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_session),
):
    stmt = select(AutomationExecution)
    if rule_id:
        stmt = stmt.where(AutomationExecution.rule_id == rule_id)
    if device_id:
        stmt = stmt.where(AutomationExecution.device_id == device_id)
    if status:
        stmt = stmt.where(AutomationExecution.status == status)
    stmt = stmt.order_by(AutomationExecution.executed_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_session)):
    total_rules      = (await db.execute(select(func.count()).select_from(AutomationRule))).scalar_one()
    enabled_rules    = (await db.execute(select(func.count()).select_from(AutomationRule).where(AutomationRule.enabled == True))).scalar_one()
    total_executions = (await db.execute(select(func.count()).select_from(AutomationExecution))).scalar_one()
    failed_executions = (await db.execute(select(func.count()).select_from(AutomationExecution).where(AutomationExecution.status == "failed"))).scalar_one()
    return StatsResponse(
        total_rules=total_rules,
        enabled_rules=enabled_rules,
        total_executions=total_executions,
        failed_executions=failed_executions,
    )
