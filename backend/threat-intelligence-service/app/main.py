from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import threats, cve
from app.core.config import settings

app = FastAPI(title="Threat Intelligence Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(threats.router, prefix="/api/v1/threats", tags=["threats"])
app.include_router(cve.router, prefix="/api/v1/cve", tags=["cve"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}