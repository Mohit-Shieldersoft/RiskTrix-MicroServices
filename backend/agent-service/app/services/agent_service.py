# Agent service functions

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Agent
from app.schemas.schemas import AgentCreate, Heartbeat
import uuid
from datetime import datetime

async def create_agent(db: AsyncSession, agent: AgentCreate):
    """Create a new agent"""
    db_agent = Agent(
        id=uuid.uuid4(),
        hostname=agent.hostname,
        ip_address=agent.ip_address,
        os=agent.os,
        arch=agent.arch,
        agent_version=agent.agent_version,
        status="active",
        last_heartbeat=datetime.utcnow()
    )
    db.add(db_agent)
    await db.commit()
    await db.refresh(db_agent)
    return db_agent

async def get_agent_by_id(db: AsyncSession, agent_id: str):
    """Get agent by ID"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    return result.scalar_one_or_none()

async def update_agent_heartbeat(db: AsyncSession, agent_id: str, heartbeat: Heartbeat):
    """Update agent heartbeat"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()

    if agent:
        agent.last_heartbeat = datetime.utcnow()
        agent.status = heartbeat.status
        await db.commit()
        await db.refresh(agent)

    return agent