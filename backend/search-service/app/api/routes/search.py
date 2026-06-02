from fastapi import APIRouter, Query, HTTPException

from app.schemas.search import SearchResponse, TicketResult, AssetResult, AgentResult, PolicyResult
from app.services.search_service import (
    unified_search,
    search_tickets,
    search_assets,
    search_agents,
    search_policies,
)

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=SearchResponse)
def search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(default=20, ge=1, le=100),
):
    """
    Unified search across tickets, assets, agents, and policies.
    """
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return unified_search(q.strip(), limit)


@router.get("/tickets", response_model=list[TicketResult])
def search_tickets_only(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    """Search tickets only."""
    return search_tickets(q.strip(), limit)


@router.get("/assets", response_model=list[AssetResult])
def search_assets_only(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    """Search assets only."""
    return search_assets(q.strip(), limit)


@router.get("/agents", response_model=list[AgentResult])
def search_agents_only(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    """Search directory agents only."""
    return search_agents(q.strip(), limit)


@router.get("/policies", response_model=list[PolicyResult])
def search_policies_only(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    """Search policies only."""
    return search_policies(q.strip(), limit)
