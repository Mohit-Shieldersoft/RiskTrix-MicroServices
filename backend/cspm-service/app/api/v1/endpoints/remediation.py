from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import CSPMFinding, CSPMPolicy
from app.services.remediation_catalog import get_remediation

router = APIRouter()


@router.get("/remediation/finding/{finding_id}")
async def remediation_for_finding(finding_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CSPMFinding).where(CSPMFinding.id == finding_id))
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    payload = get_remediation(finding.policy_id, finding.remediation_playbook)
    payload["finding_id"] = finding.id
    payload["title"] = finding.title
    return payload


@router.get("/remediation/policy/{policy_code}")
async def remediation_for_policy(policy_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CSPMPolicy).where((CSPMPolicy.id == policy_code) | (CSPMPolicy.rule_id == policy_code))
    )
    policy = result.scalar_one_or_none()
    playbook = policy.remediation_steps if policy else None
    return get_remediation(policy.id if policy else policy_code, playbook)
