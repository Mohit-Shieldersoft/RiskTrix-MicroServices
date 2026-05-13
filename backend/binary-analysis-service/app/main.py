from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import binary, yara
from app.core.config import settings

app = FastAPI(title="Binary Analysis Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(binary.router, prefix="/api/v1/binary", tags=["binary"])
app.include_router(yara.router, prefix="/api/v1/yara", tags=["yara"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}