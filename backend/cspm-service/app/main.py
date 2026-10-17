import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base
from app.api.v1.endpoints import (
    cloud_accounts,
    assets,
    policies,
    findings,
    attack_paths,
    secrets,
    correlation,
    scan,
    remediation,
    security_score,
    cloud_compliance,
    search,
    reports,
    dashboard,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cspm-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting CSPM Service (Port 8014, schema_cspm)...")
    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS schema_cspm"))
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created/verified in schema_cspm.")
    except Exception as e:
        logger.warning(f"⚠️ DB initialization note: {e}")
    yield
    logger.info("🛑 Shutting down CSPM Service...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Cloud Security Posture Management, Attack Path & Toxic Risk Correlation Microservice",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type"],
)

# Health check
@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "cspm-service",
        "port": 8014,
        "schema": "schema_cspm",
    }


# Include API routers under /api/v1/cloud
app.include_router(cloud_accounts.router, prefix=settings.API_V1_STR, tags=["Cloud Accounts"])
app.include_router(assets.router, prefix=settings.API_V1_STR, tags=["Asset Explorer"])
app.include_router(policies.router, prefix=settings.API_V1_STR, tags=["Policy Evaluator"])
app.include_router(findings.router, prefix=settings.API_V1_STR, tags=["CSPM Findings"])
app.include_router(attack_paths.router, prefix=settings.API_V1_STR, tags=["Attack Path Engine"])
app.include_router(secrets.router, prefix=settings.API_V1_STR, tags=["Secrets & IaC Scanner"])
app.include_router(correlation.router, prefix=settings.API_V1_STR, tags=["Toxic Risk Correlation Engine"])
app.include_router(scan.router, prefix=settings.API_V1_STR, tags=["CSPM Scan Engine"])
app.include_router(remediation.router, prefix=settings.API_V1_STR, tags=["Remediation Playbooks"])
app.include_router(security_score.router, prefix=settings.API_V1_STR, tags=["Security Score"])
app.include_router(cloud_compliance.router, prefix=settings.API_V1_STR, tags=["Cloud Compliance"])
app.include_router(reports.router, prefix=settings.API_V1_STR, tags=["CNAPP Reports"])
app.include_router(dashboard.router, prefix=settings.API_V1_STR, tags=["CNAPP Dashboard"])
app.include_router(search.router, prefix=settings.API_V1_STR, tags=["Search"])
# Compatibility aliases used by the frontend router
app.include_router(correlation.router, prefix="/api/v1", tags=["Toxic Risk Correlation Alias"])
app.include_router(security_score.router, prefix="/api/v1", tags=["Security Score Alias"])
app.include_router(search.router, prefix="/api/v1", tags=["Search Alias"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
