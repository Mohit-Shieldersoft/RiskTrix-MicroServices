from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import logging
import os

from app.db.session import get_session
from app.services.vendor_service import vendor_service
from app.services.activity_service import log_vendor_activity
from app.schemas.vendor import (
    VendorCreate, VendorUpdate, VendorResponse, VendorListResponse,
    VendorFilterParams, VendorDashboardResponse, StandardOptionsResponse,
    VendorBulkUpdateRequest, VendorBulkResponse, ComplianceStandardEnum
)
from app.models.models import RiskLevel, ComplianceStatus, Vendor, VendorComplianceRecord

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    vendor_data: VendorCreate,
    db: AsyncSession = Depends(get_session)
):
    """
    Create a new vendor
    
    This endpoint creates a new vendor with the provided information.
    If a compliance standard is specified, it will also create an initial
    compliance record for that standard.
    """
    # Create the vendor
    vendor = await vendor_service.create_vendor(db, vendor_data)
    if getattr(vendor_data, "application_name", None):
        vendor = vendor.model_copy(update={
            "message": (
                "Vendor created. Linked application was not created; "
                "cross-service application create is skipped."
            )
        })
    
    # Log activity
    try:
        await log_vendor_activity(
            db=db,
            activity_type="vendor_created",
            vendor_id=vendor.id,
            vendor_name=vendor.name,
            user_id=None,
            user_name="System User",
            description=f"New vendor '{vendor.name}' added to the system",
            metadata={
                "category": vendor.category,
                "risk_level": str(vendor.risk_level) if vendor.risk_level else "medium",
                "compliance_status": str(vendor.compliance_status) if vendor.compliance_status else "pending"
            }
        )
    except Exception as e:
        logger.error(f"Failed to log vendor activity: {e}")
    
    return vendor


@router.get("/", response_model=VendorListResponse)
async def get_vendors(
    search: Optional[str] = Query(None, description="Search in vendor name or description"),
    category: Optional[str] = Query(None, description="Filter by vendor category"),
    risk_level: Optional[RiskLevel] = Query(None, description="Filter by risk level"),
    compliance_status: Optional[ComplianceStatus] = Query(None, description="Filter by compliance status"),
    standard: Optional[ComplianceStandardEnum] = Query(None, description="Filter by compliance standard"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    sort_by: str = Query("name", description="Sort field"),
    sort_order: str = Query("asc", regex="^(asc|desc)$", description="Sort order"),
    db: AsyncSession = Depends(get_session)
):
    """
    Get filtered list of vendors
    
    Returns a paginated list of vendors with optional filtering and sorting.
    Supports searching by name and description, filtering by category, risk level,
    compliance status, and compliance standard (returns vendors assigned to that standard).
    """
    filters = VendorFilterParams(
        search=search,
        category=category,
        risk_level=risk_level,
        compliance_status=compliance_status,
        standard=standard,
        page=page,
        size=size,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return await vendor_service.get_vendors(db, filters)


@router.get("/dashboard", response_model=VendorDashboardResponse)
async def get_vendor_dashboard(
    db: AsyncSession = Depends(get_session)
):
    """
    Get vendor dashboard data
    
    Returns comprehensive dashboard information including:
    - Vendor statistics (total, compliant, non-compliant, etc.)
    - Risk level distribution
    - Compliance status distribution
    - Recent vendors
    - Expiring certificates
    """
    return await vendor_service.get_vendor_dashboard(db)


@router.get("/standards", response_model=StandardOptionsResponse)
async def get_compliance_standards():
    """
    Get available compliance standards
    
    Returns a list of all available compliance standards that can be
    used when creating vendors. This is used to populate dropdown
    options in the frontend.
    """
    return await vendor_service.get_standard_options()


@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: int,
    db: AsyncSession = Depends(get_session)
):
    """
    Get vendor by ID
    
    Returns detailed information about a specific vendor including
    compliance records count and active vulnerabilities count.
    """
    return await vendor_service.get_vendor(db, vendor_id)


@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: int,
    vendor_data: VendorUpdate,
    db: AsyncSession = Depends(get_session)
):
    """
    Update vendor
    
    Updates an existing vendor with the provided information.
    Only provided fields will be updated, others remain unchanged.
    """
    from app.services.activity_service import log_vendor_update_activity
    
    result = await vendor_service.update_vendor(db, vendor_id, vendor_data)
    
    # Log the update activity
    try:
        updated_fields = vendor_data.dict(exclude_unset=True)
        await log_vendor_update_activity(
            db=db,
            vendor_id=result.id,
            vendor_name=result.name,
            updated_fields=updated_fields,
            user_id=None,
            user_name="System User"
        )
    except Exception as e:
        logger.warning(f"Failed to log vendor update activity: {str(e)}")
    
    return result


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor(
    vendor_id: int,
    db: AsyncSession = Depends(get_session)
):
    """
    Delete vendor
    
    Permanently deletes a vendor and all associated records.
    This action cannot be undone.
    """
    await vendor_service.delete_vendor(db, vendor_id)


