import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app.api.routes.queue import router as queue_router
from app.services.queue_worker import poll_loop

# Import model so create_all knows about it
import app.models.outbox  # noqa: F401

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create table if not exists (ticket-service should have created it, but safe to call)
    Base.metadata.create_all(bind=engine)
    # Start background worker
    task = asyncio.create_task(poll_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="RiskTrix Queue Service",
    description="Transactional outbox poller and event router.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(queue_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "queue-service"}
