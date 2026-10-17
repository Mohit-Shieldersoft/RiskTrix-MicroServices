from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import VulnerabilityFeedItem
from app.schemas.threats import (
    CVELookupRequest,
    CVELookupResponse,
    CVEItemResponse,
)
from app.services.feed_ingestion import SEED_VULNERABILITIES
from app.services.threat_sync_service import threat_sync_service

router = APIRouter()


@router.get("/list", response_model=List[CVEItemResponse])
@router.get("/findings", response_model=List[CVEItemResponse])
async def list_all_cve_findings(
    severity: Optional[str] = None,
    product: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all CVE vulnerability findings across cloud workloads, operating systems, and packages."""
    try:
        query = select(VulnerabilityFeedItem)
        if severity and severity.upper() != "ALL":
            query = query.where(VulnerabilityFeedItem.severity == severity.upper())
        if product and product.upper() != "ALL":
            query = query.where(VulnerabilityFeedItem.product.ilike(f"%{product}%"))
        result = await db.execute(query)
        items = result.scalars().all()
        return [CVEItemResponse.model_validate(i) for i in items]
    except Exception:
        return []


@router.post("/lookup", response_model=CVELookupResponse)
async def lookup_cve(
    lookup_data: CVELookupRequest,
    db: AsyncSession = Depends(get_db),
):
    """NIST NVD API v2.0 + CISA KEV + FIRST EPSS lookup engine."""
    cve_id = lookup_data.cve_id
    binary_name = lookup_data.binary_name

    try:
        query = select(VulnerabilityFeedItem)
        if cve_id:
            query = query.where(VulnerabilityFeedItem.cve_id.ilike(f"%{cve_id}%"))
        elif binary_name:
            query = query.where(VulnerabilityFeedItem.product.ilike(f"%{binary_name}%"))

        result = await db.execute(query)
        items = result.scalars().all()

        if cve_id:
            items = [i for i in items if cve_id.lower() in i.cve_id.lower()]
        elif binary_name:
            items = [i for i in items if binary_name.lower() in (i.product or "").lower() or binary_name.lower() in (i.summary or "").lower()]

        cve_responses = [CVEItemResponse.model_validate(i) for i in items]
        return CVELookupResponse(
            total_found=len(cve_responses),
            cves=cve_responses,
            source="database",
            nvd_queried=False,
            message=None if cve_responses else "No matching CVE in the local database. NVD was not queried.",
        )
    except Exception:
        return CVELookupResponse(
            total_found=0,
            cves=[],
            source="database",
            nvd_queried=False,
            message="CVE lookup failed against the local database. NVD was not queried.",
        )


@router.post("/sync", status_code=status.HTTP_200_OK)
async def trigger_cve_feed_sync(
    db: AsyncSession = Depends(get_db),
):
    """Trigger live synchronization of NIST NVD v2.0 API, CISA KEV catalog, and FIRST EPSS probability scores."""
    res = await threat_sync_service.run_sync(db=db)
    return res


@router.get("/kev/list", response_model=List[CVEItemResponse])
async def list_cisa_kev_vulnerabilities(db: AsyncSession = Depends(get_db)):
    """Fetch active CISA Known Exploited Vulnerabilities (KEV)."""
    try:
        query = select(VulnerabilityFeedItem).where(VulnerabilityFeedItem.is_cisa_kev == True)
        result = await db.execute(query)
        items = result.scalars().all()
        return [CVEItemResponse.model_validate(i) for i in items if i.is_cisa_kev]
    except Exception:
        return []


@router.get("/epss/top", response_model=List[CVEItemResponse])
async def list_top_epss_exploits(
    min_epss: float = Query(0.50, description="Minimum EPSS probability score threshold"),
    db: AsyncSession = Depends(get_db),
):
    """Fetch top vulnerabilities ranked by FIRST Exploit Prediction Scoring System (EPSS) probability score."""
    try:
        query = select(VulnerabilityFeedItem).where(VulnerabilityFeedItem.epss_score >= min_epss).order_by(VulnerabilityFeedItem.epss_score.desc())
        result = await db.execute(query)
        items = result.scalars().all()
        return [CVEItemResponse.model_validate(i) for i in items if i.epss_score >= min_epss]
    except Exception:
        return []


@router.get("/{cve_id}", response_model=CVEItemResponse)
async def get_cve_details(
    cve_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get single CVE details enriched with NVD v2.0, CISA KEV, and FIRST EPSS."""
    try:
        query = select(VulnerabilityFeedItem).where(VulnerabilityFeedItem.cve_id == cve_id.upper())
        result = await db.execute(query)
        item = result.scalars().first()
        if not item:
            raise HTTPException(status_code=404, detail="CVE not found")
        return CVEItemResponse.model_validate(item)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))