"""Database session setup for Integrity Service."""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Base

try:
    import aiosqlite
    HAS_AIOSQLITE = True
except ImportError:
    HAS_AIOSQLITE = False

if HAS_AIOSQLITE:
    DATABASE_URL = "sqlite+aiosqlite:///:memory:"
    engine = create_async_engine(DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def get_db() -> AsyncGenerator[AsyncSession, None]:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with AsyncSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()
else:
    # Standalone Memory Fallback
    class DummySession:
        async def execute(self, query):
            class Res:
                def scalars(self):
                    class Sc:
                        def all(self): return []
                        def first(self): return None
                    return Sc()
            return Res()

        def add(self, obj): pass
        async def commit(self): pass
        async def refresh(self, obj): pass
        async def rollback(self): pass

    async def get_db():
        yield DummySession()
