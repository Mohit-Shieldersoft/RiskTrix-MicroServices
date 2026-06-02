"""
AutoAssign Engine — Ticket Service
====================================
Automatically assigns tickets based on:
  1. Severity / Priority  →  routes to correct tier
  2. Category             →  routes to correct team
  3. Workload balancing   →  picks the agent with fewest open tickets in that team

Agent roster is fetched dynamically from Directory Service (port 8008).
Falls back to hardcoded roster if directory-service is unavailable.
"""
from __future__ import annotations

import logging
import httpx
from typing import Optional
from sqlalchemy.orm import Session

from app.models.ticket import Ticket

logger = logging.getLogger("ticket-service.autoassign")

DIRECTORY_SERVICE_URL = "http://localhost:8008/api/v1"

# ── Fallback hardcoded roster (used if directory-service is down) ─────────────
FALLBACK_TEAMS: dict = {
    "security": {
        "roles": {
            "senior":   ["alice@risktrix.com", "bob@risktrix.com"],
            "standard": ["carol@risktrix.com", "dave@risktrix.com"],
        },
        "categories": ["security", "vulnerability", "threat", "incident"],
    },
    "it-ops": {
        "roles": {
            "senior":   ["eve@risktrix.com"],
            "standard": ["frank@risktrix.com", "grace@risktrix.com"],
        },
        "categories": ["infrastructure", "network", "access", "hardware"],
    },
    "compliance": {
        "roles": {
            "senior":   ["henry@risktrix.com"],
            "standard": ["iris@risktrix.com", "jack@risktrix.com"],
        },
        "categories": ["compliance", "audit", "policy", "risk"],
    },
    "general": {
        "roles": {
            "senior":   ["karen@risktrix.com"],
            "standard": ["leo@risktrix.com", "mia@risktrix.com"],
        },
        "categories": [],
    },
}

PRIORITY_TIER: dict[str, str] = {
    "critical": "senior",
    "high":     "senior",
    "medium":   "standard",
    "low":      "standard",
}


# ── Directory Service lookup ──────────────────────────────────────────────────

def _fetch_agents_from_directory(team: str, tier: str) -> list[str]:
    """Fetch agent emails from Directory Service. Returns [] on failure."""
    try:
        resp = httpx.get(
            f"{DIRECTORY_SERVICE_URL}/directory/agents/lookup",
            params={"team": team, "tier": tier},
            timeout=3.0,
        )
        if resp.status_code == 200:
            agents = resp.json()
            return [a["email"] for a in agents]
    except Exception as exc:
        logger.warning("Directory service unavailable, using fallback roster: %s", exc)
    return []


def _fetch_on_call_now() -> list[dict]:
    """Return currently active on-call entries from directory-service."""
    try:
        resp = httpx.get(f"{DIRECTORY_SERVICE_URL}/directory/on-call", timeout=3.0)
        if resp.status_code == 200:
            return resp.json()
    except Exception as exc:
        logger.warning("Could not fetch on-call roster: %s", exc)
    return []


def _fetch_available_agents_for_team(team: str, tier: str) -> list[str]:
    """
    Return emails of agents currently within working hours (or on-call)
    for a specific team and tier.
    """
    try:
        resp = httpx.get(
            f"{DIRECTORY_SERVICE_URL}/directory/agents/available-now",
            timeout=3.0,
        )
        if resp.status_code == 200:
            agents = resp.json()
            return [
                a["email"] for a in agents
                if a.get("team") == team and a.get("tier") == tier
            ]
    except Exception as exc:
        logger.warning("Could not fetch available agents: %s", exc)
    return []


def _pick_from_on_call(db: Session, team_name: str) -> Optional[str]:
    """
    For critical/high tickets: prefer a currently on-call agent from the target team.
    Falls back to any on-call agent if no team match.
    """
    on_call = _fetch_on_call_now()
    # Primary: on-call agent from the same team
    team_pool = [oc["agent_email"] for oc in on_call if oc.get("agent_team") == team_name]
    agent = _pick_agent(db, team_pool)
    if agent:
        return agent
    # Secondary: any on-call agent (cross-team escalation)
    any_pool = [oc["agent_email"] for oc in on_call]
    return _pick_agent(db, any_pool)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _resolve_team(category: str) -> str:
    cat = (category or "").lower()
    for team_name, config in FALLBACK_TEAMS.items():
        if any(c in cat for c in config["categories"]):
            return team_name
    return "general"


def _open_count(db: Session, agent_email: str) -> int:
    open_statuses = ["new", "assigned", "in_progress"]
    return (
        db.query(Ticket)
        .filter(
            Ticket.assigned_to == agent_email,
            Ticket.status.in_(open_statuses),
        )
        .count()
    )


def _pick_agent(db: Session, candidates: list[str]) -> Optional[str]:
    if not candidates:
        return None
    return min(candidates, key=lambda email: _open_count(db, email))


# ── Public API ────────────────────────────────────────────────────────────────

def auto_assign(
    db: Session,
    priority: str,
    category: str,
) -> tuple[Optional[str], Optional[str]]:
    team_name = _resolve_team(category)
    tier = PRIORITY_TIER.get(priority.lower(), "standard")
    fallback_tier = "senior" if tier == "standard" else "standard"

    # ── Step 1: Critical / high → try on-call agent first ────────────────
    if priority.lower() in ("critical", "high"):
        on_call_agent = _pick_from_on_call(db, team_name)
        if on_call_agent:
            logger.info(
                "[AutoAssign] %s ticket → on-call agent %s (team=%s)",
                priority, on_call_agent, team_name,
            )
            return on_call_agent, team_name

    # ── Step 2: Prefer agents currently within working hours ─────────────
    available_pool = _fetch_available_agents_for_team(team_name, tier)
    if available_pool:
        agent = _pick_agent(db, available_pool)
        if agent:
            logger.info(
                "[AutoAssign] Assigned to available agent %s (team=%s tier=%s)",
                agent, team_name, tier,
            )
            return agent, team_name

    # ── Step 3: Full directory lookup (existing logic) ────────────────────
    primary_pool = _fetch_agents_from_directory(team_name, tier)
    fallback_pool = _fetch_agents_from_directory(team_name, fallback_tier)

    # Fall back to hardcoded roster if directory is empty/down
    if not primary_pool and not fallback_pool:
        team_config = FALLBACK_TEAMS.get(team_name, FALLBACK_TEAMS["general"])
        primary_pool = team_config["roles"].get(tier, [])
        fallback_pool = team_config["roles"].get(fallback_tier, [])

    agent = _pick_agent(db, primary_pool) or _pick_agent(db, fallback_pool)

    # Last resort: general team
    if not agent and team_name != "general":
        gen_pool = _fetch_agents_from_directory("general", tier) or \
                   FALLBACK_TEAMS["general"]["roles"].get(tier, [])
        agent = _pick_agent(db, gen_pool)

    return agent, team_name


def get_workload_summary(db: Session) -> list[dict]:
    """Return open-ticket count per agent — for analytics."""
    all_emails: set[str] = set()
    for config in FALLBACK_TEAMS.values():
        for agents in config["roles"].values():
            all_emails.update(agents)

    summary = []
    for email in sorted(all_emails):
        count = _open_count(db, email)
        summary.append({"agent": email, "open_tickets": count})
    return sorted(summary, key=lambda x: x["open_tickets"])

