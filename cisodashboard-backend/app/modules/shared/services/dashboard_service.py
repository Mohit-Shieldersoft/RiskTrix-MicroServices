"""Dashboard service for main vulnerability dashboard"""
import logging
from typing import Any, List
from datetime import datetime, date, timedelta, timezone
from collections import defaultdict
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.application.services.reference_service import application_reference_service
from app.schemas.dashboard import (
    DashboardDataResponse, ApplicationVulnerability, VulnerabilityCounts,
    DelayedVulnerabilityTimeFrame, VulnerabilityStatus as VulnerabilityStatusSchema,
    ApplicationTypeVulnerabilities, DetailedVulnerabilityBreakdown
)

logger = logging.getLogger(__name__)


class DashboardService:
    """Service for main dashboard data operations"""
    
    @staticmethod
    async def get_dashboard_data(db: AsyncSession) -> DashboardDataResponse:
        """
        Get complete dashboard data including:
        - Applications with vulnerability counts
        - Delayed vulnerabilities by time frame
        - Overall vulnerability status (open vs closed)
        - Vulnerabilities by application type (internal vs external)
        - Detailed vulnerability breakdown by application
        
        Args:
            db: Database session
            
        Returns:
            DashboardDataResponse with all dashboard components
        """
        try:
            applications = await application_reference_service.get_applications(db)
            vulnerabilities = await application_reference_service.get_vulnerabilities(db)
            
            # Group vulnerabilities by application
            vuln_by_app = defaultdict(list)
            for vuln in vulnerabilities:
                if vuln.application_id:
                    vuln_by_app[vuln.application_id].append(vuln)
            
            # 1. Build applications list with vulnerability counts
            applications_data = []
            for app in applications:
                app_vulns = vuln_by_app.get(app.id, [])
                
                # Count open vulnerabilities by severity
                open_counts = DashboardService._count_vulnerabilities_by_severity(
                    [v for v in app_vulns if DashboardService._matches_value(v.status, "open")]
                )
                
                # Calculate risk level based on critical and high vulnerabilities
                risk_level = DashboardService._calculate_risk_level(open_counts)
                
                # Calculate critical delay days
                critical_delay_days = DashboardService._calculate_max_delay(
                    [
                        v for v in app_vulns
                        if DashboardService._matches_value(v.status, "open")
                        and v.severity
                        and v.severity.lower() == "critical"
                    ]
                )
                
                applications_data.append(ApplicationVulnerability(
                    id=str(app.id),
                    name=app.name,
                    vulnerabilities=open_counts,
                    riskLevel=risk_level,
                    criticalDelayDays=critical_delay_days
                ))
            
            # 2. Build delayed vulnerabilities by time frame
            delayed_vulnerabilities = DashboardService._build_delayed_vulnerabilities(vulnerabilities)
            
            # 3. Build overall vulnerability status (open vs closed)
            overall_status = DashboardService._build_vulnerability_status(vulnerabilities)
            
            # 4. Build application type vulnerabilities
            app_type_vulnerabilities = DashboardService._build_application_type_vulnerabilities(
                applications, vuln_by_app
            )
            
            # 5. Build detailed vulnerability breakdown
            detailed_vulnerabilities = []
            for app in applications:
                app_vulns = vuln_by_app.get(app.id, [])
                
                open_counts = DashboardService._count_vulnerabilities_by_severity(
                    [v for v in app_vulns if DashboardService._matches_value(v.status, "open")]
                )
                closed_counts = DashboardService._count_vulnerabilities_by_severity(
                    [v for v in app_vulns if DashboardService._matches_value(v.status, "closed")]
                )
                
                detailed_vulnerabilities.append(DetailedVulnerabilityBreakdown(
                    id=str(app.id),
                    name=app.name,
                    open=open_counts,
                    closed=closed_counts
                ))
            
            return DashboardDataResponse(
                applications=applications_data,
                delayedVulnerabilities=delayed_vulnerabilities,
                overallVulnerabilityStatus=overall_status,
                applicationTypeVulnerabilities=app_type_vulnerabilities,
                detailedVulnerabilities=detailed_vulnerabilities
            )
            
        except Exception as e:
            logger.error(f"Error fetching dashboard data: {str(e)}")
            raise
    
    @staticmethod
    def _matches_value(value: Any, expected: str) -> bool:
        raw = value.value if hasattr(value, "value") else value
        return str(raw).lower() == expected.lower()

    @staticmethod
    def _count_vulnerabilities_by_severity(vulnerabilities: List[Any]) -> VulnerabilityCounts:
        """Count vulnerabilities by severity level"""
        counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        
        for vuln in vulnerabilities:
            severity = (vuln.severity or 'low').lower()
            if severity in counts:
                counts[severity] += 1
            else:
                counts['low'] += 1
        
        return VulnerabilityCounts(
            critical=counts['critical'],
            high=counts['high'],
            medium=counts['medium'],
            low=counts['low']
        )
    
    @staticmethod
    def _calculate_risk_level(counts: VulnerabilityCounts) -> str:
        """Calculate risk level based on vulnerability counts"""
        if counts.critical > 2 or counts.high > 5:
            return 'high'
        elif counts.critical > 0 or counts.high > 2:
            return 'medium'
        else:
            return 'low'
    
    @staticmethod
    def _calculate_max_delay(vulnerabilities: List[Any]) -> int:
        """Calculate maximum delay in days for vulnerabilities"""
        if not vulnerabilities:
            return 0
        
        today = datetime.now(timezone.utc)
        max_delay = 0
        
        for vuln in vulnerabilities:
            if vuln.discovered_date:
                discovered = vuln.discovered_date
                if isinstance(discovered, date) and not isinstance(discovered, datetime):
                    discovered = datetime.combine(discovered, datetime.min.time(), tzinfo=timezone.utc)
                
                delay = (today - discovered).days
                max_delay = max(max_delay, delay)
        
        return max_delay
    
    @staticmethod
    def _build_delayed_vulnerabilities(vulnerabilities: List[Any]) -> List[DelayedVulnerabilityTimeFrame]:
        """Build delayed vulnerabilities grouped by time frame"""
        time_frames = {
            '0-30': {'critical': 0, 'high': 0, 'medium': 0, 'low': 0},
            '30-60': {'critical': 0, 'high': 0, 'medium': 0, 'low': 0},
            '60-90': {'critical': 0, 'high': 0, 'medium': 0, 'low': 0},
            '90+': {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        }
        
        today = datetime.now(timezone.utc)
        
        for vuln in vulnerabilities:
            if not DashboardService._matches_value(vuln.status, "open") or not vuln.discovered_date:
                continue
            
            # Calculate delay days
            discovered = vuln.discovered_date
            if isinstance(discovered, date) and not isinstance(discovered, datetime):
                discovered = datetime.combine(discovered, datetime.min.time(), tzinfo=timezone.utc)
            
            delay_days = (today - discovered).days
            
            # Determine time frame
            if delay_days < 30:
                time_frame = '0-30'
            elif delay_days < 60:
                time_frame = '30-60'
            elif delay_days < 90:
                time_frame = '60-90'
            else:
                time_frame = '90+'
            
            # Increment count
            severity = (vuln.severity or 'low').lower()
            if severity not in time_frames[time_frame]:
                severity = 'low'
            time_frames[time_frame][severity] += 1
        
        return [
            DelayedVulnerabilityTimeFrame(
                timeFrame=tf,
                critical=counts['critical'],
                high=counts['high'],
                medium=counts['medium'],
                low=counts['low']
            )
            for tf, counts in time_frames.items()
        ]
    
    @staticmethod
    def _build_vulnerability_status(vulnerabilities: List[Vulnerability]) -> List[VulnerabilityStatusSchema]:
        """Build overall vulnerability status (open vs closed)"""
        open_count = sum(1 for v in vulnerabilities if DashboardService._matches_value(v.status, "open"))
        closed_count = sum(1 for v in vulnerabilities if DashboardService._matches_value(v.status, "closed"))
        
        return [
            VulnerabilityStatusSchema(name='Open', value=open_count, color='#ff6384'),
            VulnerabilityStatusSchema(name='Closed', value=closed_count, color='#36a2eb')
        ]
    
    @staticmethod
    def _build_application_type_vulnerabilities(
        applications: List[Any],
        vuln_by_app: dict
    ) -> List[ApplicationTypeVulnerabilities]:
        """Build vulnerabilities grouped by application type (Internal/External)"""
        internal_vulns = []
        external_vulns = []
        
        # Internal types: web_application, mobile_application, desktop_application, database, infrastructure
        # External types: third_party, api_service (can be external)
        internal_types = [
            "web_application",
            "mobile_application",
            "desktop_application",
            "database",
            "infrastructure",
        ]

        for app in applications:
            app_vulns = [
                v for v in vuln_by_app.get(app.id, [])
                if DashboardService._matches_value(v.status, "open")
            ]

            # Classify as internal or external
            app_type = app.application_type.value if hasattr(app.application_type, "value") else app.application_type
            if app_type in internal_types:
                internal_vulns.extend(app_vulns)
            else:
                external_vulns.extend(app_vulns)
        
        internal_counts = DashboardService._count_vulnerabilities_by_severity(internal_vulns)
        external_counts = DashboardService._count_vulnerabilities_by_severity(external_vulns)
        
        return [
            ApplicationTypeVulnerabilities(
                type='Internal',
                critical=internal_counts.critical,
                high=internal_counts.high,
                medium=internal_counts.medium,
                low=internal_counts.low
            ),
            ApplicationTypeVulnerabilities(
                type='External',
                critical=external_counts.critical,
                high=external_counts.high,
                medium=external_counts.medium,
                low=external_counts.low
            )
        ]


# Create singleton instance
dashboard_service = DashboardService()
