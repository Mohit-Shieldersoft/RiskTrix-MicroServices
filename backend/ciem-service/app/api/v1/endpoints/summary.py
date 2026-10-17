from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import IAMIdentity
from app.schemas.ciem import CIEMSummaryResponse

router = APIRouter()


@router.get("/summary", response_model=CIEMSummaryResponse)
async def get_ciem_summary(db: AsyncSession = Depends(get_db)):
    identities = (await db.execute(select(IAMIdentity))).scalars().all()
    total = len(identities)
    users = len([i for i in identities if i.type == "USER"])
    roles = len([i for i in identities if i.type == "ROLE"])
    sa = len([i for i in identities if i.type == "SERVICE_ACCOUNT"])
    dormant = len([i for i in identities if i.is_dormant])
    excessive = len([i for i in identities if (i.excessive_percentage or 0) > 70.0])
    avg_risk = (sum((i.privilege_risk_score or 0) for i in identities) / total) if total else 0
    providers = {}
    for item in identities:
        providers[item.provider] = providers.get(item.provider, 0) + 1
    return CIEMSummaryResponse(
        total_identities=total,
        total_users=users,
        total_roles=roles,
        total_service_accounts=sa,
        dormant_identities_count=dormant,
        excessive_permission_identities_count=excessive,
        avg_privilege_risk_score=round(avg_risk, 1),
        high_risk_privilege_escalations_count=len([i for i in identities if (i.privilege_risk_score or 0) >= 9]),
        provider_identities_breakdown=providers,
    )
