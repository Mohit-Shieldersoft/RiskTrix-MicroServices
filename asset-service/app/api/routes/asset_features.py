"""
Routes for high-priority asset management features:
  - Vulnerability management  (per-asset CVE tracking)
  - Software inventory        (installed apps + patch status)
  - Change log                (field-level audit trail)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.schemas.asset import (
    VulnerabilityCreate, VulnerabilityUpdate, VulnerabilityResponse,
    SoftwareCreate, SoftwareResponse,
    ChangeLogResponse,
)
from app.services.asset_service import (
    get_vulnerabilities, add_vulnerability, update_vulnerability, delete_vulnerability,
    get_software, add_software, delete_software,
    get_changelog,
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Vulnerabilities ───────────────────────────────────────────────────────────

@router.get("/assets/{asset_id}/vulnerabilities", response_model=List[VulnerabilityResponse])
def list_vulnerabilities(asset_id: int, db: Session = Depends(get_db)):
    return get_vulnerabilities(db, asset_id)


@router.post("/assets/{asset_id}/vulnerabilities", response_model=VulnerabilityResponse, status_code=201)
def create_vulnerability(asset_id: int, data: VulnerabilityCreate, db: Session = Depends(get_db)):
    return add_vulnerability(db, asset_id, data)


@router.patch("/assets/{asset_id}/vulnerabilities/{vuln_id}", response_model=VulnerabilityResponse)
def patch_vulnerability(asset_id: int, vuln_id: int, data: VulnerabilityUpdate, db: Session = Depends(get_db)):
    vuln = update_vulnerability(db, vuln_id, data)
    if not vuln:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return vuln


@router.delete("/assets/{asset_id}/vulnerabilities/{vuln_id}", status_code=204)
def remove_vulnerability(asset_id: int, vuln_id: int, db: Session = Depends(get_db)):
    if not delete_vulnerability(db, vuln_id):
        raise HTTPException(status_code=404, detail="Vulnerability not found")


# ── Software inventory ────────────────────────────────────────────────────────

@router.get("/assets/{asset_id}/software", response_model=List[SoftwareResponse])
def list_software(asset_id: int, db: Session = Depends(get_db)):
    return get_software(db, asset_id)


@router.post("/assets/{asset_id}/software", response_model=SoftwareResponse, status_code=201)
def create_software(asset_id: int, data: SoftwareCreate, db: Session = Depends(get_db)):
    return add_software(db, asset_id, data)


@router.delete("/assets/{asset_id}/software/{sw_id}", status_code=204)
def remove_software(asset_id: int, sw_id: int, db: Session = Depends(get_db)):
    if not delete_software(db, sw_id):
        raise HTTPException(status_code=404, detail="Software record not found")


# ── Change log ────────────────────────────────────────────────────────────────

@router.get("/assets/{asset_id}/changelog", response_model=List[ChangeLogResponse])
def list_changelog(asset_id: int, db: Session = Depends(get_db)):
    return get_changelog(db, asset_id)
