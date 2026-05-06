"""Application Service Schemas"""

from app.schemas.application import (
    ApplicationTypeEnum,
    RiskLevelEnum,
    VulnerabilityForApp,
    ApplicationBase,
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ApplicationListResponse,
    ApplicationFilterParams,
    ApplicationStatistics,
)

from app.schemas.vulnerability import (
    RiskLevel,
    VulnerabilityStatusEnum,
    VulnerabilityBase,
    VulnerabilityCreate,
    VulnerabilityUpdate,
    VulnerabilityStatusUpdate,
    VulnerabilityRemarksUpdate,
    ApplicationSummary,
    VulnerabilityResponse,
    VulnerabilityListResponse,
    VulnerabilityFilterParams,
    VulnerabilityStatistics,
    POCUploadResponse,
)

from app.schemas.app_history import (
    VulnerabilityCounts,
    MonthlyTrend,
    YearlyTrend,
    CategoryData,
    ApplicationHistoryItem,
    AppHistoryResponse,
)

__all__ = [
    # Application schemas
    "ApplicationTypeEnum",
    "RiskLevelEnum",
    "VulnerabilityForApp",
    "ApplicationBase",
    "ApplicationCreate",
    "ApplicationUpdate",
    "ApplicationResponse",
    "ApplicationListResponse",
    "ApplicationFilterParams",
    "ApplicationStatistics",
    # Vulnerability schemas
    "RiskLevel",
    "VulnerabilityStatusEnum",
    "VulnerabilityBase",
    "VulnerabilityCreate",
    "VulnerabilityUpdate",
    "VulnerabilityStatusUpdate",
    "VulnerabilityRemarksUpdate",
    "ApplicationSummary",
    "VulnerabilityResponse",
    "VulnerabilityListResponse",
    "VulnerabilityFilterParams",
    "VulnerabilityStatistics",
    "POCUploadResponse",
    # App History schemas
    "VulnerabilityCounts",
    "MonthlyTrend",
    "YearlyTrend",
    "CategoryData",
    "ApplicationHistoryItem",
    "AppHistoryResponse",
]
