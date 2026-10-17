from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import IAMIdentity, IAMGraphEdge
from app.schemas.ciem import IAMGraphNode, IAMGraphLink, IAMGraphTopologyResponse
from app.services.iam_graph_engine import iam_graph_engine

router = APIRouter()


@router.get("/graph", response_model=IAMGraphTopologyResponse)
async def get_iam_identity_graph(db: AsyncSession = Depends(get_db)):
    """IAM graph from persisted identities/edges, falling back to the in-memory engine after sync."""
    identities = (await db.execute(select(IAMIdentity))).scalars().all()
    edges = (await db.execute(select(IAMGraphEdge))).scalars().all()
    if identities:
        nodes = [
            IAMGraphNode(
                id=item.id,
                label=f"{item.name} ({item.type})",
                type=item.type,
                provider=item.provider,
                risk_score=item.privilege_risk_score or 0.0,
                is_dormant=bool(item.is_dormant),
            )
            for item in identities
        ]
        links = [
            IAMGraphLink(
                source=edge.source,
                target=edge.target,
                relationship=edge.relationship,
                is_escalation_path=bool(edge.is_escalation_path),
            )
            for edge in edges
        ]
        return IAMGraphTopologyResponse(
            nodes=nodes,
            links=links,
            privilege_escalation_paths_count=len([link for link in links if link.is_escalation_path]),
        )
    return iam_graph_engine.get_topology()


@router.get("/search")
async def search_identities(q: str, db: AsyncSession = Depends(get_db)):
    term = f"%{q}%"
    result = await db.execute(select(IAMIdentity).where(IAMIdentity.name.ilike(term)))
    return [
        {"type": "ciem", "id": item.id, "title": item.name, "url": "/ciem", "provider": item.provider}
        for item in result.scalars().all()[:10]
    ]
