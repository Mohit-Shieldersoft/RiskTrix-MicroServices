from fastapi import FastAPI
from app.api.routes import assets, dashboard, devices, asset_features
from app.db.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Asset Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(devices.router, prefix="/api/v1")
app.include_router(asset_features.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "asset-service"}