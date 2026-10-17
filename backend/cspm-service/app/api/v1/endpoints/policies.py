from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import CSPMPolicy, GuidedAction
from app.schemas.cspm import CSPMPolicyResponse, CSPMPolicyCreate
from app.services.seed_data import DEFAULT_POLICIES

router = APIRouter()



@router.get("/policies", response_model=List[CSPMPolicyResponse])
async def list_cspm_policies(
    framework: Optional[str] = None,
    provider: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Policy Evaluator Catalogue: List CIS Benchmark & compliance framework rules."""
    try:
        query = select(CSPMPolicy)
        if framework and framework.upper() != "ALL":
            query = query.where(CSPMPolicy.framework.ilike(f"%{framework}%"))
        if provider and provider.upper() != "ALL":
            query = query.where(CSPMPolicy.provider == provider.upper())
        if severity and severity.upper() != "ALL":
            query = query.where(CSPMPolicy.severity == severity.upper())

        result = await db.execute(query)
        policies = result.scalars().all()

        if not policies:
            # Seed missing policies in DB
            for pol_data in DEFAULT_POLICIES:
                pol = CSPMPolicy(
                    id=pol_data["id"],
                    rule_id=pol_data.get("rule_id"),
                    title=pol_data.get("title", pol_data.get("name")),
                    description=pol_data.get("description"),
                    framework=pol_data.get("framework"),
                    section=pol_data.get("section"),
                    severity=pol_data.get("severity"),
                    provider=pol_data.get("provider"),
                    service=pol_data.get("service"),
                    enabled=pol_data.get("enabled", True),
                    auto_remediable=pol_data.get("auto_remediable", False),
                    remediation_steps=pol_data.get("remediation_steps"),
                )
                db.add(pol)
            await db.commit()
            result = await db.execute(query)
            policies = result.scalars().all()

        if search:
            s_lower = search.lower()
            policies = [
                p for p in policies
                if s_lower in p.title.lower()
                or (p.rule_id and s_lower in p.rule_id.lower())
                or (p.service and s_lower in p.service.lower())
                or (p.framework and s_lower in p.framework.lower())
            ]

        return policies
    except Exception:
        return []


@router.get("/policies/categories")
async def list_policy_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CSPMPolicy.framework))
    values = sorted({row for row in result.scalars().all() if row})
    return [{"id": item, "name": item} for item in values]


@router.get("/policies/{policy_id}", response_model=CSPMPolicyResponse)
async def get_cspm_policy(
    policy_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve details for a specific CSPM security evaluation policy rule."""
    try:
        query = select(CSPMPolicy).where((CSPMPolicy.id == policy_id) | (CSPMPolicy.rule_id == policy_id))
        result = await db.execute(query)
        policy = result.scalar_one_or_none()
        if policy:
            return policy
    except Exception:
        pass

    raise HTTPException(status_code=404, detail=f"Policy '{policy_id}' not found")


@router.put("/policies/{policy_id}", response_model=CSPMPolicyResponse)
@router.patch("/policies/{policy_id}/toggle", response_model=CSPMPolicyResponse)
async def update_policy_status(
    policy_id: str,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
):
    """Enable or disable a specific CSPM security evaluation policy rule."""
    enabled_val = payload.get("enabled")
    if enabled_val is None:
        raise HTTPException(status_code=400, detail="Missing 'enabled' field in payload")

    try:
        query = select(CSPMPolicy).where((CSPMPolicy.id == policy_id) | (CSPMPolicy.rule_id == policy_id))
        result = await db.execute(query)
        policy = result.scalar_one_or_none()

        if policy:
            policy.enabled = bool(enabled_val)
            await db.commit()
            await db.refresh(policy)
            return policy
    except Exception:
        pass

    raise HTTPException(status_code=404, detail=f"CSPM Policy '{policy_id}' not found")


@router.post("/policies/{policy_id}/playbook")
async def run_policy_playbook(policy_id: str, db: AsyncSession = Depends(get_db)):
    """Record a guided playbook run. Does not mutate the cloud account."""
    query = select(CSPMPolicy).where((CSPMPolicy.id == policy_id) | (CSPMPolicy.rule_id == policy_id))
    result = await db.execute(query)
    policy = result.scalar_one_or_none()
    action = GuidedAction(
        entity_type="policy_playbook",
        entity_id=policy_id,
        status="GUIDED",
        cloud_mutated=False,
        message=f"Guided playbook recorded for policy {getattr(policy, 'rule_id', policy_id)}. Cloud was not changed.",
    )
    db.add(action)
    await db.commit()
    await db.refresh(action)
    return {
        "status": "recorded",
        "policy_id": policy_id,
        "action_id": action.id,
        "cloudMutated": False,
        "message": action.message,
    }

