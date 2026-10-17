from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import CloudAsset, CloudAccount
from app.schemas.cspm import CloudAssetResponse
from app.services.seed_data import DEFAULT_ASSETS
from app.api.v1.endpoints.cloud_accounts import _sync_account
from app.services.demo_scope import is_demo_request, scope_ids

router = APIRouter()


from sqlalchemy import delete

@router.get("/assets", response_model=List[CloudAssetResponse])
async def list_cloud_assets(
    request: Request,
    provider: Optional[str] = None,
    asset_type: Optional[str] = None,
    compliance_status: Optional[str] = None,
    search: Optional[str] = None,
    riskLevel: Optional[str] = None,
    region: Optional[str] = None,
    account_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Asset Explorer: Query discovered multi-cloud assets across AWS, Azure, and GCP."""
    try:
        acc_query = select(CloudAccount.account_id)
        acc_res = await db.execute(acc_query)
        all_account_ids = [a for a in acc_res.scalars().all() if a]
        connected_account_ids = scope_ids(all_account_ids, is_demo_request(request))

        if all_account_ids:
            await db.execute(delete(CloudAsset).where(~CloudAsset.account_id.in_(all_account_ids)))
            await db.commit()

        if not connected_account_ids:
            return []

        query = select(CloudAsset).where(CloudAsset.account_id.in_(connected_account_ids))
        if provider:
            query = query.where(CloudAsset.provider == provider.upper())
        if asset_type:
            query = query.where(CloudAsset.asset_type == asset_type.upper())
        if compliance_status:
            query = query.where(CloudAsset.compliance_status == compliance_status.upper())
        if region:
            query = query.where(CloudAsset.region == region)
        if account_id:
            query = query.where(CloudAsset.account_id == account_id)

        result = await db.execute(query)
        assets = result.scalars().all()
        if search:
            term = search.lower()
            assets = [row for row in assets if term in (row.name or "").lower() or term in (row.resource_id or "").lower()]
        if riskLevel:
            def bucket(score):
                value = score or 0
                if value >= 8:
                    return "CRITICAL"
                if value >= 6:
                    return "HIGH"
                if value >= 4:
                    return "MEDIUM"
                return "LOW"
            assets = [row for row in assets if bucket(row.risk_score) == riskLevel.upper()]
        return assets
    except Exception:
        return []


@router.get("/assets/stats")
async def asset_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CloudAsset))
    assets = result.scalars().all()
    by_type = {}
    by_provider = {}
    for asset in assets:
        by_type[asset.asset_type] = by_type.get(asset.asset_type, 0) + 1
        by_provider[asset.provider] = by_provider.get(asset.provider, 0) + 1
    by_risk = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for asset in assets:
        score = asset.risk_score or 0
        if score >= 8:
            by_risk["CRITICAL"] += 1
        elif score >= 6:
            by_risk["HIGH"] += 1
        elif score >= 4:
            by_risk["MEDIUM"] += 1
        else:
            by_risk["LOW"] += 1
    return {
        "total": len(assets),
        "non_compliant": len([a for a in assets if a.compliance_status == "NON_COMPLIANT"]),
        "by_type": by_type,
        "by_provider": by_provider,
        "by_risk": by_risk,
    }


@router.get("/assets/{asset_id}", response_model=CloudAssetResponse)
async def get_asset(asset_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CloudAsset).where(CloudAsset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        result = await db.execute(select(CloudAsset).where(CloudAsset.resource_id == asset_id))
        asset = result.scalar_one_or_none()
    if not asset:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.get("/assets/{asset_id}/relationships")
async def asset_relationships(asset_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CloudAsset).where(CloudAsset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        return {"asset_id": asset_id, "relationships": []}
    siblings = await db.execute(select(CloudAsset).where(CloudAsset.account_id == asset.account_id))
    related = [
        {"id": row.id, "name": row.name, "type": row.asset_type, "relationship": "SAME_ACCOUNT"}
        for row in siblings.scalars().all()
        if row.id != asset.id
    ][:20]
    return {"asset_id": asset_id, "relationships": related}


@router.get("/assets/{asset_id}/history")
async def asset_history(asset_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CloudAsset).where(CloudAsset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        return []
    return [{
        "asset_id": asset.id,
        "event": "DISCOVERED",
        "at": asset.created_at,
        "details": asset.details,
    }]


@router.post("/assets/discover")
async def discover_all_assets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CloudAccount))
    accounts = result.scalars().all()
    synced = []
    for account in accounts:
        updated = await _sync_account(account.account_id, db, account=account)
        synced.append({"account_id": account.account_id, "assets_count": updated.assets_count})
    return {"status": "success", "accounts": synced}


@router.post("/assets/discover/{cloud_account_id}")
async def discover_account_assets(cloud_account_id: str, db: AsyncSession = Depends(get_db)):
    updated = await _sync_account(cloud_account_id, db)
    return {"status": "success", "account_id": cloud_account_id, "assets_count": updated.assets_count}
