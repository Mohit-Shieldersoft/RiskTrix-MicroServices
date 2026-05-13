from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.models import BinaryScan, YaraMatch
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

router = APIRouter()

class ScanResult(BaseModel):
    agent_id: str
    file_path: str
    file_name: str
    sha256: str
    md5: Optional[str] = None
    file_size: Optional[int] = None
    entropy: Optional[float] = None
    file_type: Optional[str] = None
    is_signed: bool = False
    yara_matches: Optional[List[str]] = None

@router.post("/submit")
async def submit_scan(scan_data: ScanResult, db: AsyncSession = Depends(get_db)):
    """Submit binary scan results from agent"""
    try:
        # Create binary scan record
        scan = BinaryScan(
            agent_id=uuid.UUID(scan_data.agent_id),
            file_path=scan_data.file_path,
            file_name=scan_data.file_name,
            sha256=scan_data.sha256,
            md5=scan_data.md5,
            file_size=scan_data.file_size,
            entropy=scan_data.entropy,
            file_type=scan_data.file_type,
            is_signed=scan_data.is_signed,
            yara_matched=bool(scan_data.yara_matches),
            malware_score=len(scan_data.yara_matches) if scan_data.yara_matches else 0
        )

        db.add(scan)
        await db.commit()
        await db.refresh(scan)

        # Create YARA match records if any
        if scan_data.yara_matches:
            for rule_name in scan_data.yara_matches:
                match_record = YaraMatch(
                    scan_id=scan.id,
                    rule_name=rule_name,
                    rule_description=f"YARA rule match: {rule_name}"
                )
                db.add(match_record)

            await db.commit()

        return {"status": "submitted", "scan_id": str(scan.id)}

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit scan: {str(e)}")

@router.get("/inventory")
async def get_inventory(limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db)):
    """Get binary scan inventory"""
    try:
        result = await db.execute(
            select(BinaryScan)
            .order_by(BinaryScan.scanned_at.desc())
            .limit(limit)
            .offset(offset)
        )
        scans = result.scalars().all()

        return {
            "inventory": [
                {
                    "id": str(scan.id),
                    "agent_id": str(scan.agent_id),
                    "file_path": scan.file_path,
                    "file_name": scan.file_name,
                    "sha256": scan.sha256,
                    "entropy": scan.entropy,
                    "yara_matched": scan.yara_matched,
                    "malware_score": scan.malware_score,
                    "scanned_at": scan.scanned_at.isoformat()
                }
                for scan in scans
            ],
            "total": len(scans)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get inventory: {str(e)}")

@router.get("/alerts")
async def get_alerts(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Get malware alerts (YARA matches)"""
    try:
        # Get scans with YARA matches
        result = await db.execute(
            select(BinaryScan)
            .where(BinaryScan.yara_matched == True)
            .order_by(BinaryScan.scanned_at.desc())
            .limit(limit)
        )
        scans = result.scalars().all()

        alerts = []
        for scan in scans:
            # Get YARA matches for this scan
            matches_result = await db.execute(
                select(YaraMatch).where(YaraMatch.scan_id == scan.id)
            )
            matches = matches_result.scalars().all()

            alerts.append({
                "scan_id": str(scan.id),
                "agent_id": str(scan.agent_id),
                "file_path": scan.file_path,
                "file_name": scan.file_name,
                "sha256": scan.sha256,
                "malware_score": scan.malware_score,
                "scanned_at": scan.scanned_at.isoformat(),
                "yara_matches": [
                    {
                        "rule_name": match.rule_name,
                        "description": match.rule_description
                    }
                    for match in matches
                ]
            })

        return {"alerts": alerts, "total": len(alerts)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get alerts: {str(e)}")

@router.get("/{sha256}")
async def get_binary(sha256: str, db: AsyncSession = Depends(get_db)):
    """Get binary details by hash"""
    try:
        result = await db.execute(
            select(BinaryScan).where(BinaryScan.sha256 == sha256)
        )
        scan = result.scalar_one_or_none()

        if not scan:
            raise HTTPException(status_code=404, detail="Binary not found")

        # Get YARA matches for this scan
        matches_result = await db.execute(
            select(YaraMatch).where(YaraMatch.scan_id == scan.id)
        )
        matches = matches_result.scalars().all()

        return {
            "binary": {
                "id": str(scan.id),
                "agent_id": str(scan.agent_id),
                "file_path": scan.file_path,
                "file_name": scan.file_name,
                "sha256": scan.sha256,
                "md5": scan.md5,
                "file_size": scan.file_size,
                "entropy": scan.entropy,
                "file_type": scan.file_type,
                "is_signed": scan.is_signed,
                "yara_matched": scan.yara_matched,
                "malware_score": scan.malware_score,
                "scanned_at": scan.scanned_at.isoformat(),
                "yara_matches": [
                    {
                        "rule_name": match.rule_name,
                        "description": match.rule_description,
                        "matched_at": match.matched_at.isoformat()
                    }
                    for match in matches
                ]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get binary: {str(e)}")