"""
Activity Service Stub for Audit Service
This is a temporary stub that logs activity instead of persisting to database.
TODO: Implement proper activity logging via events or HTTP calls to shared service.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


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
    """
    Log vendor-related activity.
    
    This is a stub implementation that only logs to application logs.
    In production, this should publish an event or call a shared activity service.
    """
    logger.info(
        f"ACTIVITY: {activity_type} | Vendor: {vendor_name} ({vendor_id}) | "
        f"User: {user_name} ({user_id}) | {description}"
    )
    if metadata:
        logger.debug(f"Activity metadata: {metadata}")


async def log_vendor_update_activity(
    db: AsyncSession,
    vendor_id: int,
    vendor_name: str,
    updated_fields: Dict[str, Any],
    user_id: Optional[int],
    user_name: str
) -> None:
    """
    Log vendor update activity.
    
    This is a stub implementation that only logs to application logs.
    """
    fields_str = ", ".join(updated_fields.keys())
    logger.info(
        f"ACTIVITY: vendor_updated | Vendor: {vendor_name} ({vendor_id}) | "
        f"User: {user_name} ({user_id}) | Updated fields: {fields_str}"
    )
    logger.debug(f"Updated values: {updated_fields}")


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
    """
    Log exception-related activity.
    
    This is a stub implementation that only logs to application logs.
    """
    logger.info(
        f"ACTIVITY: {activity_type} | Exception: {exception_name} ({exception_id}) | "
        f"Severity: {severity} | User: {user_name} ({user_id}) | {description}"
    )
    if extra_data:
        logger.debug(f"Activity extra data: {extra_data}")


async def log_exception_update_activity(
    db: AsyncSession,
    exception_id: int,
    exception_name: str,
    updated_fields: Dict[str, Any],
    user_id: Optional[int],
    user_name: str
) -> None:
    """
    Log exception update activity.
    
    This is a stub implementation that only logs to application logs.
    """
    fields_str = ", ".join(updated_fields.keys())
    logger.info(
        f"ACTIVITY: exception_updated | Exception: {exception_name} ({exception_id}) | "
        f"User: {user_name} ({user_id}) | Updated fields: {fields_str}"
    )
    logger.debug(f"Updated values: {updated_fields}")


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
    """
    Log certificate-related activity.
    
    This is a stub implementation that only logs to application logs.
    """
    vendor_info = f" | Vendor: {vendor_name} ({vendor_id})" if vendor_id else ""
    logger.info(
        f"ACTIVITY: {activity_type} | Certificate: {certificate_name} ({certificate_id}){vendor_info} | "
        f"User: {user_name} ({user_id}) | {description}"
    )
    if metadata:
        logger.debug(f"Activity metadata: {metadata}")
