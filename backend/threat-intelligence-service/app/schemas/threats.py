from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CVELookupRequest(BaseModel):
    cve_id: Optional[str] = None
    binary_name: Optional[str] = None
    version: Optional[str] = None
    vendor: Optional[str] = None


class CVEItemResponse(BaseModel):
    cve_id: str
    summary: str
    cvss_v3_score: float
    severity: str
    is_cisa_kev: bool
    kev_date_added: Optional[str] = None
    kev_required_action: Optional[str] = None
    kev_due_date: Optional[str] = None
    epss_score: float
    epss_percentile: float
    cwe_id: Optional[str] = None
    vendor_project: Optional[str] = None
    product: Optional[str] = None
    published_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class CVELookupResponse(BaseModel):
    total_found: int
    cves: List[CVEItemResponse]
    source: str = "database"
    nvd_queried: bool = False
    message: Optional[str] = None


class FeedSyncStatusItem(BaseModel):
    feed_name: str
    source_url: str
    status: str
    total_records: int
    last_sync_time: datetime
    details: Optional[str] = None

    class Config:
        from_attributes = True


class FeedSyncResponse(BaseModel):
    message: str
    synced_feeds_count: int
    feeds: List[FeedSyncStatusItem]


class ThreatSummaryResponse(BaseModel):
    total_tracked_cves: int
    cisa_kev_active_count: int
    high_epss_exploits_count: int  # EPSS > 0.50
    critical_cves_count: int
    last_feed_sync_time: datetime
