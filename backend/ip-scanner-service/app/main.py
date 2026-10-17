import asyncio
import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base
from app.models import models  # noqa: F401
from app.api.v1.endpoints import scanner

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ip-scanner-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting IP Scanner Service (Port 8018, schema_ip_scanner)...")
    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS schema_ip_scanner"))
            await conn.run_sync(Base.metadata.create_all)
            for stmt in (
                "ALTER TABLE schema_ip_scanner.ip_scans ADD COLUMN IF NOT EXISTS label VARCHAR(255)",
                "ALTER TABLE schema_ip_scanner.ip_scans ADD COLUMN IF NOT EXISTS risk_grade VARCHAR(8)",
                "ALTER TABLE schema_ip_scanner.ip_scans ADD COLUMN IF NOT EXISTS scan_options JSONB",
                "ALTER TABLE schema_ip_scanner.ip_scans ADD COLUMN IF NOT EXISTS result JSONB",
                "ALTER TABLE schema_ip_scanner.ip_scheduled_scans ADD COLUMN IF NOT EXISTS name VARCHAR(255)",
                "ALTER TABLE schema_ip_scanner.ip_scheduled_scans ADD COLUMN IF NOT EXISTS scan_options JSONB",
                "ALTER TABLE schema_ip_scanner.ip_scan_ranges ADD COLUMN IF NOT EXISTS label VARCHAR(255)",
                "ALTER TABLE schema_ip_scanner.ip_scan_ranges ADD COLUMN IF NOT EXISTS scan_options JSONB",
            ):
                await conn.execute(text(stmt))
    except Exception as exc:
        logger.warning("DB initialization note: %s", exc)

    async def _run_due_schedules():
        from sqlalchemy.future import select
        from app.db.session import AsyncSessionLocal
        from app.models.models import IpScheduledScan, IpScan
        from app.services.scan_engine import probe_host
        from app.api.v1.endpoints.scanner import _apply_result
        while True:
            try:
                async with AsyncSessionLocal() as db:
                    rows = (await db.execute(select(IpScheduledScan).where(IpScheduledScan.enabled.is_(True)))).scalars().all()
                    for row in rows:
                        result = await asyncio.to_thread(probe_host, row.target, None, 0.6, row.scan_options or {})
                        scan = IpScan(id=str(uuid.uuid4()), target=row.target, label=row.name, status="COMPLETED")
                        _apply_result(scan, result, row.name)
                        db.add(scan)
                    if rows:
                        await db.commit()
            except Exception as exc:
                logger.warning("Schedule runner: %s", exc)
            await asyncio.sleep(3600)

    task = asyncio.create_task(_run_due_schedules())
    try:
        yield
    finally:
        task.cancel()


app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ip-scanner-service", "port": 8018}


app.include_router(scanner.router, prefix=settings.API_V1_STR, tags=["IP Scanner"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
