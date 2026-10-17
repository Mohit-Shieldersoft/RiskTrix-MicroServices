from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import ScanJob
from app.services.cspm_engine import cspm_engine

router = APIRouter()


@router.post("/scan")
async def trigger_cspm_scan(
    account_id: Optional[str] = None,
    provider: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Run a CNAPP-style posture scan against discovered assets."""
    return await cspm_engine.run_scan(db, account_id=account_id, provider=provider)


@router.get("/scan-jobs")
async def list_scan_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScanJob).order_by(ScanJob.started_at.desc()))
    jobs = result.scalars().all()
    return [
        {
            "id": job.id,
            "account_id": job.account_id,
            "provider": job.provider,
            "status": job.status,
            "total_assets": job.total_assets,
            "findings_created": job.findings_created,
            "started_at": job.started_at,
            "completed_at": job.completed_at,
        }
        for job in jobs
    ]


@router.get("/scan-jobs/{job_id}")
async def get_scan_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScanJob).where(ScanJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        return {"id": job_id, "status": "NOT_FOUND"}
    return {
        "id": job.id,
        "status": job.status,
        "total_assets": job.total_assets,
        "findings_created": job.findings_created,
        "details": job.details,
        "started_at": job.started_at,
        "completed_at": job.completed_at,
    }
