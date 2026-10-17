from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import ThreatFeedSync, VulnerabilityFeedItem, IOCMatch
from app.schemas.threats import (
    FeedSyncResponse,
    FeedSyncStatusItem,
    ThreatSummaryResponse,
)
from app.services.feed_ingestion import (
    fetch_cisa_kev_feed,
    fetch_first_epss_scores,
    fetch_nvd_cves,
    persist_feed_items,
)

router = APIRouter()


def _is_demo(request: Request) -> bool:
    return (request.headers.get("X-RiskTrix-Demo") or "").strip().lower() in ("1", "true", "yes")


async def _upsert_sync(db: AsyncSession, item: FeedSyncStatusItem):
    existing = (await db.execute(select(ThreatFeedSync).where(ThreatFeedSync.feed_name == item.feed_name))).scalar_one_or_none()
    if existing:
        existing.source_url = item.source_url
        existing.status = item.status
        existing.total_records = item.total_records
        existing.last_sync_time = item.last_sync_time
        existing.details = item.details
        return
    db.add(ThreatFeedSync(
        feed_name=item.feed_name,
        source_url=item.source_url,
        status=item.status,
        total_records=item.total_records,
        last_sync_time=item.last_sync_time,
        details=item.details,
    ))


@router.get("/ioc/check")
async def check_ioc(ioc_type: str, ioc_value: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Check an IOC against persisted matches only. No canned threat names."""
    key = (ioc_type or "").lower()
    if key in ("hash", "file"):
        key = "hashes"
    if key == "ip":
        key = "ips"
    if key == "domain":
        key = "domains"
    if key not in ("hashes", "ips", "domains", "cve"):
        return {"found": False, "error": "Invalid IOC type. Supported: hashes, ips, domains, cve"}

    result = await db.execute(
        select(IOCMatch).where(IOCMatch.ioc_type == key, IOCMatch.ioc_value == ioc_value)
    )
    match = result.scalars().first()
    if match and not _is_demo(request) and str(match.threat_name or "").startswith("DEMO:"):
        match = None
    if not match and key == "cve":
        cve = (await db.execute(select(VulnerabilityFeedItem).where(VulnerabilityFeedItem.cve_id == ioc_value))).scalar_one_or_none()
        if cve:
            return {
                "found": True,
                "ioc_type": ioc_type,
                "ioc_value": ioc_value,
                "threat_name": cve.summary or cve.cve_id,
                "confidence": 95 if cve.is_cisa_kev else 70,
            }
    if not match:
        return {"found": False, "ioc_type": ioc_type, "ioc_value": ioc_value}

    return {
        "found": True,
        "ioc_type": ioc_type,
        "ioc_value": ioc_value,
        "threat_name": match.threat_name,
        "confidence": match.confidence,
    }


@router.post("/feed/sync", response_model=FeedSyncResponse)
async def sync_threat_feeds(db: AsyncSession = Depends(get_db)):
    """Synchronize live feeds and persist the real SUCCESS/FAILED counts."""
    now = datetime.utcnow()
    feeds: List[FeedSyncStatusItem] = []

    nvd_records, nvd_error = await fetch_nvd_cves()
    nvd_status = "SUCCESS" if nvd_records else "FAILED"
    if nvd_records:
        await persist_feed_items(db, nvd_records, source="nvd")
    feeds.append(FeedSyncStatusItem(
        feed_name="NIST_NVD_V2",
        source_url="https://services.nvd.nist.gov/rest/json/cves/2.0",
        status=nvd_status,
        total_records=len(nvd_records),
        last_sync_time=now,
        details=f"Ingested {len(nvd_records)} NVD records." if nvd_records else (nvd_error or "NVD feed unavailable"),
    ))

    cisa_records = await fetch_cisa_kev_feed()
    cisa_status = "SUCCESS" if cisa_records else "FAILED"
    if cisa_records:
        await persist_feed_items(db, cisa_records, source="cisa")
    feeds.append(FeedSyncStatusItem(
        feed_name="CISA_KEV",
        source_url="https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
        status=cisa_status,
        total_records=len(cisa_records),
        last_sync_time=now,
        details=f"Ingested {len(cisa_records)} CISA KEV records." if cisa_records else "CISA KEV feed unavailable",
    ))

    cve_ids = [item.get("cve_id") or item.get("cveID") for item in (cisa_records or []) if item.get("cve_id") or item.get("cveID")]
    if not cve_ids:
        existing = (await db.execute(select(VulnerabilityFeedItem.cve_id))).scalars().all()
        cve_ids = existing[:20]
    epss_data = await fetch_first_epss_scores(cve_ids)
    epss_status = "SUCCESS" if epss_data else "FAILED"
    feeds.append(FeedSyncStatusItem(
        feed_name="FIRST_EPSS",
        source_url="https://api.first.org/data/v1/epss",
        status=epss_status,
        total_records=len(epss_data),
        last_sync_time=now,
        details=f"Ingested {len(epss_data)} EPSS scores." if epss_data else "FIRST EPSS feed unavailable",
    ))

    for item in feeds:
        await _upsert_sync(db, item)
    await db.commit()

    success_count = len([item for item in feeds if item.status == "SUCCESS"])
    message = (
        f"{success_count} of {len(feeds)} threat feeds synchronized."
        if success_count
        else "All threat feeds failed. Showing last persisted status only."
    )
    return FeedSyncResponse(message=message, synced_feeds_count=success_count, feeds=feeds)


@router.get("/feed/status", response_model=List[FeedSyncStatusItem])
async def get_feed_status(db: AsyncSession = Depends(get_db)):
    """Return persisted sync rows. Never invent SUCCESS counts."""
    result = await db.execute(select(ThreatFeedSync))
    syncs = result.scalars().all()
    if syncs:
        return [FeedSyncStatusItem.model_validate(s) for s in syncs]
    now = datetime.utcnow()
    return [
        FeedSyncStatusItem(
            feed_name=name,
            source_url=url,
            status="NEVER_SYNCED",
            total_records=0,
            last_sync_time=now,
            details="No successful sync has been recorded.",
        )
        for name, url in (
            ("NIST_NVD_V2", "https://services.nvd.nist.gov/rest/json/cves/2.0"),
            ("CISA_KEV", "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"),
            ("FIRST_EPSS", "https://api.first.org/data/v1/epss"),
        )
    ]


@router.get("/findings")
async def list_threat_findings(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow().isoformat()
    findings = []
    result = await db.execute(select(VulnerabilityFeedItem))
    for item in result.scalars().all():
        findings.append({
            "id": item.cve_id,
            "ioc_type": "cve",
            "ioc_value": item.cve_id,
            "threat_name": item.summary or item.cve_id,
            "confidence": 95 if getattr(item, "is_cisa_kev", False) else 70,
            "matched_at": (item.published_date or datetime.utcnow()).isoformat() if hasattr(item, "published_date") else now,
            "severity": item.severity,
            "is_cisa_kev": getattr(item, "is_cisa_kev", False),
            "epss_score": getattr(item, "epss_score", 0),
        })
    return {"findings": findings, "total": len(findings)}


@router.get("/summary", response_model=ThreatSummaryResponse)
async def get_threat_summary(db: AsyncSession = Depends(get_db)):
    items = (await db.execute(select(VulnerabilityFeedItem))).scalars().all()
    last_sync = (await db.execute(select(ThreatFeedSync))).scalars().first()
    return ThreatSummaryResponse(
        total_tracked_cves=len(items),
        cisa_kev_active_count=len([v for v in items if v.is_cisa_kev]),
        high_epss_exploits_count=len([v for v in items if (v.epss_score or 0) >= 0.50]),
        critical_cves_count=len([v for v in items if v.severity == "CRITICAL"]),
        last_feed_sync_time=last_sync.last_sync_time if last_sync and last_sync.last_sync_time else datetime.utcnow(),
    )
