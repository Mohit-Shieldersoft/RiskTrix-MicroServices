from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.endpoints import agents, endpoints
from app.core.config import settings
from app.db.database import Base, engine
from app.models import models as _agent_models  # noqa: F401
from app.models.models import Agent, ScanRequest  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS schema_agent"))
            await conn.run_sync(Base.metadata.create_all)
    except Exception as exc:
        print(f"Agent schema init note: {exc}")
    yield


app = FastAPI(title="Agent Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router, prefix="/api/v1/agents", tags=["agents"])
app.include_router(endpoints.router, prefix="/api/v1/endpoints", tags=["endpoints"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}