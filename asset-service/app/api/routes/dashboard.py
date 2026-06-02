from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.schemas.dashboard import EnrollmentStatusResponse, RecentActivityItem, PolicyDeploymentStatusResponse
from app.services.dashboard_service import (
    get_enrollment_status,
    get_recent_activity,
    get_policy_status,
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/dashboard/enrollment-status", response_model=EnrollmentStatusResponse)
def enrollment_status(db: Session = Depends(get_db)):
    return get_enrollment_status(db)


@router.get("/dashboard/recent-activity", response_model=list[RecentActivityItem])
def recent_activity(db: Session = Depends(get_db)):
    return get_recent_activity(db)


@router.get("/dashboard/policy-status", response_model=PolicyDeploymentStatusResponse)
def policy_status(db: Session = Depends(get_db)):
    return get_policy_status(db)