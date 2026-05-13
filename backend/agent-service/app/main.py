from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import agents, endpoints
from app.core.config import settings

app = FastAPI(title="Agent Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router, prefix="/api/v1/agents", tags=["agents"])
app.include_router(endpoints.router, prefix="/api/v1/endpoints", tags=["endpoints"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}