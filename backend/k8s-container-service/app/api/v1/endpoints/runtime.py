import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import RuntimeThreat, RuntimeEvent
from app.services.demo_scope import is_demo_request, in_scope

router = APIRouter()


@router.post("/runtime/ingest")
async def ingest_runtime_threats(db: AsyncSession = Depends(get_db)):
    """Pull runtime findings from GuardDuty when credentials exist. Never invents a finding."""
    ingested = await _ingest_guardduty(db)
    if ingested:
        await db.commit()
    return {
        "ingested": len(ingested),
        "threats": [_threat_payload(t) for t in ingested],
        "message": None if ingested else "No live runtime feed configured. Connect AWS/Azure/GCP credentials.",
    }


@router.post("/runtime/demo/provision")
async def provision_demo_runtime(request: Request, db: AsyncSession = Depends(get_db)):
    if not is_demo_request(request):
        raise HTTPException(status_code=403, detail="Demo runtime data is only available to the demo account.")
    existing = (await db.execute(select(RuntimeThreat).where(RuntimeThreat.id == "DEMO-gd-001"))).scalar_one_or_none()
    if not existing:
        db.add(RuntimeThreat(
            id="DEMO-gd-001",
            provider="AWS",
            title="Demo GuardDuty: unauthorized API call from unusual geolocation",
            severity="HIGH",
            status="OPEN",
            source="GuardDuty-demo",
            resource_id="i-demo0a891f4c28e9",
            description="Sample runtime finding for the demo account only.",
        ))
        await db.commit()
    return {"status": "ready", "mode": "demo"}


@router.get("/runtime/stats")
async def runtime_stats(request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RuntimeThreat))
    threats = [row for row in result.scalars().all() if in_scope(row.id, is_demo_request(request))]
    return {
        "total": len(threats),
        "open": len([t for t in threats if t.status == "OPEN"]),
        "critical": len([t for t in threats if t.severity == "CRITICAL"]),
        "high": len([t for t in threats if t.severity == "HIGH"]),
    }


@router.get("/runtime/threats")
async def list_runtime_threats(request: Request, status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(RuntimeThreat)
    if status:
        query = query.where(RuntimeThreat.status == status.upper())
    result = await db.execute(query)
    demo = is_demo_request(request)
    return [_threat_payload(t) for t in result.scalars().all() if in_scope(t.id, demo)]


@router.get("/runtime/threats/{threat_id}")
async def get_runtime_threat(threat_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RuntimeThreat).where(RuntimeThreat.id == threat_id))
    threat = result.scalar_one_or_none()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
    return _threat_payload(threat)


@router.patch("/runtime/threats/{threat_id}/status")
async def update_runtime_threat(threat_id: str, status: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RuntimeThreat).where(RuntimeThreat.id == threat_id))
    threat = result.scalar_one_or_none()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
    threat.status = status.upper()
    await db.commit()
    return _threat_payload(threat)


@router.get("/runtime/events")
async def list_runtime_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RuntimeEvent))
    return [
        {
            "id": event.id,
            "threat_id": event.threat_id,
            "event_type": event.event_type,
            "message": event.message,
            "created_at": event.created_at,
        }
        for event in result.scalars().all()
    ]


def _threat_payload(threat: RuntimeThreat) -> dict:
    return {
        "id": threat.id,
        "provider": threat.provider,
        "title": threat.title,
        "severity": threat.severity,
        "status": threat.status,
        "source": threat.source,
        "resource_id": threat.resource_id,
        "description": threat.description,
        "created_at": threat.created_at,
    }


async def _ingest_guardduty(db: AsyncSession):
    threats = []
    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    if not access_key or not secret_key:
        return threats
    try:
        import boto3
        client = boto3.client(
            "guardduty",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=os.getenv("AWS_REGION", "us-east-1"),
        )
        detectors = client.list_detectors().get("DetectorIds", [])
        for detector_id in detectors[:1]:
            findings = client.list_findings(DetectorId=detector_id, MaxResults=20).get("FindingIds", [])
            if not findings:
                continue
            details = client.get_findings(DetectorId=detector_id, FindingIds=findings).get("Findings", [])
            for finding in details:
                threat = RuntimeThreat(
                    id=finding.get("Id", str(uuid.uuid4()))[:36],
                    provider="AWS",
                    title=finding.get("Title") or finding.get("Type", "GuardDuty finding"),
                    severity="CRITICAL" if (finding.get("Severity") or 0) >= 7 else "HIGH",
                    status="OPEN",
                    source="GuardDuty",
                    resource_id=str((finding.get("Resource") or {}).get("ResourceType")),
                    description=finding.get("Description"),
                )
                db.add(threat)
                db.add(RuntimeEvent(
                    id=str(uuid.uuid4()),
                    threat_id=threat.id,
                    event_type=finding.get("Type", "GuardDuty"),
                    message=finding.get("Description"),
                ))
                threats.append(threat)
    except Exception:
        return threats
    return threats
