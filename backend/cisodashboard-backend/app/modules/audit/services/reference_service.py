"""Audit domain read helpers for cross-module access."""

from __future__ import annotations

from datetime import date
from typing import Iterable, Optional

from sqlalchemy import and_, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import (
    ComplianceStatus,
    Exception as ExceptionModel,
    Vendor,
    VendorComplianceRecord,
)


class AuditReferenceService:
    """Controlled access to audit-owned entities for other modules."""

    @staticmethod
    async def get_vendors(
        db: AsyncSession,
        *,
        compliance_status: Optional[str | ComplianceStatus] = None,
        expiring_before: Optional[date] = None,
        with_certificates: bool = False,
    ) -> list[Vendor]:
        query = select(Vendor)
        if with_certificates:
            query = query.options(selectinload(Vendor.certificates))

        conditions = []
        if compliance_status is not None:
            status_value = compliance_status.value if hasattr(compliance_status, "value") else compliance_status
            conditions.append(Vendor.compliance_status == status_value)
        if expiring_before is not None:
            conditions.append(
                and_(
                    Vendor.certificate_expiry_date.isnot(None),
                    Vendor.certificate_expiry_date <= expiring_before,
                )
            )
        if conditions:
            query = query.where(and_(*conditions))

        result = await db.execute(query.order_by(Vendor.certificate_expiry_date))
        return list(result.scalars().all())

    @staticmethod
    async def get_vendor_by_id(
        db: AsyncSession,
        vendor_id: int,
        *,
        with_certificates: bool = False,
    ) -> Optional[Vendor]:
        query = select(Vendor).where(Vendor.id == vendor_id)
        if with_certificates:
            query = query.options(selectinload(Vendor.certificates))

        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_exceptions(
        db: AsyncSession,
        *,
        statuses: Optional[Iterable[str]] = None,
    ) -> list[ExceptionModel]:
        query = select(ExceptionModel)
        if statuses:
            query = query.where(ExceptionModel.status.in_(list(statuses)))

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_exception_by_id(
        db: AsyncSession,
        exception_id: int,
    ) -> Optional[ExceptionModel]:
        result = await db.execute(select(ExceptionModel).where(ExceptionModel.id == exception_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_non_compliant_vendor_records(
        db: AsyncSession,
        *,
        vendor_id: int,
    ) -> list[VendorComplianceRecord]:
        result = await db.execute(
            select(VendorComplianceRecord).where(
                VendorComplianceRecord.vendor_id == vendor_id,
                VendorComplianceRecord.status == ComplianceStatus.NON_COMPLIANT,
            )
        )
        return list(result.scalars().all())

    @staticmethod
    async def count_exceptions_created_in_month(
        db: AsyncSession,
        *,
        month: int,
        year: int,
    ) -> int:
        result = await db.execute(
            select(func.count(ExceptionModel.id)).where(
                extract("month", ExceptionModel.created_at) == month,
                extract("year", ExceptionModel.created_at) == year,
            )
        )
        return result.scalar() or 0

    @staticmethod
    async def count_total_exceptions(db: AsyncSession) -> int:
        result = await db.execute(select(func.count(ExceptionModel.id)))
        return result.scalar() or 0


audit_reference_service = AuditReferenceService()
