from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from io import BytesIO
import pandas as pd
import logging
from typing import Optional, List

from app.db.session import get_session
from app.models.models import Application, ApplicationType
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ApplicationListResponse,
    ApplicationFilterParams,
    ApplicationStatistics,
    ApplicationTypeEnum,
    RiskLevelEnum
)
from app.services.application_service import application_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/bulk-upload")
async def bulk_upload_applications(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_session)
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload an Excel file (.xlsx or .xls)."
        )

    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
    except Exception as e:
        logger.error(f"Failed to read Excel file: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read Excel file: {str(e)}"
        )
 
    column_mapping = {
        "name": ["Application Name", "App Name", "Name"],
        "type": ["Application Type", "App Type", "Type"],
        "owner": ["Owner"],
        "vendor": ["Vendor", "Vendor Name"],
        "description": ["Description", "App Description"],
        "url": ["URL", "Link", "App URL"]
    }

    found_mapping = {}
    missing = []

    for tech_name, variations in column_mapping.items():
        found = False
        for var in variations:
            if var in df.columns:
                found_mapping[tech_name] = var
                found = True
                break
            for col in df.columns:
                if str(col).strip().lower() == var.lower():
                    found_mapping[tech_name] = col
                    found = True
                    break
            if found:
                break

        if not found and tech_name in ["name", "type"]:
            missing.append(variations[0])

    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required columns: {', '.join(missing)}"
        )

    existing_apps_query = await db.execute(select(Application.name, Application.url))
    existing_rows = existing_apps_query.all()
    existing_names = set(row[0] for row in existing_rows)

    type_map = {
        "web": ApplicationType.WEB_APPLICATION,
        "mobile": ApplicationType.MOBILE_APPLICATION,
        "desktop": ApplicationType.DESKTOP_APPLICATION,
        "api": ApplicationType.API_SERVICE,
        "database": ApplicationType.DATABASE,
        "infrastructure": ApplicationType.INFRASTRUCTURE,
        "third party": ApplicationType.THIRD_PARTY,
        "external": ApplicationType.WEB_APPLICATION,
        "internal": ApplicationType.WEB_APPLICATION,
    }

    total = len(df)
    success = 0
    failed = 0
    successful_apps = []
    errors = []
    new_apps = []

    for idx, row in df.iterrows():
        row_errors = []

        name = str(row.get(found_mapping.get("name"), "")).strip() if "name" in found_mapping else ""
        app_type_str = str(row.get(found_mapping.get("type"), "")).strip().lower() if "type" in found_mapping else ""
        owner = str(row.get(found_mapping.get("owner"), "")).strip() if "owner" in found_mapping else ""
        vendor = str(row.get(found_mapping.get("vendor"), "")).strip() if "vendor" in found_mapping else ""
        description = str(row.get(found_mapping.get("description"), "")).strip() if "description" in found_mapping else ""
        url = str(row.get(found_mapping.get("url"), "")).strip() if "url" in found_mapping else ""

        if not name:
            row_errors.append("Application Name is required")

        if name and name in existing_names:
            row_errors.append(f"Application with name '{name}' already exists")

        app_type = type_map.get(app_type_str)
        if not app_type:
            for enum_val in ApplicationType:
                if enum_val.value == app_type_str.replace(" ", "_"):
                    app_type = enum_val
                    break
            if not app_type:
                app_type = ApplicationType.WEB_APPLICATION

        if row_errors:
            failed += 1
            errors.append({"row": idx + 2, "name": name, "errors": row_errors})
            continue

        try:
            app = Application(
                name=name,
                application_type=app_type,
                owner=owner if owner else None,
                vendor_name=vendor if vendor else None,
                description=description if description else None,
                url=url if url else None,
                risk_level="medium"
            )
            new_apps.append(app)
            existing_names.add(name)
            successful_apps.append(name)
            success += 1
        except Exception as e:
            failed += 1
            errors.append({"row": idx + 2, "name": name, "errors": [str(e)]})

    if new_apps:
        db.add_all(new_apps)
        # Don't commit here - let the session dependency handle it
        logger.info(f"Bulk upload prepared: {success} applications to be saved")

    return {
        "total": total,
        "success": success,
        "failed": failed,
        "successful_apps": successful_apps,
        "errors": errors
    }


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    *,
    db: AsyncSession = Depends(get_session),
    application_in: ApplicationCreate
):
    return await application_service.create_application(
        db=db,
        application_in=application_in
    )


@router.get("/", response_model=ApplicationListResponse)
async def get_applications(
    *,
    db: AsyncSession = Depends(get_session),
    search: Optional[str] = Query(None, description="Search in name, description, owner"),
    type: Optional[ApplicationTypeEnum] = Query(None, description="Filter by application type"),
    risk_level: Optional[RiskLevelEnum] = Query(None, description="Filter by risk level"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Page size")
):
    filters = ApplicationFilterParams(
        search=search,
        type=type,
        risk_level=risk_level,
        page=page,
        size=size
    )

    return await application_service.get_applications(db=db, filters=filters)


@router.get("/statistics", response_model=ApplicationStatistics)
async def get_application_statistics(
    *,
    db: AsyncSession = Depends(get_session)
):
    return await application_service.get_statistics(db=db)


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    *,
    db: AsyncSession = Depends(get_session),
    application_id: int
):
    return await application_service.get_application_by_id(
        db=db,
        application_id=application_id
    )


@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    *,
    db: AsyncSession = Depends(get_session),
    application_id: int,
    application_in: ApplicationUpdate
):
    return await application_service.update_application(
        db=db,
        application_id=application_id,
        application_in=application_in
    )


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    *,
    db: AsyncSession = Depends(get_session),
    application_id: int
):
    await application_service.delete_application(
        db=db,
        application_id=application_id
    )
    return None
