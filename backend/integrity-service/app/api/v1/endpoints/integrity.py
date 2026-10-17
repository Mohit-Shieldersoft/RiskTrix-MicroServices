from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.integrity_service import fim_service

router = APIRouter()


@router.post("/baseline")
async def store_baseline(
    baseline_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """Store or update file integrity SHA-256 baseline hash."""
    res = await fim_service.store_baseline(db, baseline_data)
    return res


@router.post("/check")
async def check_integrity(
    check_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """Compare current file SHA-256 hash against stored baseline and detect unauthorized modifications."""
    res = await fim_service.check_integrity(db, check_data)
    return res


@router.get("/events")
async def get_integrity_events(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Fetch persistent file integrity monitoring (FIM) violation events."""
    events = await fim_service.get_events(db, limit)
    return {"events": events, "total_events": len(events)}


@router.get("/{endpoint_id}")
async def get_endpoint_integrity(
    endpoint_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get file integrity status and violation count for a specific endpoint daemon."""
    events = await fim_service.get_events(db, limit=100)
    endpoint_events = [e for e in events if e.get("agent_id") == endpoint_id]
    return {
        "endpoint_id": endpoint_id,
        "status": "CRITICAL" if len(endpoint_events) > 0 else "HEALTHY",
        "violations_count": len(endpoint_events),
        "events": endpoint_events
    }