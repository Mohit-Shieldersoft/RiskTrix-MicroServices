from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import SessionLocal
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse, AgentLookup
from app.services.agent_service import (
    create_agent, get_all_agents, get_agent_by_id,
    get_agent_by_email, update_agent, delete_agent,
    get_agents_for_autoassign,
)

router = APIRouter(prefix="/directory", tags=["Directory"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/agents", response_model=AgentResponse, status_code=201)
def add_agent(data: AgentCreate, db: Session = Depends(get_db)):
    """Register a new agent in the directory."""
    existing = get_agent_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=409, detail="Agent with this email already exists")
    return create_agent(db, data)


@router.get("/agents", response_model=list[AgentResponse])
def list_agents(
    team: Optional[str] = Query(default=None),
    tier: Optional[str] = Query(default=None),
    active_only: bool = Query(default=True),
    db: Session = Depends(get_db),
):
    """List all agents, optionally filtered by team/tier."""
    return get_all_agents(db, team, tier, active_only)


@router.get("/agents/lookup", response_model=list[AgentLookup])
def lookup_agents(
    team: str = Query(...),
    tier: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Used by AutoAssign engine — returns active agents for a team+tier.
    GET /directory/agents/lookup?team=security&tier=senior
    """
    return get_agents_for_autoassign(db, team, tier)


@router.get("/agents/by-email", response_model=AgentResponse)
def get_agent_by_email_route(
    email: str = Query(..., description="Agent email address"),
    db: Session = Depends(get_db),
):
    """Look up a single agent by email. Used by ticket-service to resolve agent_id for metrics."""
    agent = get_agent_by_email(db, email)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent with email '{email}' not found")
    return agent


@router.get("/agents/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = get_agent_by_id(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.patch("/agents/{agent_id}", response_model=AgentResponse)
def update(agent_id: int, data: AgentUpdate, db: Session = Depends(get_db)):
    agent = update_agent(db, agent_id, data)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.delete("/agents/{agent_id}")
def remove_agent(agent_id: int, db: Session = Depends(get_db)):
    success = delete_agent(db, agent_id)
    if not success:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"success": True, "detail": f"Agent {agent_id} removed"}
