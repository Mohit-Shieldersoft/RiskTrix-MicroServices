"""EOSL (End of Service Life) endpoints for Application Service.

Reads from the shared `eosl_records` table, which the monolith created.
Returns the same response shape the frontend eoslApi.js expects.
"""
from datetime import date, datetime, timedelta
from typing import Optional, List
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.db.session import get_session
from app.models.models import EOSLRecord, RiskLevel

router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic schemas (kept local to avoid cross-service import complications)
# ---------------------------------------------------------------------------

class EOSLAssetResponse(BaseModel):
    id: int
    asset_id: str
    asset_name: str
    owner: str
    asset_type: str
    eosl_type: str
    eosl_date: Optional[str] = None
    remark: Optional[str] = None
    reminder_sent: bool = False
    days_until_eosl: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    # camelCase aliases for the frontend
    assetName: Optional[str] = None
    assetType: Optional[str] = None
    eoslType: Optional[str] = None
    eoslDate: Optional[str] = None
    reminderSent: bool = False
    daysUntil: Optional[int] = None

    class Config:
        from_attributes = True


class EOSLAssetListResponse(BaseModel):
    items: List[EOSLAssetResponse]
    total: int
    page: int
    size: int
    pages: int


class EOSLAssetCreate(BaseModel):
    asset_name: str
    owner: str
    asset_type: str
    eosl_type: str  # "EOS" or "EOL"
    eosl_date: date
    remark: Optional[str] = None


class EOSLAssetUpdate(BaseModel):
    asset_name: Optional[str] = None
    owner: Optional[str] = None
    asset_type: Optional[str] = None
    eosl_type: Optional[str] = None
    eosl_date: Optional[date] = None
    remark: Optional[str] = None


class TopNonCompliantAsset(BaseModel):
    name: str
    count: int


class ComplianceMonthData(BaseModel):
    month: str
    compliant: int
    nonCompliant: int


class EOSLSummary(BaseModel):
    eosCount: int
    eolCount: int
    totalAssets: int
    expiringSoon: int
    expired: int


class EOSLDashboardResponse(BaseModel):
    assets: List[EOSLAssetResponse]
    topNonCompliantAssets: List[TopNonCompliantAsset]
    complianceByYear: dict
    summary: EOSLSummary
    currentDateTime: str
    currentUser: str


class AssetUploadRequest(BaseModel):
    assets: List[EOSLAssetCreate]


class AssetUploadResponse(BaseModel):
    success: bool
    created: int
    failed: int
    errors: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _map_asset(asset: EOSLRecord) -> EOSLAssetResponse:
    eosl_type = "EOS" if asset.end_of_support_date else "EOL"
    eosl_date_obj = asset.end_of_support_date if asset.end_of_support_date else asset.end_of_sale_date
    days_until = (eosl_date_obj - date.today()).days if eosl_date_obj else None
    eosl_date_str = eosl_date_obj.isoformat() if eosl_date_obj else None

    return EOSLAssetResponse(
        id=asset.id,
        asset_id=f"ASSET-{asset.id:04d}",
        asset_name=asset.product_name,
        owner=asset.vendor_name,
        asset_type=asset.category or "Unknown",
        eosl_type=eosl_type,
        eosl_date=eosl_date_str,
        remark=asset.business_impact,
        reminder_sent=False,
        days_until_eosl=days_until,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
        assetName=asset.product_name,
        assetType=asset.category or "Unknown",
        eoslType=eosl_type,
        eoslDate=eosl_date_str,
        reminderSent=False,
        daysUntil=days_until,
    )


def _generate_compliance_by_year(target_year: int) -> dict:
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    result = {}
    for year in range(target_year - 2, target_year + 2):
        year_data = []
        for i, month in enumerate(months):
            compliant = min(70 + i * 2, 98)
            year_data.append({"month": month, "compliant": compliant, "nonCompliant": 100 - compliant})
        result[str(year)] = year_data
    return result


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/dashboard", response_model=EOSLDashboardResponse)
async def get_eosl_dashboard(
    year: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_session),
):
    if year is None:
        year = datetime.now().year

    result = await db.execute(
        select(EOSLRecord).order_by(EOSLRecord.end_of_support_date, EOSLRecord.end_of_sale_date)
    )
    all_assets = result.scalars().all()

    asset_responses = [_map_asset(a) for a in all_assets]

    # Top non-compliant by category
    type_counts: dict = defaultdict(int)
    for a in all_assets:
        if a.category:
            type_counts[a.category] += 1
    top_non_compliant = [
        {"name": k, "count": v}
        for k, v in sorted(type_counts.items(), key=lambda x: x[1], reverse=True)[:4]
    ]

    today = date.today()
    eos_count = sum(1 for a in all_assets if a.end_of_support_date)
    eol_count = sum(1 for a in all_assets if a.end_of_sale_date)
    expiring_soon = sum(
        1 for a in all_assets
        if (a.end_of_support_date and today < a.end_of_support_date <= today + timedelta(days=30))
        or (a.end_of_sale_date and today < a.end_of_sale_date <= today + timedelta(days=30))
    )
    expired = sum(
        1 for a in all_assets
        if (a.end_of_support_date and a.end_of_support_date < today)
        or (a.end_of_sale_date and a.end_of_sale_date < today)
    )

    return EOSLDashboardResponse(
        assets=asset_responses,
        topNonCompliantAssets=top_non_compliant,
        complianceByYear=_generate_compliance_by_year(year),
        summary=EOSLSummary(
            eosCount=eos_count,
            eolCount=eol_count,
            totalAssets=len(all_assets),
            expiringSoon=expiring_soon,
            expired=expired,
        ),
        currentDateTime=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        currentUser="System",
    )


