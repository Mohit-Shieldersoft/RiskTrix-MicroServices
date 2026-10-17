"""
Audit Service - Main FastAPI Application

This microservice handles audit, compliance, vendor risk, and exception management.
It shares a database with the main monolith during the transition phase and validates
JWT tokens using the same secret key.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging

from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine, Base
from app.models import models as _audit_models  # noqa: F401
from app.utils.logger import setup_logger
from app.api.v1.api import api_router

logger = setup_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("🚀 Starting Audit Service...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Port: {settings.PORT}")
    logger.info(f"Database: {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}")
    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS schema_audit"))
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(text(
                "ALTER TABLE schema_audit.exceptions ADD COLUMN IF NOT EXISTS poc_document VARCHAR(500)"
            ))
            # Users/orgs/apps live in other services. Drop leftover cross-schema FKs.
            for table, constraint in (
                ("assignments", "assignments_created_by_id_fkey"),
                ("exceptions", "exceptions_created_by_id_fkey"),
                ("exceptions", "exceptions_assigned_to_id_fkey"),
                ("exceptions", "exceptions_approved_by_id_fkey"),
                ("exceptions", "exceptions_organization_id_fkey"),
                ("assessments", "assessments_assessor_id_fkey"),
                ("audit_logs", "audit_logs_user_id_fkey"),
                ("compliance_records", "compliance_records_assessor_id_fkey"),
                ("compliance_records", "compliance_records_application_id_fkey"),
                ("vendor_compliance_records", "vendor_compliance_records_assessor_id_fkey"),
                ("vendor_certificates", "vendor_certificates_application_id_fkey"),
                ("vendors", "vendors_organization_id_fkey"),
            ):
                await conn.execute(text(
                    f"ALTER TABLE schema_audit.{table} DROP CONSTRAINT IF EXISTS {constraint}"
                ))
        logger.info("Audit schema tables are ready")
    except Exception as exc:
        logger.warning("Audit schema initialization note: %s", exc)
    yield
    
    logger.info("🛑 Shutting down Audit Service...")


def create_application() -> FastAPI:
    """Create and configure the FastAPI application"""
    
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="Audit Service - Manages compliance, vendors, exceptions, and audit workflows",
        version=settings.API_VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan
    )
    
    # Security middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Total-Count", "X-Page-Count", "Content-Disposition"]
    )
    
    # Include API router
    app.include_router(api_router, prefix=settings.API_V1_STR)
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "service": "audit-service",
            "version": settings.API_VERSION,
            "port": settings.PORT
        }
    
    return app


# Create the FastAPI application instance
app = create_application()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
