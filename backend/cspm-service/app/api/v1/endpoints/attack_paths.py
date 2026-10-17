from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import CloudAccount, GuidedAction
from app.services.correlation_engine import build_attack_paths
from app.services.demo_scope import is_demo_request, in_scope

router = APIRouter()


@router.get("/attack-paths")
async def get_attack_paths(request: Request, db: AsyncSession = Depends(get_db)):
    """List attack paths from scoped live/demo assets only."""
    demo = is_demo_request(request)
    accounts = [row.account_id for row in (await db.execute(select(CloudAccount))).scalars().all() if in_scope(row.account_id, demo)]
    if not accounts:
        return []
    paths = await build_attack_paths(db, demo=demo)
    actions = {
        row.entity_id: row
        for row in (await db.execute(select(GuidedAction).where(GuidedAction.entity_type == "attack_path"))).scalars().all()
    }
    for path in paths:
        action = actions.get(path.get("path_id"))
        if action:
            path["status"] = "GUIDED"
            path["cloudMutated"] = False
    return paths


@router.post("/attack-paths/simulate")
async def simulate_attack_path(request: Request, db: AsyncSession = Depends(get_db)):
    paths = await build_attack_paths(db, demo=is_demo_request(request))
    return {
        "status": "COMPLETED",
        "paths_scanned": len(paths),
        "toxic_combinations_found": len(paths),
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/attack-paths/{path_id}/choke-point-remediate")
async def remediate_attack_path(path_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Persist a guided choke-point. Does not change cloud resources."""
    paths = await build_attack_paths(db, demo=is_demo_request(request))
    path = next((item for item in paths if item.get("path_id") == path_id), None)
    if not path:
        raise HTTPException(status_code=404, detail=f"Attack path {path_id} not found")
    existing = (await db.execute(
        select(GuidedAction).where(GuidedAction.entity_type == "attack_path", GuidedAction.entity_id == path_id)
    )).scalar_one_or_none()
    if not existing:
        existing = GuidedAction(
            entity_type="attack_path",
            entity_id=path_id,
            status="GUIDED",
            cloud_mutated=False,
            message=f"Guided choke-point recorded for {path_id}. No cloud API mutation performed.",
        )
        db.add(existing)
        await db.commit()
    return {
        "status": "GUIDED",
        "path_id": path_id,
        "cloudMutated": False,
        "message": existing.message,
        "timestamp": datetime.utcnow().isoformat(),
    }