@router.get("/", response_model=EOSLAssetListResponse)
async def get_eosl_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    eosl_type: Optional[str] = Query(None),
    owner: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_session),
):
    query = select(EOSLRecord)
    if eosl_type:
        if eosl_type.upper() == "EOS":
            query = query.where(EOSLRecord.end_of_support_date.isnot(None))
        elif eosl_type.upper() == "EOL":
            query = query.where(EOSLRecord.end_of_sale_date.isnot(None))
    if owner:
        query = query.where(EOSLRecord.vendor_name == owner)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    query = query.order_by(desc(EOSLRecord.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    assets = result.scalars().all()

    pages = (total + limit - 1) // limit if limit > 0 else 0
    page = (skip // limit) + 1 if limit > 0 else 1

    return EOSLAssetListResponse(
        items=[_map_asset(a) for a in assets],
        total=total,
        page=page,
        size=limit,
        pages=pages,
    )


@router.get("/{asset_id}", response_model=EOSLAssetResponse)
async def get_eosl_asset(asset_id: int, db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(EOSLRecord).where(EOSLRecord.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"EOSL asset {asset_id} not found")
    return _map_asset(asset)


@router.post("/", response_model=EOSLAssetResponse, status_code=status.HTTP_201_CREATED)
async def create_eosl_asset(asset_data: EOSLAssetCreate, db: AsyncSession = Depends(get_session)):
    eosl_type = asset_data.eosl_type.upper()
    db_asset = EOSLRecord(
        product_name=asset_data.asset_name,
        vendor_name=asset_data.owner,
        category=asset_data.asset_type,
        risk_level=RiskLevel.HIGH if eosl_type == "EOL" else RiskLevel.MEDIUM,
        end_of_support_date=asset_data.eosl_date if eosl_type == "EOS" else None,
        end_of_sale_date=asset_data.eosl_date if eosl_type == "EOL" else None,
        business_impact=asset_data.remark,
    )
    db.add(db_asset)
    await db.commit()
    await db.refresh(db_asset)
    return _map_asset(db_asset)


@router.put("/{asset_id}", response_model=EOSLAssetResponse)
async def update_eosl_asset(
    asset_id: int, asset_data: EOSLAssetUpdate, db: AsyncSession = Depends(get_session)
):
    result = await db.execute(select(EOSLRecord).where(EOSLRecord.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"EOSL asset {asset_id} not found")

    if asset_data.asset_name is not None:
        asset.product_name = asset_data.asset_name
    if asset_data.owner is not None:
        asset.vendor_name = asset_data.owner
    if asset_data.asset_type is not None:
        asset.category = asset_data.asset_type
    if asset_data.eosl_type is not None:
        asset.risk_level = RiskLevel.HIGH if asset_data.eosl_type.upper() == "EOL" else RiskLevel.MEDIUM
    if asset_data.eosl_date is not None:
        if asset.end_of_support_date:
            asset.end_of_support_date = asset_data.eosl_date
        else:
            asset.end_of_sale_date = asset_data.eosl_date
    if asset_data.remark is not None:
        asset.business_impact = asset_data.remark

    await db.commit()
    await db.refresh(asset)
    return _map_asset(asset)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_eosl_asset(asset_id: int, db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(EOSLRecord).where(EOSLRecord.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"EOSL asset {asset_id} not found")
    await db.delete(asset)
    await db.commit()


@router.post("/upload", response_model=AssetUploadResponse)
async def bulk_upload_assets(upload_data: AssetUploadRequest, db: AsyncSession = Depends(get_session)):
    created = 0
    failed = 0
    errors = []
    for idx, asset_data in enumerate(upload_data.assets):
        try:
            eosl_type = asset_data.eosl_type.upper()
            db_asset = EOSLRecord(
                product_name=asset_data.asset_name,
                vendor_name=asset_data.owner,
                category=asset_data.asset_type,
                risk_level=RiskLevel.HIGH if eosl_type == "EOL" else RiskLevel.MEDIUM,
                end_of_support_date=asset_data.eosl_date if eosl_type == "EOS" else None,
                end_of_sale_date=asset_data.eosl_date if eosl_type == "EOL" else None,
                business_impact=asset_data.remark,
            )
            db.add(db_asset)
            created += 1
        except Exception as e:
            failed += 1
            errors.append(f"Row {idx + 1}: {str(e)}")
    await db.commit()
    return AssetUploadResponse(
        success=failed == 0,
        created=created,
        failed=failed,
        errors=errors if errors else None,
    )
