from sqlalchemy.orm import Session
from typing import Optional
from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentUpdate


def create_agent(db: Session, data: AgentCreate) -> Agent:
    agent = Agent(**data.model_dump())
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


def get_all_agents(db: Session, team: Optional[str] = None, tier: Optional[str] = None, active_only: bool = True):
    q = db.query(Agent)
    if active_only:
        q = q.filter(Agent.is_active == True)
    if team:
        q = q.filter(Agent.team == team)
    if tier:
        q = q.filter(Agent.tier == tier)
    return q.order_by(Agent.name).all()


def get_agent_by_id(db: Session, agent_id: int) -> Optional[Agent]:
    return db.query(Agent).filter(Agent.id == agent_id).first()


def get_agent_by_email(db: Session, email: str) -> Optional[Agent]:
    return db.query(Agent).filter(Agent.email == email).first()


def update_agent(db: Session, agent_id: int, data: AgentUpdate) -> Optional[Agent]:
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(agent, k, v)
    db.commit()
    db.refresh(agent)
    return agent


def delete_agent(db: Session, agent_id: int) -> bool:
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        return False
    db.delete(agent)
    db.commit()
    return True


def get_agents_for_autoassign(db: Session, team: str, tier: str) -> list[Agent]:
    """
    Called by AutoAssign engine via HTTP.
    Returns active agents for a given team + tier.
    """
    return (
        db.query(Agent)
        .filter(
            Agent.is_active == True,
            Agent.team == team,
            Agent.tier == tier,
        )
        .all()
    )
