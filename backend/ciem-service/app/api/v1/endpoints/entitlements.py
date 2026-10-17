from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import IAMPolicyEntitlement, IAMIdentity
from app.schemas.ciem import IAMEntitlementResponse

router = APIRouter()


@router.get("/excessive-permissions", response_model=List[IAMEntitlementResponse])
async def list_excessive_permissions(
    identity_id: Optional[str] = None,
    high_risk_only: Optional[bool] = True,
    db: AsyncSession = Depends(get_db),
):
    query = select(IAMPolicyEntitlement)
    if identity_id:
        query = query.where(IAMPolicyEntitlement.identity_id == identity_id)
    if high_risk_only:
        query = query.where(IAMPolicyEntitlement.is_high_risk.is_(True))
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/remediation")
async def generate_least_privilege_remediation(identity_id: str, db: AsyncSession = Depends(get_db)):
    identity = (await db.execute(select(IAMIdentity).where(IAMIdentity.id == identity_id))).scalar_one_or_none()
    entitlements = (await db.execute(select(IAMPolicyEntitlement).where(IAMPolicyEntitlement.identity_id == identity_id))).scalars().all()
    used = [e.action for e in entitlements if e.is_used]
    unused = [e.action for e in entitlements if not e.is_used]
    return {
        "identity_id": identity_id,
        "recommended_action": "TRIM_EXCESSIVE_PERMISSIONS",
        "recommended_policy_json": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": used or ["sts:GetCallerIdentity"],
                    "Resource": "*",
                }
            ],
        },
        "revoked_high_risk_permissions": unused,
        "privilege_reduction_percentage": identity.excessive_percentage if identity else 0,
        "timestamp": datetime.utcnow().isoformat(),
    }
