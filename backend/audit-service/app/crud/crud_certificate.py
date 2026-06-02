from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from datetime import date

from app.crud.base import CRUDBase
from app.models.models import VendorCertificate, ComplianceStatus
from app.schemas.certificate import VendorCertificateCreate, VendorCertificateUpdate


class CRUDCertificate(CRUDBase[VendorCertificate, VendorCertificateCreate, VendorCertificateUpdate]):
    """CRUD operations for vendor certificates"""
    
    async def get_by_vendor(
        self, 
        db: AsyncSession, 
        vendor_id: int,
        active_only: bool = False
    ) -> List[VendorCertificate]:
        """Get all certificates for a vendor"""
        query = select(VendorCertificate).where(VendorCertificate.vendor_id == vendor_id)
        
        if active_only:
            # Only get non-expired certificates
            query = query.where(VendorCertificate.expiry_date >= date.today())
        
        query = query.order_by(VendorCertificate.expiry_date.desc())
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_by_application(
        self, 
        db: AsyncSession, 
        application_id: int
    ) -> List[VendorCertificate]:
        """Get all certificates for an application"""
        query = (
            select(VendorCertificate)
            .where(VendorCertificate.application_id == application_id)
            .order_by(VendorCertificate.expiry_date.desc())
        )
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_expiring_soon(
        self, 
        db: AsyncSession, 
        days: int = 30
    ) -> List[VendorCertificate]:
        """Get certificates expiring within specified days"""
        from datetime import timedelta
        expiry_threshold = date.today() + timedelta(days=days)
        
        query = (
            select(VendorCertificate)
            .where(
                and_(
                    VendorCertificate.expiry_date <= expiry_threshold,
                    VendorCertificate.expiry_date >= date.today(),
                    VendorCertificate.status == ComplianceStatus.COMPLIANT
                )
            )
            .order_by(VendorCertificate.expiry_date.asc())
        )
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_expired(
        self, 
        db: AsyncSession
    ) -> List[VendorCertificate]:
        """Get all expired certificates"""
        query = (
            select(VendorCertificate)
            .where(VendorCertificate.expiry_date < date.today())
            .order_by(VendorCertificate.expiry_date.desc())
        )
        result = await db.execute(query)
        return result.scalars().all()
    
    async def create(self, db: AsyncSession, *, obj_in) -> VendorCertificate:
        """Create a certificate, stripping any fields not on the model."""
        if isinstance(obj_in, dict):
            data = obj_in
        else:
            data = obj_in.model_dump(exclude_unset=True)

        # Remove keys that don't exist as columns on the model to avoid
        # 'invalid keyword argument' errors (e.g. application_id when disabled)
        valid_columns = {c.key for c in VendorCertificate.__table__.columns}
        data = {k: v for k, v in data.items() if k in valid_columns}

        db_obj = VendorCertificate(**data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_expired_statuses(self, db: AsyncSession) -> int:
        """Update status of expired certificates"""
        from sqlalchemy import update
        
        stmt = (
            update(VendorCertificate)
            .where(
                and_(
                    VendorCertificate.expiry_date < date.today(),
                    VendorCertificate.status == ComplianceStatus.COMPLIANT
                )
            )
            .values(status=ComplianceStatus.NON_COMPLIANT)
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount


certificate_crud = CRUDCertificate(VendorCertificate)
