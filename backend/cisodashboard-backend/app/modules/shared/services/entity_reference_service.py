"""Compatibility wrapper around domain-owned reference services."""

from __future__ import annotations

from typing import Iterable, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import ApplicationType, ComplianceStatus, RiskLevel, User, VulnerabilityStatus
from app.modules.application.services.reference_service import application_reference_service
from app.modules.audit.services.reference_service import audit_reference_service


class EntityReferenceService:
    """Legacy transitional access points kept for compatibility during Phase 3."""

    @staticmethod
    async def get_applications(
        db: AsyncSession,
        *,
        owners_only: bool = False,
        with_certificates: bool = False,
    ):
        return await application_reference_service.get_applications(
            db,
            owners_only=owners_only,
            with_certificates=with_certificates,
        )

    @staticmethod
    async def get_application_by_name(
        db: AsyncSession,
        name: str,
    ):
        return await application_reference_service.get_application_by_name(db, name)

    @staticmethod
    async def create_application_stub(
        db: AsyncSession,
        *,
        name: str,
        owner_id: Optional[int] = None,
        application_type: ApplicationType = ApplicationType.WEB_APPLICATION,
        risk_level: RiskLevel = RiskLevel.MEDIUM,
    ):
        return await application_reference_service.create_application_stub(
            db,
            name=name,
            owner_id=owner_id,
            application_type=application_type,
            risk_level=risk_level,
        )

    @staticmethod
    async def get_vulnerabilities(
        db: AsyncSession,
        *,
        status: Optional[VulnerabilityStatus] = None,
    ):
        return await application_reference_service.get_vulnerabilities(db, status=status)

    @staticmethod
    async def get_users_by_ids(
        db: AsyncSession,
        user_ids: Iterable[int],
    ) -> dict[int, User]:
        ids = [user_id for user_id in user_ids if user_id]
        if not ids:
            return {}

        result = await db.execute(select(User).where(User.id.in_(ids)))
        return {user.id: user for user in result.scalars().all()}

    @staticmethod
    async def get_vendors(
        db: AsyncSession,
        *,
        compliance_status: Optional[ComplianceStatus] = None,
        expiring_before=None,
    ):
        return await audit_reference_service.get_vendors(
            db,
            compliance_status=compliance_status,
            expiring_before=expiring_before,
        )

    @staticmethod
    async def get_vendor_by_id(
        db: AsyncSession,
        vendor_id: int,
    ):
        return await audit_reference_service.get_vendor_by_id(db, vendor_id)

    @staticmethod
    async def get_exceptions(
        db: AsyncSession,
        *,
        statuses: Optional[Iterable[str]] = None,
    ):
        return await audit_reference_service.get_exceptions(db, statuses=statuses)


entity_reference_service = EntityReferenceService()
