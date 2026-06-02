from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from app.api.routes import policies, devices, groups, compliance, security, commands, agent, automation
from app.db.database import Base, engine, SessionLocal
from app.services.compliance_scan_service import scan_all_assignments
from app.services.risk_engine import evaluate_all_devices
import app.models.security   # ensure security tables are registered with Base  # noqa: F401
import app.models.automation  # ensure automation tables are registered with Base  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Policy Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(policies.router, prefix="/api/v1")
app.include_router(devices.router, prefix="/api/v1")
app.include_router(groups.router, prefix="/api/v1")
app.include_router(compliance.router, prefix="/api/v1")
app.include_router(security.router, prefix="/api/v1")
app.include_router(commands.router, prefix="/api/v1")
app.include_router(agent.router, prefix="/api/v1")
app.include_router(automation.router, prefix="/api/v1")

# ── Background compliance scanner ─────────────────────────
scheduler = BackgroundScheduler(daemon=True)

def _scheduled_scan():
    db = SessionLocal()
    try:
        scan_all_assignments(db)
    except Exception:
        pass
    finally:
        db.close()

def _scheduled_risk_eval():
    db = SessionLocal()
    try:
        evaluate_all_devices(db)
    except Exception:
        pass
    finally:
        db.close()

def _scheduled_offline_check():
    from app.api.routes.agent import OFFLINE_THRESHOLD_MINUTES
    from datetime import timedelta
    from app.models.device import Device, DeviceActivity
    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(minutes=OFFLINE_THRESHOLD_MINUTES)
        stale = db.query(Device).filter(Device.online == True, Device.last_seen < cutoff).all()
        for d in stale:
            d.online = False
            db.add(DeviceActivity(device_id=d.id, event_type="offline",
                                  message=f"Device went offline — last seen {d.last_seen}"))
        db.commit()
    except Exception:
        pass
    finally:
        db.close()

@app.on_event("startup")
def start_scheduler():
    scheduler.add_job(_scheduled_scan,         "interval", minutes=15, id="compliance_scan")
    scheduler.add_job(_scheduled_risk_eval,     "interval", minutes=30, id="risk_eval")
    scheduler.add_job(_scheduled_offline_check, "interval", minutes=5,  id="offline_check")
    scheduler.start()

@app.on_event("shutdown")
def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)