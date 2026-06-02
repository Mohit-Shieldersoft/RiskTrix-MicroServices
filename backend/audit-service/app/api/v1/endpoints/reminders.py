"""
Reminders endpoint - derives vendor and exception reminders from audit-service DB.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import List
from datetime import date, timedelta

from app.db.session import get_session
from app.models.models import Vendor, VendorCertificate, Exception as ExceptionModel

router = APIRouter()


# ── Response schemas ──────────────────────────────────────────────────────────

class VendorReminder(BaseModel):
    id: str
    vendorName: str
    nonCompliantApps: int
    delayDays: int
    sentCount: int = 0


class ApplicationReminder(BaseModel):
    id: str
    owner: str
    application: str
    delayDays: int
    sentCount: int = 0


class ExceptionReminder(BaseModel):
    id: str
    exceptionType: str
    remark: str
    sentCount: int = 0


class ReminderStats(BaseModel):
    vendors: int
    applications: int
    exceptions: int


class FrontendReminderData(BaseModel):
    vendorReminders: List[VendorReminder]
    applicationReminders: List[ApplicationReminder]
    exceptionReminders: List[ExceptionReminder]
    stats: ReminderStats


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.get("/frontend", response_model=FrontendReminderData)
async def get_frontend_reminder_data(
    db: AsyncSession = Depends(get_session)
) -> FrontendReminderData:
    """
    Return reminder data for the Reminder dashboard page.
    - vendorReminders: vendors that are non-compliant or have certs expiring within 60 days
    - exceptionReminders: active exceptions expiring within 45 days
    - applicationReminders: empty (application data lives in application-service)
    """
    today = date.today()
    cert_window = today + timedelta(days=60)
    exc_window = today + timedelta(days=45)

    # ── Vendor reminders ──────────────────────────────────────────────────────
    vendor_stmt = select(Vendor).options(selectinload(Vendor.certificates))
    vendor_result = await db.execute(vendor_stmt)
    vendors = vendor_result.scalars().unique().all()

    vendor_reminders: List[VendorReminder] = []
    for idx, vendor in enumerate(vendors):
        status_val = (
            vendor.compliance_status.value
            if hasattr(vendor.compliance_status, "value")
            else vendor.compliance_status
        )
        is_non_compliant = status_val in {"NON_COMPLIANT", "PENDING"}

        # Check if any cert expires within 60 days
        expiring_certs = [
            c for c in vendor.certificates
            if c.expiry_date and c.expiry_date <= cert_window
        ]
        has_expiring = bool(expiring_certs)

        if not (is_non_compliant or has_expiring):
            continue

        # delayDays: days until nearest cert expiry (or days since last check)
        if expiring_certs:
            nearest = min(c.expiry_date for c in expiring_certs)
            delay_days = max(0, (nearest - today).days)
        elif vendor.certificate_expiry_date and vendor.certificate_expiry_date <= cert_window:
            delay_days = max(0, (vendor.certificate_expiry_date - today).days)
        else:
            delay_days = 0

        vendor_reminders.append(VendorReminder(
            id=f"VR-{idx + 1}",
            vendorName=vendor.name,
            nonCompliantApps=vendor.non_compliant_controls or 0,
            delayDays=delay_days,
            sentCount=0,
        ))

    # ── Exception reminders ───────────────────────────────────────────────────
    exc_stmt = select(ExceptionModel).where(
        ExceptionModel.end_date <= exc_window
    )
    exc_result = await db.execute(exc_stmt)
    exceptions = exc_result.scalars().all()

    exception_reminders: List[ExceptionReminder] = []
    for idx, exc in enumerate(exceptions):
        status_val = (
            exc.status.value if hasattr(exc.status, "value") else exc.status
        )
        # Include ACTIVE expiring soon and EXPIRED
        if status_val not in {"ACTIVE", "EXPIRED"}:
            continue

        category_val = (
            exc.category.value if hasattr(exc.category, "value") else exc.category
        )

        exception_reminders.append(ExceptionReminder(
            id=f"ER-{idx + 1}",
            exceptionType=exc.exception_name or category_val,
            remark=exc.risk_assessment or exc.comments or "",
            sentCount=0,
        ))

    return FrontendReminderData(
        vendorReminders=vendor_reminders,
        applicationReminders=[],  # application-service owns this data
        exceptionReminders=exception_reminders,
        stats=ReminderStats(
            vendors=len(vendor_reminders),
            applications=0,
            exceptions=len(exception_reminders),
        ),
    )
