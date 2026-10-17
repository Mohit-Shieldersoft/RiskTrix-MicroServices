import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base
from app.api.v1.endpoints import kubernetes, containers, sbom, summary, runtime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("k8s-container-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting K8s & Container Service (Port 8016, schema_k8s_container)...")
    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS schema_k8s_container"))
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created/verified in schema_k8s_container.")
    except Exception as e:
        logger.warning(f"⚠️ DB initialization note: {e}")
    yield
    logger.info("🛑 Shutting down K8s & Container Service...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Kubernetes Posture Auditor, Container Registry Scanner & CycloneDX SBOM Generator Microservice",
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
        "service": "k8s-container-service",
        "port": 8016,
        "schema": "schema_k8s_container",
    }


# Include API routers under /api/v1
app.include_router(kubernetes.router, prefix=settings.API_V1_STR, tags=["Kubernetes Auditor"])
app.include_router(containers.router, prefix=settings.API_V1_STR, tags=["Container Registry Scanner"])
app.include_router(sbom.router, prefix=settings.API_V1_STR, tags=["SBOM Generator"])
app.include_router(summary.router, prefix=settings.API_V1_STR, tags=["Posture Summary"])
app.include_router(runtime.router, prefix=settings.API_V1_STR, tags=["Runtime Threat Protection"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
