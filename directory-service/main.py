from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app.api.routes.agents import router as agents_router
from app.api.routes.availability import router as availability_router
from app.api.routes.metrics import router as metrics_router

# Import models so Base.metadata includes all tables before create_all
import app.models.agent        # noqa: F401
import app.models.availability  # noqa: F401  (AgentAvailability, OnCallSchedule)
import app.models.metrics       # noqa: F401  (AgentMetric)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RiskTrix Directory Service",
    description="Agent/user directory — feeds AutoAssign with dynamic agent roster.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents_router, prefix="/api/v1")
app.include_router(availability_router, prefix="/api/v1")
app.include_router(metrics_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "directory-service"}
