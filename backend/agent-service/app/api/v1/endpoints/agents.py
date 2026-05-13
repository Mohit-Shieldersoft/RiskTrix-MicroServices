from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.models.models import Agent, ScanRequest
from app.schemas.schemas import AgentCreate, Agent as AgentSchema, Heartbeat
from app.services.agent_service import create_agent, get_agent_by_id, update_agent_heartbeat
from app.db.database import get_db
import uuid
from datetime import datetime

router = APIRouter()

@router.post("/register", response_model=dict)
async def register_agent(agent: AgentCreate, db: AsyncSession = Depends(get_db)):
    """Register a new agent"""
    try:
        # Create agent in database
        db_agent = await create_agent(db, agent)

        # Generate JWT token (simplified for now)
        jwt_token = f"agent-{db_agent.id}"

        return {
            "agent_id": str(db_agent.id),
            "jwt_token": jwt_token,
            "status": "registered"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/{agent_id}/heartbeat")
async def heartbeat(agent_id: str, heartbeat: Heartbeat, db: AsyncSession = Depends(get_db)):
    """Receive heartbeat from agent"""
    try:
        agent = await update_agent_heartbeat(db, agent_id, heartbeat)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Heartbeat failed: {str(e)}")

@router.get("/", response_model=list[AgentSchema])
async def list_agents(db: AsyncSession = Depends(get_db)):
    """Get all registered agents"""
    try:
        result = await db.execute(select(Agent))
        agents = result.scalars().all()
        # Convert SQLAlchemy objects to Pydantic models with proper UUID conversion
        return [
            AgentSchema(
                id=str(agent.id),
                hostname=agent.hostname,
                os=agent.os,
                arch=agent.arch,
                ip_address=agent.ip_address,
                agent_version=agent.agent_version,
                status=agent.status,
                last_heartbeat=agent.last_heartbeat,
                registered_at=agent.registered_at
            )
            for agent in agents
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agents: {str(e)}")

@router.get("/{agent_id}", response_model=AgentSchema)
async def get_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    """Get agent by ID"""
    try:
        agent = await get_agent_by_id(db, agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        return agent
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agent: {str(e)}")

@router.patch("/{agent_id}/status")
async def update_agent_status(agent_id: str, status: str, db: AsyncSession = Depends(get_db)):
    """Update agent status"""
    try:
        agent = await get_agent_by_id(db, agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        agent.status = status
        await db.commit()
        await db.refresh(agent)

        return {"status": "updated", "agent_id": agent_id, "new_status": status}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")

@router.post("/{agent_id}/scan")
async def request_scan(agent_id: str, db: AsyncSession = Depends(get_db)):
    """Request a manual scan for an agent"""
    try:
        # Verify agent exists
        agent = await get_agent_by_id(db, agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Create scan request
        scan_request = ScanRequest(
            agent_id=uuid.UUID(agent_id),
            status="pending",
            scan_type="full"
        )
        db.add(scan_request)
        await db.commit()
        await db.refresh(scan_request)

        return {
            "status": "requested",
            "scan_request_id": str(scan_request.id),
            "agent_id": agent_id,
            "requested_at": scan_request.requested_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to request scan: {str(e)}")

@router.get("/{agent_id}/pending-scans")
async def get_pending_scans(agent_id: str, db: AsyncSession = Depends(get_db)):
    """Get pending scan requests for an agent (used by agent polling)"""
    try:
        result = await db.execute(
            select(ScanRequest)
            .where(ScanRequest.agent_id == uuid.UUID(agent_id))
            .where(ScanRequest.status == "pending")
            .order_by(ScanRequest.requested_at.desc())
        )
        pending_scans = result.scalars().all()

        return {
            "pending_scans": [
                {
                    "id": str(scan.id),
                    "agent_id": str(scan.agent_id),
                    "requested_at": scan.requested_at.isoformat(),
                    "scan_type": scan.scan_type
                }
                for scan in pending_scans
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch pending scans: {str(e)}")

@router.patch("/scan/{scan_request_id}/complete")
async def complete_scan_request(scan_request_id: str, db: AsyncSession = Depends(get_db)):
    """Mark a scan request as completed (called by agent after scan)"""
    try:
        scan_request = await db.get(ScanRequest, uuid.UUID(scan_request_id))
        if not scan_request:
            raise HTTPException(status_code=404, detail="Scan request not found")

        scan_request.status = "completed"
        scan_request.completed_at = datetime.utcnow()
        await db.commit()

        return {"status": "completed", "scan_request_id": scan_request_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete scan request: {str(e)}")