"""Persist vendor/exception/certificate activity in schema_audit.audit_logs."""
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any
import logging

from app.models.models import AuditActivityLog

logger = logging.getLogger(__name__)


async def _persist(
    db: AsyncSession,
    activity_type: str,
    entity_type: str,
    entity_id: Optional[int],
    entity_name: Optional[str],
    user_id: Optional[int],
    user_name: Optional[str],
    description: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    try:
        row = AuditActivityLog(
            activity_type=activity_type,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            user_id=user_id,
            user_name=user_name,
            description=description,
            extra_metadata=metadata or {},
        )
        db.add(row)
        await db.commit()
    except Exception as exc:
        logger.error("Failed to persist activity log: %s", exc)


async def log_vendor_activity(
    db: AsyncSession,
    activity_type: str,
    vendor_id: int,
    vendor_name: str,
    user_id: Optional[int],
    user_name: str,
    description: str,
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    logger.info(
        f"ACTIVITY: {activity_type} | Vendor: {vendor_name} ({vendor_id}) | "
        f"User: {user_name} ({user_id}) | {description}"
    )
    await _persist(db, activity_type, "vendor", vendor_id, vendor_name, user_id, user_name, description, metadata)


async def log_vendor_update_activity(
    db: AsyncSession,
    vendor_id: int,
    vendor_name: str,
    updated_fields: Dict[str, Any],
    user_id: Optional[int],
    user_name: str
) -> None:
    fields_str = ", ".join(updated_fields.keys())
    description = f"Updated fields: {fields_str}"
    logger.info(
        f"ACTIVITY: vendor_updated | Vendor: {vendor_name} ({vendor_id}) | "
        f"User: {user_name} ({user_id}) | {description}"
    )
    await _persist(db, "vendor_updated", "vendor", vendor_id, vendor_name, user_id, user_name, description, updated_fields)


async def log_exception_activity(
    db: AsyncSession,
    activity_type: str,
    exception_id: int,
    exception_name: str,
    severity: str,
    user_id: Optional[int],
    user_name: str,
    description: str,
    extra_data: Optional[Dict[str, Any]] = None
) -> None:
    logger.info(
        f"ACTIVITY: {activity_type} | Exception: {exception_name} ({exception_id}) | "
        f"Severity: {severity} | User: {user_name} ({user_id}) | {description}"
    )
    meta = {"severity": severity, **(extra_data or {})}
    await _persist(db, activity_type, "exception", exception_id, exception_name, user_id, user_name, description, meta)


async def log_exception_update_activity(
    db: AsyncSession,
    exception_id: int,
    exception_name: str,
    updated_fields: Dict[str, Any],
    user_id: Optional[int],
    user_name: str
) -> None:
    fields_str = ", ".join(updated_fields.keys())
    description = f"Updated fields: {fields_str}"
    logger.info(
        f"ACTIVITY: exception_updated | Exception: {exception_name} ({exception_id}) | "
        f"User: {user_name} ({user_id}) | {description}"
    )
    await _persist(db, "exception_updated", "exception", exception_id, exception_name, user_id, user_name, description, updated_fields)


async def log_certificate_activity(
    db: AsyncSession,
    activity_type: str,
    certificate_id: int,
    certificate_name: str,
    vendor_id: Optional[int],
    vendor_name: Optional[str],
    user_id: Optional[int],
    user_name: str,
    description: str,
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    vendor_info = f" | Vendor: {vendor_name} ({vendor_id})" if vendor_id else ""
    logger.info(
        f"ACTIVITY: {activity_type} | Certificate: {certificate_name} ({certificate_id}){vendor_info} | "
        f"User: {user_name} ({user_id}) | {description}"
    )
    meta = {"vendor_id": vendor_id, "vendor_name": vendor_name, **(metadata or {})}
    await _persist(db, activity_type, "certificate", certificate_id, certificate_name, user_id, user_name, description, meta)
