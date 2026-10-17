import os

import httpx
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import CloudAsset, CSPMFinding, CloudAccount, CSPMPolicy

router = APIRouter()

SIBLING_SEARCH = [
    (os.getenv("CIEM_SERVICE_URL", "http://ciem-service:8015"), "/api/v1/ciem/search"),
    (os.getenv("ALERT_SERVICE_URL", "http://alert-notification-service:8017"), "/api/v1/alerts/search"),
    (os.getenv("K8S_SERVICE_URL", "http://k8s-container-service:8016"), "/api/v1/kubernetes/search"),
]


@router.get("/search")
async def global_search(q: str = Query(..., min_length=1), type: str = None, db: AsyncSession = Depends(get_db)):
    term = f"%{q}%"
    hits = []
    wanted = (type or "").lower()

    if not wanted or wanted in ("asset", "assets"):
        assets = (await db.execute(select(CloudAsset).where(CloudAsset.name.ilike(term)))).scalars().all()
        for asset in assets[:10]:
            hits.append({"type": "asset", "id": asset.id, "title": asset.name, "url": "/assets", "provider": asset.provider})

    if not wanted or wanted in ("finding", "findings"):
        findings = (await db.execute(select(CSPMFinding).where(CSPMFinding.title.ilike(term)))).scalars().all()
        for finding in findings[:10]:
            hits.append({"type": "finding", "id": finding.id, "title": finding.title, "url": "/findings", "severity": finding.severity})

    if not wanted or wanted in ("cloud_account", "account"):
        accounts = (await db.execute(select(CloudAccount).where(CloudAccount.name.ilike(term)))).scalars().all()
        for account in accounts[:5]:
            hits.append({"type": "cloud_account", "id": account.id, "title": account.name, "url": "/cloud", "provider": account.provider})

    if not wanted or wanted in ("policy", "policies"):
        policies = (await db.execute(select(CSPMPolicy).where(CSPMPolicy.title.ilike(term)))).scalars().all()
        for policy in policies[:5]:
            hits.append({"type": "policy", "id": policy.id, "title": policy.title, "url": "/policies"})

    async with httpx.AsyncClient(timeout=2.0) as client:
        for base, path in SIBLING_SEARCH:
            try:
                res = await client.get(f"{base}{path}", params={"q": q})
                if res.status_code == 200 and isinstance(res.json(), list):
                    hits.extend(res.json()[:8])
            except Exception:
                continue

    return {"query": q, "total": len(hits), "results": hits}
