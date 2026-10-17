from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.endpoints import binary, yara
from app.core.config import settings
from app.db.session import Base, engine
from app.models.models import BinaryScan, YaraMatch  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS schema_binary"))
            await conn.run_sync(Base.metadata.create_all)
    except Exception as exc:
        print(f"Binary schema init note: {exc}")
    yield


app = FastAPI(title="Binary Analysis Service", version="1.0.0", lifespan=lifespan)

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

app.include_router(binary.router, prefix="/api/v1/binary", tags=["binary"])
app.include_router(yara.router, prefix="/api/v1/yara", tags=["yara"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
