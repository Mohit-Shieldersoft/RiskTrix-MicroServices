"""Event handlers for creating activity logs from domain events.

These handlers subscribe to domain events and create corresponding activity
log entries for auditing and tracking purposes.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.events import DomainEvent, event_bus
from app.modules.application.events import (
    ApplicationCreated, ApplicationUpdated, ApplicationDeleted,
    VulnerabilityCreated, VulnerabilityUpdated, VulnerabilityClosed,
    ApplicationReminderSent
)
from app.modules.audit.events import (
    VendorCreated, VendorUpdated, VendorDeleted, VendorComplianceUpdated,
    CertificateCreated, CertificateExpiring,
    ExceptionCreated, ExceptionUpdated, ExceptionApproved, ExceptionRejected, ExceptionExpired,
    AssessmentCreated, AssessmentCompleted, ComplianceRecordCreated,
    VendorReminderSent, ExceptionReminderSent
)
from app.schemas.activity_log import ActivityLogCreate
from app.models.models import ActivityType, ActivityPriority
from app.modules.shared.services.activity_service import ActivityLogService

logger = logging.getLogger(__name__)


# ============================================================================
# Application Event Handlers
# ============================================================================

async def handle_application_created(event: ApplicationCreated, db: AsyncSession) -> None:
    """Create activity log when an application is created."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.APPLICATION_CREATED,
        priority=ActivityPriority.MEDIUM,
        title=f"Application '{event.application_name}' created",
        description=f"New application added to the system",
        user_id=event.user_id,
        entity_type="application",
        entity_id=event.application_id,
        entity_name=event.application_name,
        extra_data={
            "application_type": event.application_type,
            "risk_level": event.risk_level
        },
        tags=["application", "created"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


async def handle_application_updated(event: ApplicationUpdated, db: AsyncSession) -> None:
    """Create activity log when an application is updated."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.APPLICATION_UPDATED,
        priority=ActivityPriority.LOW,
        title=f"Application '{event.application_name}' updated",
        description=f"Application details modified",
        user_id=event.user_id,
        entity_type="application",
        entity_id=event.application_id,
        entity_name=event.application_name,
        extra_data={"changes": event.changes},
        tags=["application", "updated"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


async def handle_application_deleted(event: ApplicationDeleted, db: AsyncSession) -> None:
    """Create activity log when an application is deleted."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.APPLICATION_DELETED,
        priority=ActivityPriority.HIGH,
        title=f"Application '{event.application_name}' deleted",
        description=f"Application removed from the system",
        user_id=event.user_id,
        entity_type="application",
        entity_id=event.application_id,
        entity_name=event.application_name,
        tags=["application", "deleted"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


async def handle_vulnerability_created(event: VulnerabilityCreated, db: AsyncSession) -> None:
    """Create activity log when a vulnerability is created."""
    title = f"Vulnerability {event.cve_id or f'#{event.vulnerability_id}'} created"
    activity = ActivityLogCreate(
        activity_type=ActivityType.VULNERABILITY_CREATED,
        priority=ActivityPriority.HIGH if event.severity in ["CRITICAL", "HIGH"] else ActivityPriority.MEDIUM,
        title=title,
        description=f"New vulnerability added for {event.application_name}",
        user_id=event.user_id,
        entity_type="vulnerability",
        entity_id=event.vulnerability_id,
        entity_name=event.cve_id or f"Vulnerability #{event.vulnerability_id}",
        extra_data={
            "application_id": event.application_id,
            "application_name": event.application_name,
            "severity": event.severity,
            "cve_id": event.cve_id
        },
        tags=["vulnerability", "created", event.severity.lower() if event.severity else "unknown"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


async def handle_vulnerability_updated(event: VulnerabilityUpdated, db: AsyncSession) -> None:
    """Create activity log when a vulnerability is updated."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.VULNERABILITY_UPDATED,
        priority=ActivityPriority.MEDIUM,
        title=f"Vulnerability updated for {event.application_name}",
        description=f"Vulnerability details modified",
        user_id=event.user_id,
        entity_type="vulnerability",
        entity_id=event.vulnerability_id,
        extra_data={
            "application_id": event.application_id,
            "application_name": event.application_name,
            "changes": event.changes
        },
        tags=["vulnerability", "updated"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


async def handle_vulnerability_closed(event: VulnerabilityClosed, db: AsyncSession) -> None:
    """Create activity log when a vulnerability is closed."""
    title = f"Vulnerability {event.cve_id or f'#{event.vulnerability_id}'} closed"
    activity = ActivityLogCreate(
        activity_type=ActivityType.VULNERABILITY_CLOSED,
        priority=ActivityPriority.MEDIUM,
        title=title,
        description=f"Vulnerability resolved for {event.application_name}",
        user_id=event.user_id,
        entity_type="vulnerability",
        entity_id=event.vulnerability_id,
        entity_name=event.cve_id or f"Vulnerability #{event.vulnerability_id}",
        extra_data={
            "application_id": event.application_id,
            "application_name": event.application_name,
            "closure_reason": event.closure_reason
        },
        tags=["vulnerability", "closed"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


async def handle_application_reminder_sent(event: ApplicationReminderSent, db: AsyncSession) -> None:
    """Create activity log when an application reminder is sent."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.REMINDER_SENT,
        priority=ActivityPriority.LOW,
        title=f"Reminder sent for {event.application_name}",
        description=f"{event.reminder_type} reminder sent to {len(event.recipients)} recipient(s)",
        user_id=event.user_id,
        entity_type="application",
        entity_id=event.application_id,
        entity_name=event.application_name,
        extra_data={
            "reminder_id": event.reminder_id,
            "reminder_type": event.reminder_type,
            "recipients": event.recipients
        },
        tags=["reminder", "application"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


# ============================================================================
# Audit/Vendor Event Handlers
# ============================================================================

async def handle_vendor_created(event: VendorCreated, db: AsyncSession) -> None:
    """Create activity log when a vendor is created."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.VENDOR_CREATED,
        priority=ActivityPriority.MEDIUM,
        title=f"Vendor '{event.vendor_name}' created",
        description=f"New vendor added to the system",
        user_id=event.user_id,
        entity_type="vendor",
        entity_id=event.vendor_id,
        entity_name=event.vendor_name,
        extra_data={"risk_level": event.risk_level},
        tags=["vendor", "created"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


async def handle_vendor_updated(event: VendorUpdated, db: AsyncSession) -> None:
    """Create activity log when a vendor is updated."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.VENDOR_UPDATED,
        priority=ActivityPriority.LOW,
        title=f"Vendor '{event.vendor_name}' updated",
        description=f"Vendor details modified",
        user_id=event.user_id,
        entity_type="vendor",
        entity_id=event.vendor_id,
        entity_name=event.vendor_name,
        extra_data={"changes": event.changes},
        tags=["vendor", "updated"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


async def handle_vendor_compliance_updated(event: VendorComplianceUpdated, db: AsyncSession) -> None:
    """Create activity log when vendor compliance status changes."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.VENDOR_COMPLIANCE_UPDATED,
        priority=ActivityPriority.HIGH,
        title=f"Compliance updated for '{event.vendor_name}'",
        description=f"Compliance status changed to {event.compliance_status}",
        user_id=event.user_id,
        entity_type="vendor",
        entity_id=event.vendor_id,
        entity_name=event.vendor_name,
        extra_data={
            "compliance_status": event.compliance_status,
            "standard": event.standard,
            "previous_status": event.previous_status
        },
        tags=["vendor", "compliance", event.compliance_status.lower()]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


async def handle_certificate_created(event: CertificateCreated, db: AsyncSession) -> None:
    """Create activity log when a certificate is uploaded."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.CERTIFICATE_UPLOADED,
        priority=ActivityPriority.MEDIUM,
        title=f"Certificate uploaded for '{event.vendor_name}'",
        description=f"{event.certificate_type} certificate added",
        user_id=event.user_id,
        entity_type="certificate",
        entity_id=event.certificate_id,
        extra_data={
            "vendor_id": event.vendor_id,
            "vendor_name": event.vendor_name,
            "certificate_type": event.certificate_type,
            "expiry_date": event.expiry_date
        },
        tags=["certificate", "uploaded"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


async def handle_certificate_expiring(event: CertificateExpiring, db: AsyncSession) -> None:
    """Create activity log when a certificate is about to expire."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.CERTIFICATE_EXPIRING,
        priority=ActivityPriority.HIGH,
        title=f"Certificate expiring for '{event.vendor_name}'",
        description=f"{event.certificate_type} expires in {event.days_until_expiry} days",
        user_id=event.user_id,
        entity_type="certificate",
        entity_id=event.certificate_id,
        extra_data={
            "vendor_id": event.vendor_id,
            "vendor_name": event.vendor_name,
            "certificate_type": event.certificate_type,
            "expiry_date": event.expiry_date,
            "days_until_expiry": event.days_until_expiry
        },
        tags=["certificate", "expiring", "alert"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


# ============================================================================
# Exception Event Handlers
# ============================================================================

async def handle_exception_created(event: ExceptionCreated, db: AsyncSession) -> None:
    """Create activity log when an exception is created."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.EXCEPTION_CREATED,
        priority=ActivityPriority.HIGH if event.severity in ["CRITICAL", "HIGH"] else ActivityPriority.MEDIUM,
        title=f"Exception '{event.title}' created",
        description=f"{event.category} exception created with {event.severity} severity",
        user_id=event.user_id,
        entity_type="exception",
        entity_id=event.exception_id,
        entity_name=event.title,
        extra_data={
            "category": event.category,
            "severity": event.severity,
            "status": event.status
        },
        tags=["exception", "created", event.severity.lower()]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


async def handle_exception_approved(event: ExceptionApproved, db: AsyncSession) -> None:
    """Create activity log when an exception is approved."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.EXCEPTION_APPROVED,
        priority=ActivityPriority.HIGH,
        title=f"Exception '{event.title}' approved",
        description=f"Exception approved",
        user_id=event.approved_by or event.user_id,
        entity_type="exception",
        entity_id=event.exception_id,
        entity_name=event.title,
        extra_data={"approval_notes": event.approval_notes},
        tags=["exception", "approved"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


async def handle_exception_rejected(event: ExceptionRejected, db: AsyncSession) -> None:
    """Create activity log when an exception is rejected."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.EXCEPTION_REJECTED,
        priority=ActivityPriority.HIGH,
        title=f"Exception '{event.title}' rejected",
        description=f"Exception rejected",
        user_id=event.rejected_by or event.user_id,
        entity_type="exception",
        entity_id=event.exception_id,
        entity_name=event.title,
        extra_data={"rejection_reason": event.rejection_reason},
        tags=["exception", "rejected"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


async def handle_vendor_reminder_sent(event: VendorReminderSent, db: AsyncSession) -> None:
    """Create activity log when a vendor reminder is sent."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.REMINDER_SENT,
        priority=ActivityPriority.LOW,
        title=f"Reminder sent for vendor '{event.vendor_name}'",
        description=f"{event.reminder_type} reminder sent to {len(event.recipients)} recipient(s)",
        user_id=event.user_id,
        entity_type="vendor",
        entity_id=event.vendor_id,
        entity_name=event.vendor_name,
        extra_data={
            "reminder_id": event.reminder_id,
            "reminder_type": event.reminder_type,
            "recipients": event.recipients
        },
        tags=["reminder", "vendor"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


async def handle_exception_reminder_sent(event: ExceptionReminderSent, db: AsyncSession) -> None:
    """Create activity log when an exception reminder is sent."""
    activity = ActivityLogCreate(
        activity_type=ActivityType.REMINDER_SENT,
        priority=ActivityPriority.LOW,
        title=f"Reminder sent for exception '{event.exception_title}'",
        description=f"{event.reminder_type} reminder sent to {len(event.recipients)} recipient(s)",
        user_id=event.user_id,
        entity_type="exception",
        entity_id=event.exception_id,
        entity_name=event.exception_title,
        extra_data={
            "reminder_id": event.reminder_id,
            "reminder_type": event.reminder_type,
            "recipients": event.recipients
        },
        tags=["reminder", "exception"]
    )
    await ActivityLogService.create_activity(db, activity, auto_commit=True)


# ============================================================================
# Event Handler Registration
# ============================================================================

def register_activity_log_handlers():
    """Register all activity log event handlers with the event bus."""
    
    # Application events
    event_bus.subscribe(ApplicationCreated, handle_application_created)
    event_bus.subscribe(ApplicationUpdated, handle_application_updated)
    event_bus.subscribe(ApplicationDeleted, handle_application_deleted)
    event_bus.subscribe(VulnerabilityCreated, handle_vulnerability_created)
    event_bus.subscribe(VulnerabilityUpdated, handle_vulnerability_updated)
    event_bus.subscribe(VulnerabilityClosed, handle_vulnerability_closed)
    event_bus.subscribe(ApplicationReminderSent, handle_application_reminder_sent)
    
    # Vendor/Audit events
    event_bus.subscribe(VendorCreated, handle_vendor_created)
    event_bus.subscribe(VendorUpdated, handle_vendor_updated)
    event_bus.subscribe(VendorComplianceUpdated, handle_vendor_compliance_updated)
    event_bus.subscribe(CertificateCreated, handle_certificate_created)
    event_bus.subscribe(CertificateExpiring, handle_certificate_expiring)
    
    # Exception events
    event_bus.subscribe(ExceptionCreated, handle_exception_created)
    event_bus.subscribe(ExceptionApproved, handle_exception_approved)
    event_bus.subscribe(ExceptionRejected, handle_exception_rejected)
    
    # Reminder events
    event_bus.subscribe(VendorReminderSent, handle_vendor_reminder_sent)
    event_bus.subscribe(ExceptionReminderSent, handle_exception_reminder_sent)
    
    logger.info("✅ All activity log event handlers registered")
