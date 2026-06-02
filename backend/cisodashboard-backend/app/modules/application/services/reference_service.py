"""Application domain read helpers for cross-module access."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import (
    Application,
    ApplicationType,
    RiskLevel,
    Vulnerability,
    VulnerabilityStatus,
)


class ApplicationReferenceService:
    """Controlled access to application-owned entities for other modules."""

    @staticmethod
    async def get_applications(
        db: AsyncSession,
        *,
        owners_only: bool = False,
        with_certificates: bool = False,
    ) -> list[Application]:
        query = select(Application)
        if with_certificates:
            query = query.options(selectinload(Application.certificates))
        if owners_only:
            query = query.where(Application.owner_id.isnot(None))

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_application_by_id(
        db: AsyncSession,
        application_id: int,
        *,
        with_certificates: bool = False,
    ) -> Optional[Application]:
        query = select(Application).where(Application.id == application_id)
        if with_certificates:
            query = query.options(selectinload(Application.certificates))

        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_application_by_name(
        db: AsyncSession,
        name: str,
    ) -> Optional[Application]:
        result = await db.execute(select(Application).where(Application.name == name))
        return result.scalar_one_or_none()

    @staticmethod
    async def create_application_stub(
        db: AsyncSession,
        *,
        name: str,
        owner_id: Optional[int] = None,
        application_type: ApplicationType = ApplicationType.WEB_APPLICATION,
        risk_level: RiskLevel = RiskLevel.MEDIUM,
    ) -> Application:
        app = Application(
            name=name,
            owner_id=owner_id,
            application_type=application_type,
            risk_level=risk_level,
        )
        db.add(app)
        await db.commit()
        await db.refresh(app)
        return app

    @staticmethod
    async def get_vulnerabilities(
        db: AsyncSession,
        *,
        status: Optional[str | VulnerabilityStatus] = None,
    ) -> list[Vulnerability]:
        query = select(Vulnerability)
        if status is not None:
            status_value = status.value if hasattr(status, "value") else status
            query = query.where(Vulnerability.status == status_value)

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def count_applications_created_in_month(
        db: AsyncSession,
        *,
        month: int,
        year: int,
    ) -> int:
        result = await db.execute(
            select(func.count(Application.id)).where(
                extract("month", Application.created_at) == month,
                extract("year", Application.created_at) == year,
            )
        )
        return result.scalar() or 0

    @staticmethod
    async def count_total_applications(db: AsyncSession) -> int:
        result = await db.execute(select(func.count(Application.id)))
        return result.scalar() or 0

    @staticmethod
    async def count_vulnerabilities_created_in_month(
        db: AsyncSession,
        *,
        month: int,
        year: int,
    ) -> int:
        result = await db.execute(
            select(func.count(Vulnerability.id)).where(
                extract("month", Vulnerability.created_at) == month,
                extract("year", Vulnerability.created_at) == year,
            )
        )
        return result.scalar() or 0

    @staticmethod
    async def count_total_vulnerabilities(db: AsyncSession) -> int:
        result = await db.execute(select(func.count(Vulnerability.id)))
        return result.scalar() or 0


application_reference_service = ApplicationReferenceService()
