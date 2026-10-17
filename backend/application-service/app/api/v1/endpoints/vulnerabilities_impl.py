"""API endpoints for vulnerability management (Closure Tracking)."""
from typing import Optional
import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_session
from app.schemas.vulnerability import (
    VulnerabilityCreate,
    VulnerabilityUpdate,
    VulnerabilityResponse,
    VulnerabilityListResponse,
    VulnerabilityFilterParams,
    VulnerabilityStatistics,
    VulnerabilityStatusUpdate,
    VulnerabilityRemarksUpdate,
    VulnerabilityStatusEnum,
    RiskLevel,
    POCUploadResponse
)
try:
    import pandas as pd
except ImportError:
    pd = None
import io
import logging
from datetime import datetime, timezone
from app.models.models import Vulnerability, Application, RiskLevel as ModelRiskLevel, VulnerabilityStatus, ApplicationType
from app.services.vulnerability_service import vulnerability_service

logger = logging.getLogger(__name__)

VULN_COLUMN_MAPPING = {
    "name": ["vulnerability name", "vulnerability", "title", "name"],
    "category": ["risk category", "category", "severity", "risk"],
    "description": ["description", "desc", "details"],
    "remarks": ["initial remarks", "remarks", "notes", "comment"],
    "status": ["status", "state"],
    "open_date": ["open date", "discovery date", "detected date", "date"],
    "close_date": ["close date", "closure date", "remediation date"],
    "impact": ["impact", "severity impact"]
}

router = APIRouter()


@router.post("/bulk-upload")
async def bulk_upload_vulnerabilities(
    *,
    db: AsyncSession = Depends(get_session),
    file: UploadFile = File(...)
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload an Excel file (.xlsx or .xls)"
        )

    app_name = file.filename.rsplit(".", 1)[0]

    try:
        content = await file.read()
        df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        logger.error(f"Error reading Excel file: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading Excel file: {str(e)}"
        )

    df.columns = [str(c).strip().lower() for c in df.columns]

    found_mapping = {}
    for tech_name, variations in VULN_COLUMN_MAPPING.items():
        for var in variations:
            if var.lower() in df.columns:
                found_mapping[tech_name] = var.lower()
                break

    required_fields = ["name", "category"]
    missing = [f for f in required_fields if f not in found_mapping]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required columns: {', '.join([m.capitalize() for m in missing])}"
        )

    try:
        stmt = select(Application).where(Application.name == app_name)
        result = await db.execute(stmt)
        existing_app = result.scalars().first()

        if existing_app:
            app_id = existing_app.id
            logger.info(f"Using existing application: {app_name} (ID: {app_id})")
        else:
            new_app = Application(
                name=app_name,
                application_type=ApplicationType.WEB_APPLICATION,
                risk_level=ModelRiskLevel.MEDIUM
            )
            db.add(new_app)
            await db.flush()
            app_id = new_app.id
            logger.info(f"Created new application: {app_name} (ID: {app_id})")
    except Exception as e:
        logger.error(f"Error handling application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to handle application for vulnerabilities"
        )

    total = len(df)
    success = 0
    failed = 0
    successful_vulns = []
    errors = []

    severity_map = {
        "critical": ModelRiskLevel.CRITICAL,
        "high": ModelRiskLevel.HIGH,
        "medium": ModelRiskLevel.MEDIUM,
        "low": ModelRiskLevel.LOW
    }

    status_map = {
        "open": VulnerabilityStatus.OPEN,
        "closed": VulnerabilityStatus.CLOSED,
        "in progress": VulnerabilityStatus.IN_PROGRESS,
        "resolved": VulnerabilityStatus.CLOSED,
        "fixed": VulnerabilityStatus.CLOSED
    }

    vulnerabilities = []
    for idx, row in df.iterrows():
        row_errors = []

        name = str(row.get(found_mapping.get("name"), "")).strip() if "name" in found_mapping else ""
        category_str = str(row.get(found_mapping.get("category"), "")).strip().lower() if "category" in found_mapping else ""
        description = str(row.get(found_mapping.get("description"), "")).strip() if "description" in found_mapping else ""
        remarks = str(row.get(found_mapping.get("remarks"), "")).strip() if "remarks" in found_mapping else ""
        status_str = str(row.get(found_mapping.get("status"), "")).strip().lower() if "status" in found_mapping else ""
        open_date_val = row.get(found_mapping.get("open_date"))
        close_date_val = row.get(found_mapping.get("close_date"))
        impact = str(row.get(found_mapping.get("impact"), "")).strip() if "impact" in found_mapping else ""

        if not name or name == "nan":
            row_errors.append("Vulnerability Name is required")

        severity = severity_map.get(category_str, ModelRiskLevel.MEDIUM)
        vuln_status = status_map.get(status_str, VulnerabilityStatus.OPEN)

        def parse_date(val):
            if pd.isna(val) or str(val).strip().lower() == "nan":
                return None
            if isinstance(val, (datetime, pd.Timestamp)):
                if val.tzinfo is None:
                    return val.replace(tzinfo=timezone.utc)
                return val
            try:
                dt = pd.to_datetime(val)
                if dt.tzinfo is None:
                    return dt.replace(tzinfo=timezone.utc)
                return dt
            except Exception:
                return None

        open_date = parse_date(open_date_val) or datetime.now(timezone.utc)
        close_date = parse_date(close_date_val)

        if row_errors:
            failed += 1
            errors.append({"row": idx + 2, "name": name, "errors": row_errors})
            continue

        try:
            vuln = Vulnerability(
                title=name,
                severity=severity,
                description=description if description != "nan" else None,
                impact=impact if impact != "nan" else None,
                remarks=remarks if remarks != "nan" else None,
                status=vuln_status,
                discovered_date=open_date,
                remediation_completed=close_date,
                application_id=app_id,
                source="Bulk Upload"
            )
            vulnerabilities.append(vuln)
            successful_vulns.append(name)
            success += 1
        except Exception as e:
            failed += 1
            errors.append({"row": idx + 2, "name": name, "errors": [str(e)]})

    if vulnerabilities:
        try:
            db.add_all(vulnerabilities)
            await db.flush()
        except Exception as e:
            logger.error(f"Database error during bulk insert: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save vulnerabilities to database"
            )

    return {
        "application_id": app_id,
        "application_name": app_name,
        "total": total,
        "success": success,
        "failed": failed,
        "successful_vulnerabilities": successful_vulns,
        "errors": errors
    }


