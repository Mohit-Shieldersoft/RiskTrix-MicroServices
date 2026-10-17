"""Reminder service for application reminder management"""
import logging
import os
import smtplib
from email.mime.text import MIMEText
from typing import Any, Dict, List, Optional
from datetime import datetime, date, timezone
from collections import defaultdict
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.application.services.reference_service import application_reference_service
from app.modules.audit.services.reference_service import audit_reference_service
from app.modules.shared.services.entity_reference_service import entity_reference_service
from app.schemas.reminder import (
    ReminderResponse, OwnerReminderData, ApplicationReminderData,
    OwnerApplicationData, ApplicationInstanceData,
    VulnerabilityCounts, DelayCounts, ReminderStats,
    FrontendReminderResponse, VendorReminderItem, ApplicationReminderItem,
    ExceptionReminderItem, FrontendReminderStats
)

logger = logging.getLogger(__name__)


class ReminderService:
    """Service for handling application reminder operations"""
    
    @staticmethod
    async def get_reminder_data(db: AsyncSession) -> ReminderResponse:
        """
        Get complete reminder data including owner-based and application-based views
        
        Args:
            db: Database session
            
        Returns:
            ReminderResponse with owner data, application data, and stats
        """
        try:
            # Fetch all applications with their vulnerabilities
            applications = await entity_reference_service.get_applications(
                db,
                owners_only=True,
            )
            
            # Fetch all open vulnerabilities
            vulnerabilities = await entity_reference_service.get_vulnerabilities(
                db,
                status="open",
            )
            
            # Build vulnerability map by application_id
            vuln_by_app = defaultdict(list)
            for vuln in vulnerabilities:
                if vuln.application_id:
                    vuln_by_app[vuln.application_id].append(vuln)
            
            # Fetch user details for owners
            user_ids = [app.owner_id for app in applications if app.owner_id]
            users = await entity_reference_service.get_users_by_ids(db, user_ids)
            
            # Process data for owner view
            owner_data_dict = {}
            for app in applications:
                if not app.owner_id:
                    continue
                    
                owner = users.get(app.owner_id)
                if not owner:
                    continue
                    
                owner_name = owner.full_name or owner.email
                
                # Get vulnerabilities for this application
                app_vulns = vuln_by_app.get(app.id, [])
                
                # Calculate vulnerability counts and delays
                vuln_counts, delay_counts = ReminderService._calculate_metrics(app_vulns)
                
                # Create owner application data
                owner_app = OwnerApplicationData(
                    id=f"APP-{app.id}",
                    name=app.name,
                    vulnerabilities=vuln_counts,
                    delay=delay_counts,
                    lastReminded=None,  # TODO: Track reminder history
                    owner=owner_name
                )
                
                # Group by owner
                if owner.id not in owner_data_dict:
                    owner_data_dict[owner.id] = {
                        "id": f"OWN-{owner.id}",
                        "name": owner_name,
                        "applications": [],
                        "totalVulnerabilities": 0
                    }
                
                owner_data_dict[owner.id]["applications"].append(owner_app)
                owner_data_dict[owner.id]["totalVulnerabilities"] += vuln_counts.total
            
            # Convert owner data dict to list
            owner_data = [
                OwnerReminderData(
                    id=data["id"],
                    name=data["name"],
                    applicationCount=len(data["applications"]),
                    totalVulnerabilities=data["totalVulnerabilities"],
                    applications=data["applications"]
                )
                for data in owner_data_dict.values()
            ]
            
            # Process data for application view
            app_data_dict = {}
            for app in applications:
                if not app.owner_id:
                    continue
                    
                owner = users.get(app.owner_id)
                if not owner:
                    continue
                    
                owner_name = owner.full_name or owner.email
                
                # Get vulnerabilities for this application
                app_vulns = vuln_by_app.get(app.id, [])
                
                # Calculate vulnerability counts and delays
                vuln_counts, delay_counts = ReminderService._calculate_metrics(app_vulns)
                
                # Create application instance
                app_instance = ApplicationInstanceData(
                    id=f"APP-{app.id}-OWN-{owner.id}",
                    owner=owner_name,
                    vulnerabilities=vuln_counts,
                    delay=delay_counts,
                    lastReminded=None  # TODO: Track reminder history
                )
                
                # Group by application name
                if app.name not in app_data_dict:
                    app_data_dict[app.name] = {
                        "id": f"APPGRP-{app.id}",
                        "name": app.name,
                        "instances": []
                    }
                
                app_data_dict[app.name]["instances"].append(app_instance)
            
            # Convert application data dict to list
            application_data = [
                ApplicationReminderData(
                    id=data["id"],
                    name=data["name"],
                    instances=data["instances"]
                )
                for data in app_data_dict.values()
            ]
            
            # Calculate statistics
            total_owners = len(owner_data)
            total_applications = len(applications)
            total_vulnerabilities = len(vulnerabilities)
            
            stats = ReminderStats(
                owners=total_owners,
                applications=total_applications,
                totalVulnerabilities=total_vulnerabilities
            )
            
            return ReminderResponse(
                ownerData=owner_data,
                applicationData=application_data,
                stats=stats
            )
            
        except Exception as e:
            logger.error(f"Error fetching reminder data: {str(e)}")
            raise
    
    @staticmethod
    def _calculate_metrics(vulnerabilities: List[Any]) -> tuple[VulnerabilityCounts, DelayCounts]:
        """
        Calculate vulnerability counts and delay metrics
        
        Args:
            vulnerabilities: List of vulnerabilities
            
        Returns:
            Tuple of (VulnerabilityCounts, DelayCounts)
        """
        vuln_counts = {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0
        }
        
        delay_days = {
            "critical": [],
            "high": [],
            "medium": [],
            "low": []
        }
        
        # Use timezone-aware datetime to match database datetime fields
        today = datetime.now(timezone.utc)
        
        for vuln in vulnerabilities:
            severity = vuln.severity.lower() if vuln.severity else "low"
            if severity not in vuln_counts:
                severity = "low"
            
            vuln_counts[severity] += 1
            
            # Calculate delay days
            if vuln.discovered_date:
                # Ensure both are datetime objects for comparison
                discovered = vuln.discovered_date
                if isinstance(discovered, date) and not isinstance(discovered, datetime):
                    discovered = datetime.combine(discovered, datetime.min.time(), tzinfo=timezone.utc)
                
                delta = today - discovered
                delay_days[severity].append(delta.days)
        
        # Calculate average or max delays
        delay_counts_dict = {}
        for severity in ["critical", "high", "medium", "low"]:
            if delay_days[severity]:
                delay_counts_dict[severity] = max(delay_days[severity])
            else:
                delay_counts_dict[severity] = 0
        
        total_vulns = sum(vuln_counts.values())
        max_delay = max(delay_counts_dict.values()) if delay_counts_dict else 0
        
        return (
            VulnerabilityCounts(
                critical=vuln_counts["critical"],
                high=vuln_counts["high"],
                medium=vuln_counts["medium"],
                low=vuln_counts["low"],
                total=total_vulns
            ),
            DelayCounts(
                critical=delay_counts_dict["critical"],
                high=delay_counts_dict["high"],
                medium=delay_counts_dict["medium"],
                low=delay_counts_dict["low"],
                max=max_delay
            )
        )
    
    @staticmethod
    def _smtp_configured() -> bool:
        return bool(os.getenv("SMTP_USERNAME") and os.getenv("SMTP_PASSWORD"))

    @staticmethod
    def _send_smtp(to_email: str, subject: str, body: str) -> None:
        if not ReminderService._smtp_configured():
            raise RuntimeError("SMTP is not configured. Set SMTP_USERNAME and SMTP_PASSWORD.")
        if not to_email:
            raise RuntimeError("No recipient email address.")
        host = os.getenv("SMTP_SERVER") or os.getenv("SMTP_HOST") or "smtp.gmail.com"
        port = int(os.getenv("SMTP_PORT") or 587)
        user = os.getenv("SMTP_USERNAME")
        password = os.getenv("SMTP_PASSWORD")
        from_email = os.getenv("SMTP_FROM_EMAIL") or user
        msg = MIMEText(body, "plain")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email
        with smtplib.SMTP(host, port, timeout=20) as server:
            if os.getenv("SMTP_USE_TLS", "true").lower() != "false":
                server.starttls()
            server.login(user, password)
            server.sendmail(from_email, [to_email], msg.as_string())

    @staticmethod
    async def send_reminder(
        db: AsyncSession,
        application_id: int,
        owner_id: Optional[int] = None
    ) -> Dict:
        """Send reminder for an application via SMTP. Fails if SMTP is unset."""
        try:
            application = await application_reference_service.get_application_by_id(db, application_id)
            
            if not application:
                return {
                    "success": False,
                    "message": f"Application {application_id} not found"
                }

            to_email = getattr(application, "owner", None) or getattr(application, "owner_email", None)
            if owner_id:
                users = await entity_reference_service.get_users_by_ids(db, [owner_id])
                owner = users.get(owner_id)
                if owner and getattr(owner, "email", None):
                    to_email = owner.email
            if not to_email:
                return {"success": False, "message": "Application has no owner email"}

            ReminderService._send_smtp(
                to_email,
                f"RiskTrix reminder: {application.name}",
                f"This is a reminder for application {application.name} (ID: {application_id}).",
            )
            logger.info(f"Reminder sent for application {application.name} (ID: {application_id})")
            return {
                "success": True,
                "message": "Reminder sent successfully",
                "remindedAt": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error sending reminder: {str(e)}")
            return {
                "success": False,
                "message": f"Failed to send reminder: {str(e)}"
            }

    @staticmethod
    async def get_frontend_reminder_data(db: AsyncSession) -> FrontendReminderResponse:
        """
        Get reminder data formatted for the frontend Reminder page
        
        Returns data in three categories:
        - Vendor reminders: Vendors with non-compliant applications
        - Application reminders: Applications with vulnerabilities/delays
        - Exception reminders: Active exceptions requiring attention
        
        Args:
            db: Database session
            
        Returns:
            FrontendReminderResponse with all three reminder categories
        """
        try:
            # Get vendor reminders - vendors with expired or non-compliant records
            vendor_reminders = []
            
            # Query vendors with non-compliant compliance records
            vendors = await entity_reference_service.get_vendors(
                db,
                compliance_status="non_compliant",
            )

            for vendor in vendors:
                compliance_records = await audit_reference_service.get_non_compliant_vendor_records(
                    db,
                    vendor_id=vendor.id,
                )
                
                # Calculate delay days (days since last assessment or expiry)
                max_delay = 0
                today = date.today()
                for record in compliance_records:
                    if record.expiry_date and record.expiry_date < today:
                        delay = (today - record.expiry_date).days
                        max_delay = max(max_delay, delay)
                    elif record.assessment_date:
                        # If no expiry, use assessment date
                        delay = (today - record.assessment_date).days
                        max_delay = max(max_delay, delay)
                
                # Count non-compliant "apps" (compliance records)
                non_compliant_count = len(compliance_records)
                
                if non_compliant_count > 0:
                    vendor_reminders.append(VendorReminderItem(
                        id=f"VR-{vendor.id}",
                        vendorName=vendor.name,
                        nonCompliantApps=non_compliant_count,
                        delayDays=max_delay,
                        sentCount=0  # TODO: Track reminder history
                    ))
            
            # Get application reminders - applications with open vulnerabilities
            application_reminders = []
            
            # Query applications with open vulnerabilities
            applications = await entity_reference_service.get_applications(
                db,
                owners_only=True,
            )
            
            # Get all open vulnerabilities
            vulnerabilities = await entity_reference_service.get_vulnerabilities(
                db,
                status="open",
            )
            
            # Group vulnerabilities by application
            vuln_by_app = defaultdict(list)
            for vuln in vulnerabilities:
                if vuln.application_id:
                    vuln_by_app[vuln.application_id].append(vuln)
            
            # Get user details for owners
            user_ids = [app.owner_id for app in applications if app.owner_id]
            if user_ids:
                users = await entity_reference_service.get_users_by_ids(db, user_ids)
            else:
                users = {}
            
            # Process applications with vulnerabilities
            for app in applications:
                if not app.owner_id:
                    continue
                
                app_vulns = vuln_by_app.get(app.id, [])
                if not app_vulns:
                    continue
                
                owner = users.get(app.owner_id)
                if not owner:
                    continue
                
                owner_name = owner.full_name or owner.email
                
                # Calculate max delay from vulnerabilities
                max_delay = 0
                today = datetime.now(timezone.utc)
                for vuln in app_vulns:
                    if vuln.discovered_date:
                        discovered = vuln.discovered_date
                        if isinstance(discovered, date) and not isinstance(discovered, datetime):
                            discovered = datetime.combine(discovered, datetime.min.time(), tzinfo=timezone.utc)
                        delay = (today - discovered).days
                        max_delay = max(max_delay, delay)
                
                application_reminders.append(ApplicationReminderItem(
                    id=f"AR-{app.id}",
                    owner=owner_name,
                    application=app.name,
                    delayDays=max_delay,
                    sentCount=0,  # TODO: Track reminder history
                    applicationId=app.id,
                    ownerId=app.owner_id
                ))
            
            # Get exception reminders - active exceptions
            exception_reminders = []
            
            # Query active exceptions
            exceptions = await entity_reference_service.get_exceptions(
                db,
                statuses=["active", "pending"],
            )
            
            for exc in exceptions:
                # Use exception_name as type and comments/risk_assessment as remark
                exception_type = exc.exception_name or exc.category or "Unknown Exception"
                remark = exc.comments or exc.risk_assessment or "No remarks available"
                
                exception_reminders.append(ExceptionReminderItem(
                    id=f"ER-{exc.id}",
                    exceptionType=exception_type,
                    remark=remark,
                    sentCount=0,  # TODO: Track reminder history
                    exceptionId=exc.id
                ))
            
            # Calculate statistics
            stats = FrontendReminderStats(
                vendors=len(vendor_reminders),
                applications=len(application_reminders),
                exceptions=len(exception_reminders)
            )
            
            return FrontendReminderResponse(
                vendorReminders=vendor_reminders,
                applicationReminders=application_reminders,
                exceptionReminders=exception_reminders,
                stats=stats
            )
            
        except Exception as e:
            logger.error(f"Error fetching frontend reminder data: {str(e)}")
            raise

    @staticmethod
    async def send_vendor_reminder(
        db: AsyncSession,
        vendor_id: int
    ) -> Dict:
        """
        Send reminder for a vendor (placeholder - actual email sending would go here)
        
        Args:
            db: Database session
            vendor_id: Vendor ID
            
        Returns:
            Dict with success status and message
        """
        try:
            # Fetch vendor
            vendor = await audit_reference_service.get_vendor_by_id(db, vendor_id)
            
            if not vendor:
                return {
                    "success": False,
                    "message": f"Vendor {vendor_id} not found",
                    "remindedAt": datetime.now().isoformat()
                }
            
            to_email = getattr(vendor, "contact_email", None) or getattr(vendor, "email", None)
            if not to_email:
                return {
                    "success": False,
                    "message": f"Vendor {vendor.name} has no contact email",
                    "remindedAt": datetime.now().isoformat()
                }
            ReminderService._send_smtp(
                to_email,
                f"RiskTrix vendor reminder: {vendor.name}",
                f"This is a compliance reminder for vendor {vendor.name} (ID: {vendor_id}).",
            )
            logger.info(f"Reminder sent for vendor {vendor.name} (ID: {vendor_id})")
            return {
                "success": True,
                "message": f"Vendor reminder sent successfully to {vendor.name}",
                "remindedAt": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error sending vendor reminder: {str(e)}")
            return {
                "success": False,
                "message": f"Failed to send vendor reminder: {str(e)}",
                "remindedAt": datetime.now().isoformat()
            }

    @staticmethod
    async def send_exception_reminder(
        db: AsyncSession,
        exception_id: int
    ) -> Dict:
        """
        Send reminder for an exception (placeholder - actual email sending would go here)
        
        Args:
            db: Database session
            exception_id: Exception ID
            
        Returns:
            Dict with success status and message
        """
        try:
            # Fetch exception
            exception = await audit_reference_service.get_exception_by_id(db, exception_id)
            
            if not exception:
                return {
                    "success": False,
                    "message": f"Exception {exception_id} not found",
                    "remindedAt": datetime.now().isoformat()
                }
            
            to_email = getattr(exception, "owner_email", None) or getattr(exception, "requested_by_email", None)
            if not to_email:
                return {
                    "success": False,
                    "message": f"Exception {exception.exception_name} has no recipient email",
                    "remindedAt": datetime.now().isoformat()
                }
            ReminderService._send_smtp(
                to_email,
                f"RiskTrix exception reminder: {exception.exception_name}",
                f"This is a reminder for exception {exception.exception_name} (ID: {exception_id}).",
            )
            logger.info(f"Reminder sent for exception {exception.exception_name} (ID: {exception_id})")
            return {
                "success": True,
                "message": f"Exception reminder sent successfully for {exception.exception_name}",
                "remindedAt": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error sending exception reminder: {str(e)}")
            return {
                "success": False,
                "message": f"Failed to send exception reminder: {str(e)}",
                "remindedAt": datetime.now().isoformat()
            }
