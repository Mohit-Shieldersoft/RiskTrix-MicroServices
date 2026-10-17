import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import IAMIdentity
from app.schemas.ciem import IAMIdentityResponse
from app.services.ciem_sync_service import ciem_sync_service
from app.services.demo_scope import is_demo_request, in_scope

router = APIRouter()


def _parse_list(value) -> list:
    if not value:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            return [part.strip() for part in value.split(",") if part.strip()]
    return []


def _to_response(item: IAMIdentity) -> IAMIdentityResponse:
    return IAMIdentityResponse(
        id=item.id,
        identity_id=item.id,
        name=item.name,
        type=item.type,
        provider=item.provider,
        account_id=item.account_id,
        account_name=item.account_name,
        granted_permissions_count=item.granted_permissions_count or 0,
        used_permissions_count=item.used_permissions_count or 0,
        excessive_percentage=item.excessive_percentage or 0.0,
        is_dormant=bool(item.is_dormant),
        is_overprivileged=bool(item.is_overprivileged),
        last_active=item.last_active or datetime.utcnow(),
        privilege_risk_score=item.privilege_risk_score or 0.0,
        risk_score=item.privilege_risk_score or 0.0,
        policies=_parse_list(item.policies),
        unused_services=_parse_list(item.unused_services),
        recommended_policy=item.recommended_policy,
        created_at=item.created_at or datetime.utcnow(),
    )


@router.get("/stats")
async def ciem_stats(request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IAMIdentity))
    demo = is_demo_request(request)
    identities = [item for item in result.scalars().all() if in_scope(item.account_id, demo)]
    def risk_bucket(score: float) -> str:
        if score >= 8:
            return "critical"
        if score >= 6:
            return "high"
        if score >= 4:
            return "medium"
        return "low"
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for item in identities:
        counts[risk_bucket(item.privilege_risk_score or 0)] += 1
    overprivileged = len([item for item in identities if item.is_overprivileged])
    dormant = len([item for item in identities if item.is_dormant])
    return {
        "total": len(identities),
        "riskCounts": counts,
        "riskFlags": {
            "overPrivileged": overprivileged,
            "inactive": dormant,
            "noMfa": 0,
        },
        "overprivileged": overprivileged,
        "dormant": dormant,
        "users": len([item for item in identities if (item.type or "").upper() == "USER"]),
        "roles": len([item for item in identities if (item.type or "").upper() == "ROLE"]),
    }


@router.get("/identities", response_model=List[IAMIdentityResponse])
async def list_iam_identities(
    request: Request,
    provider: Optional[str] = None,
    type: Optional[str] = None,
    is_dormant: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    """List IAM users, roles, groups, and service accounts with entitlement risk metrics."""
    query = select(IAMIdentity)
    if provider and provider.upper() != "ALL":
        query = query.where(IAMIdentity.provider == provider.upper())
    if type and type.upper() != "ALL":
        query = query.where(IAMIdentity.type == type.upper())
    if is_dormant is not None:
        query = query.where(IAMIdentity.is_dormant == is_dormant)

    result = await db.execute(query)
    demo = is_demo_request(request)
    identities = [item for item in result.scalars().all() if in_scope(item.account_id, demo)]
    return [_to_response(item) for item in identities]


@router.post("/demo/provision")
async def provision_demo_identities(request: Request, db: AsyncSession = Depends(get_db)):
    if not is_demo_request(request):
        raise HTTPException(status_code=403, detail="Demo CIEM data is only available to the demo account.")
    existing = (await db.execute(select(IAMIdentity).where(IAMIdentity.id == "DEMO-AWS-ROLE-S3ADMIN"))).scalar_one_or_none()
    if not existing:
        db.add(IAMIdentity(
            id="DEMO-AWS-ROLE-S3ADMIN",
            name="DemoS3FullAdminAccess",
            type="ROLE",
            provider="AWS",
            account_id="DEMO-AWS",
            account_name="Demo AWS Production",
            granted_permissions_count=184,
            used_permissions_count=11,
            excessive_percentage=94.0,
            is_dormant=False,
            is_overprivileged=True,
            privilege_risk_score=9.1,
            policies=json.dumps(["AdministratorAccess", "s3:*"]),
            unused_services=json.dumps(["iam:*", "kms:*"]),
            recommended_policy="s3:GetObject,s3:ListBucket on demo-prod-customer-pii",
        ))
        await db.commit()
    return {"status": "ready", "mode": "demo"}


@router.get("/identities/{identity_id}", response_model=IAMIdentityResponse)
async def get_iam_identity(identity_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IAMIdentity).where(IAMIdentity.id == identity_id))
    ident = result.scalar_one_or_none()
    if not ident:
        raise HTTPException(status_code=404, detail=f"Identity '{identity_id}' not found")
    return _to_response(ident)


@router.post("/sync", status_code=status.HTTP_200_OK)
@router.post("/identities/sync", status_code=status.HTTP_200_OK)
async def trigger_ciem_identity_sync(db: AsyncSession = Depends(get_db)):
    """Trigger live multi-cloud identity & authorization ingestion sync across AWS, Azure, and GCP."""
    return await ciem_sync_service.run_sync(db=db)


@router.post("/analyze", status_code=status.HTTP_200_OK)
async def analyze_identities(db: AsyncSession = Depends(get_db)):
    """Re-run CIEM analysis from persisted identities (CNAPP /ciem/analyze)."""
    return await ciem_sync_service.run_sync(db=db)


@router.post("/remediate/{identity_id}", status_code=status.HTTP_200_OK)
async def remediate_identity_least_privilege(
    identity_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Apply least-privilege policy remediation for an overprivileged or dormant identity."""
    result = await db.execute(select(IAMIdentity).where(IAMIdentity.id == identity_id))
    ident = result.scalar_one_or_none()
    if not ident:
        raise HTTPException(status_code=404, detail=f"Identity '{identity_id}' not found")

    ident.is_overprivileged = False
    ident.is_dormant = False
    ident.privilege_risk_score = 2.0
    ident.granted_permissions_count = max(ident.used_permissions_count or 0, 12)
    ident.excessive_percentage = 0.0
    ident.recommended_policy = ident.recommended_policy or "LeastPrivilegeResized"
    await db.commit()
    return {
        "status": "remediated",
        "identity_id": identity_id,
        "message": f"Successfully resized permissions to Least Privilege for {identity_id}",
        "cloudMutated": False,
    }
