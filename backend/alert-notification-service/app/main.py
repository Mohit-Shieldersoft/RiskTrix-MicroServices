import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base
from app.api.v1.endpoints import alerts, webhooks, summary, soar

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("alert-notification-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting Alert & Notification Service (Port 8017, schema_alerts)...")
    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS schema_alerts"))
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created/verified in schema_alerts.")
    except Exception as e:
        logger.warning(f"⚠️ DB initialization note: {e}")
    yield
    logger.info("🛑 Shutting down Alert & Notification Service...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Unified Security Alert Inbox, SLA Tracker, Webhooks & SOAR Engine Microservice",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "alert-notification-service",
        "port": 8017,
        "schema": "schema_alerts",
    }


# Include API routers under /api/v1
app.include_router(alerts.router, prefix=settings.API_V1_STR, tags=["Unified Alert Inbox & SLA"])
app.include_router(webhooks.router, prefix=settings.API_V1_STR, tags=["Webhook Integrations"])
app.include_router(summary.router, prefix=settings.API_V1_STR, tags=["Alert Posture Summary"])
app.include_router(soar.router, prefix=settings.API_V1_STR, tags=["SOAR Playbooks & Response Workflows"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
