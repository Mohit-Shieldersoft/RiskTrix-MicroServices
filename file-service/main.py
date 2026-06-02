from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.files import router as files_router

app = FastAPI(
    title="RiskTrix File Service",
    description="Handles file uploads/downloads for tickets, vulnerabilities, POC, assets.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "file-service"}
