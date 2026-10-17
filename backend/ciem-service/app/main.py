import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base
from app.api.v1.endpoints import identities, graph, entitlements, summary

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ciem-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting CIEM Service (Port 8015, schema_ciem)...")
    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS schema_ciem"))
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created/verified in schema_ciem.")
    except Exception as e:
        logger.warning(f"⚠️ DB initialization note: {e}")
    yield
    logger.info("🛑 Shutting down CIEM Service...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Cloud Infrastructure Entitlement Management (CIEM) & NetworkX IAM Identity Graph Engine",
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
        "service": "ciem-service",
        "port": 8015,
        "schema": "schema_ciem",
    }


# Include API routers under /api/v1/ciem
app.include_router(identities.router, prefix=settings.API_V1_STR, tags=["IAM Identities"])
app.include_router(graph.router, prefix=settings.API_V1_STR, tags=["IAM Entitlement Graph"])
app.include_router(entitlements.router, prefix=settings.API_V1_STR, tags=["Excessive Permissions"])
app.include_router(summary.router, prefix=settings.API_V1_STR, tags=["CIEM Summary"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
