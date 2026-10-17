import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base
from app.api.v1.endpoints import threats, cve

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("threat-intelligence-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting Threat Intelligence Service (Port 8013, schema_threat)...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created/verified in schema_threat.")
    except Exception as e:
        logger.warning(f"⚠️ DB initialization note: {e}")
    yield
    logger.info("🛑 Shutting down Threat Intelligence Service...")


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="NIST NVD v2.0 Feed Ingestion, CISA KEV Catalog & FIRST EPSS Exploit Probability Microservice",
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
        "service": "threat-intelligence-service",
        "port": settings.port,
        "schema": "schema_threat",
    }


# Include API routers under /api/v1
app.include_router(threats.router, prefix="/api/v1/threats", tags=["Threat Intelligence Feed"])
app.include_router(cve.router, prefix="/api/v1/cve", tags=["NVD & EPSS CVE Lookup"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port)