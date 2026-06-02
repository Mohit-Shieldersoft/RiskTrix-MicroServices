"""
Search Service — queries ticket and asset tables directly.
Diagram: Search box connects from Asset Service and serves BFF/FE.
"""
from sqlalchemy import text
from app.db.database import TicketSession, AssetSession, DirectorySession, PolicySession


def _ticket_session():
    db = TicketSession()
    try:
        yield db
    finally:
        db.close()


def _asset_session():
    db = AssetSession()
    try:
        yield db
    finally:
        db.close()


def search_tickets(query: str, limit: int = 20) -> list[dict]:
    db = TicketSession()
    try:
        like = f"%{query}%"
        rows = db.execute(
            text("""
                SELECT id, ticket_number, title, status, priority, category,
                       assigned_to, created_at
                FROM tickets
                WHERE title ILIKE :q
                   OR ticket_number ILIKE :q
                   OR description ILIKE :q
                   OR category ILIKE :q
                   OR assigned_to ILIKE :q
                ORDER BY created_at DESC
                LIMIT :lim
            """),
            {"q": like, "lim": limit},
        ).fetchall()
        return [
            {
                "id": r.id,
                "ticket_number": r.ticket_number,
                "title": r.title,
                "status": r.status,
                "priority": r.priority,
                "category": r.category,
                "assigned_to": r.assigned_to,
                "created_at": r.created_at,
                "source": "ticket",
            }
            for r in rows
        ]
    except Exception:
        return []
    finally:
        db.close()


def search_assets(query: str, limit: int = 20) -> list[dict]:
    db = AssetSession()
    try:
        like = f"%{query}%"
        rows = db.execute(
            text("""
                SELECT id, name, type, risk_level, vulnerabilities_count, created_at
                FROM assets
                WHERE name ILIKE :q
                   OR type ILIKE :q
                   OR risk_level ILIKE :q
                ORDER BY created_at DESC
                LIMIT :lim
            """),
            {"q": like, "lim": limit},
        ).fetchall()
        return [
            {
                "id": r.id,
                "name": r.name,
                "type": r.type,
                "risk_level": r.risk_level,
                "vulnerabilities_count": r.vulnerabilities_count,
                "created_at": r.created_at,
                "source": "asset",
            }
            for r in rows
        ]
    except Exception:
        return []
    finally:
        db.close()


def search_agents(query: str, limit: int = 20) -> list[dict]:
    db = DirectorySession()
    try:
        like = f"%{query}%"
        rows = db.execute(
            text("""
                SELECT id, email, name, team, tier, categories, is_active, created_at
                FROM directory_agents
                WHERE email ILIKE :q
                   OR name ILIKE :q
                   OR team ILIKE :q
                   OR tier ILIKE :q
                   OR categories ILIKE :q
                ORDER BY created_at DESC
                LIMIT :lim
            """),
            {"q": like, "lim": limit},
        ).fetchall()
        return [
            {
                "id": r.id,
                "email": r.email,
                "name": r.name,
                "team": r.team,
                "tier": r.tier,
                "categories": r.categories,
                "is_active": r.is_active,
                "created_at": r.created_at,
                "source": "agent",
            }
            for r in rows
        ]
    except Exception:
        return []
    finally:
        db.close()


def search_policies(query: str, limit: int = 20) -> list[dict]:
    db = PolicySession()
    try:
        like = f"%{query}%"
        rows = db.execute(
            text("""
                SELECT id, name, description, category, platform, status, created_at
                FROM policies
                WHERE name ILIKE :q
                   OR description ILIKE :q
                   OR category ILIKE :q
                   OR platform ILIKE :q
                   OR status ILIKE :q
                ORDER BY created_at DESC
                LIMIT :lim
            """),
            {"q": like, "lim": limit},
        ).fetchall()
        return [
            {
                "id": r.id,
                "name": r.name,
                "description": r.description,
                "category": r.category,
                "platform": r.platform,
                "status": r.status,
                "created_at": r.created_at,
                "source": "policy",
            }
            for r in rows
        ]
    except Exception:
        return []
    finally:
        db.close()


def unified_search(query: str, limit: int = 20) -> dict:
    tickets = search_tickets(query, limit)
    assets = search_assets(query, limit)
    agents = search_agents(query, limit)
    policies = search_policies(query, limit)
    return {
        "query": query,
        "total": len(tickets) + len(assets) + len(agents) + len(policies),
        "tickets": tickets,
        "assets": assets,
        "agents": agents,
        "policies": policies,
    }
