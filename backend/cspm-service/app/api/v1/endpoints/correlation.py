from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import GuidedAction
from app.services.correlation_engine import build_toxic_combinations
from app.services.demo_scope import is_demo_request

router = APIRouter()


class ToxicPillarBreakdown(BaseModel):
    cspm_misconfig_score: float = Field(..., description="CSPM Misconfiguration Weight (0.0 - 1.0)")
    cve_severity_score: float = Field(..., description="CVE Vulnerability Severity Multiplier (0.0 - 1.0)")
    ciem_privilege_score: float = Field(..., description="CIEM Over-Privileged IAM Role Multiplier (0.0 - 1.0)")
    internet_reachability_score: float = Field(..., description="Internet Exposure & Network Reachability Multiplier (0.0 - 1.0)")


class ToxicCombinationItem(BaseModel):
    id: str
    asset_name: str
    asset_type: str
    provider: str
    account_id: str
    region: str
    toxic_score: float
    risk_level: str
    pillars: ToxicPillarBreakdown
    cspm_finding_summary: str
    cve_id: Optional[str] = None
    cve_summary: Optional[str] = None
    ciem_role_arn: Optional[str] = None
    internet_exposure: str
    remediation_status: str = "OPEN"
    created_at: str


class ScoreBreakdownResponse(BaseModel):
    total_toxic_combinations: int
    critical_toxic_count: int
    high_toxic_count: int
    average_toxic_score: float
    provider_breakdown: Dict[str, int]
    pillar_multiplier_weights: Dict[str, float]


async def _load_toxic(db: AsyncSession, demo: bool) -> List[Dict[str, Any]]:
    items = await build_toxic_combinations(db, demo=demo)
    actions = (await db.execute(select(GuidedAction).where(GuidedAction.entity_type == "toxic"))).scalars().all()
    remediated = {row.entity_id for row in actions}
    for item in items:
        if item["id"] in remediated:
            item["remediation_status"] = "REMEDIATED"
            item["toxic_score"] = min(item.get("toxic_score") or 0, 12.0)
            item["risk_level"] = "LOW"
    return items


@router.get("/correlation/toxic-combinations", response_model=List[ToxicCombinationItem])
async def list_toxic_combinations(request: Request, db: AsyncSession = Depends(get_db)):
    """Live toxic combinations only. Empty when the scoped account set has no correlated risk."""
    return await _load_toxic(db, is_demo_request(request))


@router.get("/correlation/score-breakdown", response_model=ScoreBreakdownResponse)
async def get_toxic_score_breakdown(request: Request, db: AsyncSession = Depends(get_db)):
    items = await _load_toxic(db, is_demo_request(request))
    total_count = len(items)
    critical_count = len([item for item in items if item["risk_level"] == "TOXIC_CRITICAL"])
    high_count = len([item for item in items if item["risk_level"] == "HIGH"])
    avg_score = sum(item["toxic_score"] for item in items) / total_count if total_count else 0.0
    provider_map: Dict[str, int] = {}
    for item in items:
        provider_map[item["provider"]] = provider_map.get(item["provider"], 0) + 1
    return ScoreBreakdownResponse(
        total_toxic_combinations=total_count,
        critical_toxic_count=critical_count,
        high_toxic_count=high_count,
        average_toxic_score=round(avg_score, 1),
        provider_breakdown=provider_map,
        pillar_multiplier_weights={
            "CSPM_MISCONFIG_WEIGHT": 0.95,
            "CVE_SEVERITY_WEIGHT": 0.98,
            "CIEM_OVERPRIVILEGE_WEIGHT": 0.96,
            "INTERNET_REACHABILITY_WEIGHT": 1.00,
        },
    )


@router.post("/correlation/remediate/{toxic_id}")
async def remediate_toxic_combination(toxic_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    items = await _load_toxic(db, is_demo_request(request))
    item = next((row for row in items if row["id"] == toxic_id), None)
    if not item:
        raise HTTPException(status_code=404, detail=f"Toxic combination {toxic_id} not found.")
    existing = (await db.execute(
        select(GuidedAction).where(GuidedAction.entity_type == "toxic", GuidedAction.entity_id == toxic_id)
    )).scalar_one_or_none()
    if not existing:
        db.add(GuidedAction(
            entity_type="toxic",
            entity_id=toxic_id,
            status="GUIDED",
            cloud_mutated=False,
            message=f"Guided choke-point recorded for {item['asset_name']}. No cloud API mutation performed.",
        ))
        await db.commit()
    return {
        "status": "GUIDED",
        "toxic_id": toxic_id,
        "cloudMutated": False,
        "message": f"Guided remediation recorded for {item['asset_name']}. Cloud resources were not changed.",
        "new_toxic_score": 12.0,
        "risk_reduction": "guided",
    }
