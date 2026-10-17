from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import CloudAccount, CloudAsset, CSPMFinding

router = APIRouter()


@router.get("/dashboard")
@router.get("/dashboard/stats")
async def cloud_dashboard(db: AsyncSession = Depends(get_db)):
    accounts = (await db.execute(select(CloudAccount))).scalars().all()
    assets = (await db.execute(select(CloudAsset))).scalars().all()
    findings = (await db.execute(select(CSPMFinding))).scalars().all()
    open_findings = [f for f in findings if f.status == "OPEN"]
    return {
        "accounts": len(accounts),
        "assets": len(assets),
        "findings": len(open_findings),
        "critical": len([f for f in open_findings if f.severity == "CRITICAL"]),
        "high": len([f for f in open_findings if f.severity == "HIGH"]),
        "provider_breakdown": {
            provider: len([a for a in accounts if a.provider == provider])
            for provider in ("AWS", "AZURE", "GCP")
        },
    }


@router.get("/dashboard/top-risks")
async def top_risks(db: AsyncSession = Depends(get_db)):
    findings = (await db.execute(select(CSPMFinding).where(CSPMFinding.status == "OPEN"))).scalars().all()
    ordered = sorted(findings, key=lambda f: {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}.get(f.severity, 9))
    return [
        {"id": f.id, "title": f.title, "severity": f.severity, "asset_name": f.asset_name}
        for f in ordered[:10]
    ]


@router.get("/dashboard/recent-activity")
async def recent_activity(db: AsyncSession = Depends(get_db)):
    findings = (await db.execute(select(CSPMFinding))).scalars().all()
    return [
        {"id": f.id, "title": f.title, "status": f.status, "created_at": f.created_at}
        for f in findings[:15]
    ]


@router.get("/dashboard/risk-distribution")
async def risk_distribution(db: AsyncSession = Depends(get_db)):
    findings = (await db.execute(select(CSPMFinding).where(CSPMFinding.status == "OPEN"))).scalars().all()
    return {
        severity: len([f for f in findings if f.severity == severity])
        for severity in ("CRITICAL", "HIGH", "MEDIUM", "LOW")
    }
