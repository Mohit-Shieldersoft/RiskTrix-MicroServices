"""Database session configuration for Application Service.

Uses shared database with main monolith during transition phase.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create async engine for database operations
engine = create_async_engine(
    settings.database_url,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    future=True,
    pool_size=10,  # Smaller pool for microservice
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
    execution_options={"schema_translate_map": {None: "schema_app"}},
)

# Create async session factory
SessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Create declarative base
Base = declarative_base()


async def get_session() -> AsyncSession:
    """Dependency to get async database session"""
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Alias for backward compatibility
get_db = get_session