@router.put("/bulk", response_model=VendorBulkResponse)
async def bulk_update_vendors(
    bulk_request: VendorBulkUpdateRequest,
    db: AsyncSession = Depends(get_session)
):
    """
    Bulk update vendors
    
    Updates multiple vendors with the same information.
    Returns the count of successful and failed updates.
    """
    success_count = 0
    errors = []
    for vendor_id in bulk_request.vendor_ids:
        try:
            await vendor_service.update_vendor(db, vendor_id, bulk_request.updates)
            success_count += 1
        except Exception as exc:
            errors.append({"vendor_id": vendor_id, "error": str(exc)})
    return VendorBulkResponse(
        success_count=success_count,
        failed_count=len(errors),
        errors=errors,
    )


def _parse_date(value):
    if not value:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    return date.fromisoformat(str(value)[:10])


# Additional endpoints for vendor compliance management

@router.get("/{vendor_id}/compliance", response_model=List[dict])
async def get_vendor_compliance_records(
    vendor_id: int,
    db: AsyncSession = Depends(get_session)
):
    vendor = await db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    result = await db.execute(
        select(VendorComplianceRecord).where(VendorComplianceRecord.vendor_id == vendor_id)
    )
    rows = result.scalars().all()
    return [
        {
            "id": row.id,
            "vendor_id": row.vendor_id,
            "compliance_area": row.compliance_area,
            "status": str(row.status.value if hasattr(row.status, "value") else row.status),
            "assessment_date": row.assessment_date.isoformat() if row.assessment_date else None,
            "expiry_date": row.expiry_date.isoformat() if row.expiry_date else None,
            "certificate_url": row.certificate_url,
            "notes": row.notes,
        }
        for row in rows
    ]


