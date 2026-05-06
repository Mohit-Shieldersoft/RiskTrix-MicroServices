"""
Application Service - Main FastAPI Application

This microservice handles application lifecycle management and vulnerability tracking.
It shares a database with the main monolith during the transition phase and validates
JWT tokens using the same secret key.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.utils.logger import setup_logger
from app.api.v1.api import api_router

logger = setup_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("🚀 Starting Application Service...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Port: {settings.PORT}")
    logger.info(f"Database: {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}")
    
    # Event handlers can be registered here in the future
    # from app.handlers import register_event_handlers
    # register_event_handlers()
    
    yield
    
    logger.info("🛑 Shutting down Application Service...")


def create_application() -> FastAPI:
    """Create and configure the FastAPI application"""
    
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="Application Service - Manages application lifecycle and vulnerability tracking",
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
        expose_headers=["X-Total-Count", "X-Page-Count"]
    )
    
    # Include API router
    app.include_router(api_router, prefix=settings.API_V1_STR)
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "service": "application-service",
            "version": settings.API_VERSION
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
