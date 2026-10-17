from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import Agent

router = APIRouter()


def _serialize_agent(agent: Agent) -> dict:
    return {
        "id": str(agent.id),
        "hostname": agent.hostname,
        "os": agent.os,
        "os_version": agent.os_version,
        "ip_address": agent.ip_address,
        "status": agent.status,
        "last_heartbeat": agent.last_heartbeat.isoformat() if agent.last_heartbeat else None,
        "last_scan_at": agent.last_scan_at.isoformat() if agent.last_scan_at else None,
    }


@router.get("/")
async def list_endpoints(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).order_by(Agent.registered_at.desc()))
    agents = result.scalars().all()
    return {"endpoints": [_serialize_agent(a) for a in agents], "count": len(agents)}


@router.get("/{endpoint_id}/summary")
async def get_endpoint_summary(endpoint_id: str, db: AsyncSession = Depends(get_db)):
    agent = await db.get(Agent, endpoint_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Endpoint agent not found")
    return {
        "summary": _serialize_agent(agent),
        "risk_score": None,
        "message": "Counts come from the agents table. No invented risk numbers.",
    }


@router.get("/{endpoint_id}/risk-score")
async def get_endpoint_risk_score(endpoint_id: str, db: AsyncSession = Depends(get_db)):
    agent = await db.get(Agent, endpoint_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Endpoint agent not found")
    return {
        "endpoint_id": endpoint_id,
        "risk_score": None,
        "risk_level": None,
        "factors": {},
        "message": "Risk score is unavailable until real scan results exist.",
    }