@router.post("/{vendor_id}/compliance", response_model=dict)
async def create_vendor_compliance_record(
    vendor_id: int,
    compliance_data: dict,
    db: AsyncSession = Depends(get_session)
):
    vendor = await db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    area = compliance_data.get("compliance_area") or compliance_data.get("standard")
    if not area:
        raise HTTPException(status_code=400, detail="compliance_area is required")
    status_raw = (compliance_data.get("status") or "pending").lower()
    try:
        rec_status = ComplianceStatus(status_raw)
    except Exception:
        rec_status = ComplianceStatus.PENDING
    record = VendorComplianceRecord(
        vendor_id=vendor_id,
        compliance_area=area,
        status=rec_status,
        assessment_date=_parse_date(compliance_data.get("assessment_date")) or date.today(),
        expiry_date=_parse_date(compliance_data.get("expiry_date")),
        certificate_url=compliance_data.get("certificate_url"),
        notes=compliance_data.get("notes"),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return {
        "id": record.id,
        "vendor_id": vendor_id,
        "compliance_area": record.compliance_area,
        "status": str(record.status.value if hasattr(record.status, "value") else record.status),
        "message": "Compliance record created",
    }


@router.get("/{vendor_id}/vulnerabilities", response_model=List[dict])
async def get_vendor_vulnerabilities(
    vendor_id: int,
    db: AsyncSession = Depends(get_session)
):
    vendor = await db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    app_url = os.getenv("APPLICATION_SERVICE_URL", "http://application-service:8001")
    try:
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"{app_url}/api/v1/vulnerabilities", params={"vendor_id": vendor_id})
            if res.status_code >= 400:
                raise HTTPException(
                    status_code=501,
                    detail="Application-service vulnerability link failed. No invented empty dataset.",
                )
            data = res.json()
            if isinstance(data, list):
                return data
            if isinstance(data, dict) and "items" in data:
                return data["items"]
            if isinstance(data, dict) and "vulnerabilities" in data:
                return data["vulnerabilities"]
            return data if isinstance(data, list) else []
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=501,
            detail=f"Cannot load vendor vulnerabilities from application-service: {exc}",
        )


@router.get("/{vendor_id}/risk-assessment", response_model=dict)
async def get_vendor_risk_assessment(
    vendor_id: int,
    db: AsyncSession = Depends(get_session)
):
    vendor = await db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    result = await db.execute(
        select(VendorComplianceRecord).where(VendorComplianceRecord.vendor_id == vendor_id)
    )
    records = result.scalars().all()
    non_compliant = sum(
        1 for r in records
        if str(getattr(r.status, "value", r.status)).lower() == "non_compliant"
    )
    return {
        "vendor_id": vendor.id,
        "vendor_name": vendor.name,
        "risk_level": str(vendor.risk_level.value if hasattr(vendor.risk_level, "value") else vendor.risk_level),
        "compliance_status": str(vendor.compliance_status.value if hasattr(vendor.compliance_status, "value") else vendor.compliance_status),
        "last_risk_assessment": vendor.last_risk_assessment.isoformat() if vendor.last_risk_assessment else None,
        "next_risk_assessment": vendor.next_risk_assessment.isoformat() if vendor.next_risk_assessment else None,
        "compliance_records": len(records),
        "non_compliant_records": non_compliant,
        "source": "vendor_fields_and_compliance_records",
    }


@router.post("/{vendor_id}/risk-assessment", response_model=dict)
async def create_vendor_risk_assessment(
    vendor_id: int,
    assessment_data: dict,
    db: AsyncSession = Depends(get_session)
):
    vendor = await db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if assessment_data.get("risk_level"):
        try:
            vendor.risk_level = RiskLevel(str(assessment_data["risk_level"]).lower())
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid risk_level")
    if assessment_data.get("compliance_status"):
        try:
            vendor.compliance_status = ComplianceStatus(str(assessment_data["compliance_status"]).lower())
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid compliance_status")
    vendor.last_risk_assessment = _parse_date(assessment_data.get("assessment_date")) or date.today()
    notes = assessment_data.get("notes") or assessment_data.get("summary")
    if notes:
        record = VendorComplianceRecord(
            vendor_id=vendor_id,
            compliance_area=assessment_data.get("compliance_area") or "risk_assessment",
            status=vendor.compliance_status or ComplianceStatus.PENDING,
            assessment_date=vendor.last_risk_assessment,
            notes=notes,
        )
        db.add(record)
    await db.commit()
    await db.refresh(vendor)
    return {
        "vendor_id": vendor.id,
        "risk_level": str(vendor.risk_level.value if hasattr(vendor.risk_level, "value") else vendor.risk_level),
        "last_risk_assessment": vendor.last_risk_assessment.isoformat() if vendor.last_risk_assessment else None,
        "message": "Risk assessment persisted on the vendor record",
    }