@router.post("/", response_model=VulnerabilityResponse, status_code=status.HTTP_201_CREATED)
async def create_vulnerability(
    *,
    db: AsyncSession = Depends(get_session),
    vulnerability_in: VulnerabilityCreate
):
    return await vulnerability_service.create_vulnerability(
        db=db,
        vulnerability_in=vulnerability_in
    )


@router.get("/", response_model=VulnerabilityListResponse)
async def get_vulnerabilities(
    *,
    db: AsyncSession = Depends(get_session),
    search: Optional[str] = Query(None, description="Search in title, description, CVE ID"),
    status_filter: Optional[VulnerabilityStatusEnum] = Query(None, alias="status", description="Filter by status"),
    severity: Optional[RiskLevel] = Query(None, description="Filter by severity"),
    application_id: Optional[int] = Query(None, description="Filter by application ID"),
    vendor_id: Optional[int] = Query(None, description="Filter by vendor ID"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Page size")
):
    filters = VulnerabilityFilterParams(
        search=search,
        status=status_filter,
        severity=severity,
        application_id=application_id,
        vendor_id=vendor_id,
        page=page,
        size=size
    )

    return await vulnerability_service.get_vulnerabilities(db=db, filters=filters)


@router.get("/statistics", response_model=VulnerabilityStatistics)
async def get_vulnerability_statistics(
    *,
    db: AsyncSession = Depends(get_session),
    application_id: Optional[int] = Query(None, description="Filter by application ID")
):
    return await vulnerability_service.get_statistics(
        db=db,
        application_id=application_id
    )


@router.get("/{vulnerability_id}", response_model=VulnerabilityResponse)
async def get_vulnerability(
    *,
    db: AsyncSession = Depends(get_session),
    vulnerability_id: int
):
    return await vulnerability_service.get_vulnerability_by_id(
        db=db,
        vulnerability_id=vulnerability_id
    )


@router.put("/{vulnerability_id}", response_model=VulnerabilityResponse)
async def update_vulnerability(
    *,
    db: AsyncSession = Depends(get_session),
    vulnerability_id: int,
    vulnerability_in: VulnerabilityUpdate
):
    return await vulnerability_service.update_vulnerability(
        db=db,
        vulnerability_id=vulnerability_id,
        vulnerability_in=vulnerability_in
    )


@router.put("/{vulnerability_id}/status", response_model=VulnerabilityResponse)
async def update_vulnerability_status(
    *,
    db: AsyncSession = Depends(get_session),
    vulnerability_id: int,
    status_update: VulnerabilityStatusUpdate
):
    return await vulnerability_service.update_vulnerability_status(
        db=db,
        vulnerability_id=vulnerability_id,
        new_status=status_update.status
    )


@router.put("/{vulnerability_id}/remarks", response_model=VulnerabilityResponse)
async def update_vulnerability_remarks(
    *,
    db: AsyncSession = Depends(get_session),
    vulnerability_id: int,
    remarks_update: VulnerabilityRemarksUpdate
):
    return await vulnerability_service.update_vulnerability_remarks(
        db=db,
        vulnerability_id=vulnerability_id,
        remarks=remarks_update.remarks
    )


@router.post("/{vulnerability_id}/poc-upload", response_model=POCUploadResponse)
async def upload_poc_file(
    *,
    db: AsyncSession = Depends(get_session),
    vulnerability_id: int,
    file: UploadFile = File(...)
):
    return await vulnerability_service.upload_poc_file(
        db=db,
        vulnerability_id=vulnerability_id,
        file=file
    )


@router.get("/{vulnerability_id}/poc")
async def download_poc_file(
    *,
    db: AsyncSession = Depends(get_session),
    vulnerability_id: int
):
    vulnerability = await vulnerability_service.get_vulnerability_by_id(
        db=db,
        vulnerability_id=vulnerability_id
    )
    path = getattr(vulnerability, "poc_file_path", None) if vulnerability else None
    if not path or not os.path.isfile(path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POC file not found")
    return FileResponse(path, filename=os.path.basename(path), media_type="application/octet-stream")


@router.delete("/{vulnerability_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vulnerability(
    *,
    db: AsyncSession = Depends(get_session),
    vulnerability_id: int
):
    from app.crud.crud_vulnerability import vulnerability as vulnerability_crud
    deleted = await vulnerability_crud.remove(db=db, id=vulnerability_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vulnerability with ID {vulnerability_id} not found"
        )
    return None


@router.get("/dashboard/summary")
async def get_vulnerability_dashboard(
    db: AsyncSession = Depends(get_session)
):
    return {
        "applications": [
            {
                "id": "1",
                "name": "Customer Portal",
                "vulnerabilities": {"critical": 3, "high": 7, "medium": 12, "low": 5},
                "riskLevel": "high",
                "criticalDelayDays": 45
            },
            {
                "id": "2",
                "name": "Payment Gateway",
                "vulnerabilities": {"critical": 1, "high": 4, "medium": 8, "low": 12},
                "riskLevel": "medium",
                "criticalDelayDays": 15
            }
        ],
        "delayedVulnerabilities": [
            {"timeFrame": "0-30", "critical": 3, "high": 12, "medium": 18, "low": 24},
            {"timeFrame": "30-60", "critical": 5, "high": 8, "medium": 15, "low": 10},
            {"timeFrame": "60-90", "critical": 2, "high": 6, "medium": 9, "low": 7},
            {"timeFrame": "90+", "critical": 3, "high": 4, "medium": 6, "low": 3}
        ],
        "overallVulnerabilityStatus": [
            {"name": "Open", "value": 146, "color": "#ff6384"},
            {"name": "Closed", "value": 198, "color": "#36a2eb"}
        ]
    }
