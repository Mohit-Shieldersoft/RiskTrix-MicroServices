from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Body, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import CSPMFinding, CloudAccount
from app.services.demo_scope import is_demo_request, in_scope

router = APIRouter()

FRAMEWORK_CONTROL_MAP = {
    "CIS": ["S3", "SSH", "MFA", "public", "encryption"],
    "SOC2": ["MFA", "encryption", "public", "logging"],
    "PCI_DSS": ["public", "SSH", "encryption", "firewall"],
    "ISO27001": ["access", "MFA", "encryption", "public"],
    "NIST": ["MFA", "encryption", "logging", "IAM"],
}

FRAMEWORK_META = {
    "CIS": {"category": "Benchmarks"},
    "SOC2": {"category": "Trust"},
    "PCI_DSS": {"category": "Regulatory"},
    "ISO27001": {"category": "Regulatory"},
    "NIST": {"category": "Benchmarks"},
}


@router.get("/compliance/frameworks")
async def list_frameworks():
    return [
        {"code": code, "name": code, "controls": len(keywords), "category": FRAMEWORK_META[code]["category"]}
        for code, keywords in FRAMEWORK_CONTROL_MAP.items()
    ]


@router.post("/compliance/frameworks")
async def add_framework(payload: dict = Body(...)):
    code = (payload.get("code") or payload.get("name") or "").upper().replace(" ", "_")
    keywords = payload.get("controls") or payload.get("keywords") or ["MFA", "encryption"]
    if not code:
        return {"status": "error", "detail": "Framework code is required"}
    FRAMEWORK_CONTROL_MAP[code] = [str(item) for item in keywords]
    FRAMEWORK_META[code] = {"category": payload.get("category") or "Custom"}
    return {"code": code, "name": code, "controls": len(FRAMEWORK_CONTROL_MAP[code]), "category": FRAMEWORK_META[code]["category"]}


@router.get("/compliance/assessments")
@router.post("/compliance/assessments")
async def assess_compliance(
    request: Request,
    db: AsyncSession = Depends(get_db),
    frameworkType: Optional[str] = None,
    cloudAccountId: Optional[str] = None,
):
    demo = is_demo_request(request)
    accounts = [row for row in (await db.execute(select(CloudAccount))).scalars().all() if in_scope(row.account_id, demo)]
    if cloudAccountId:
        accounts = [row for row in accounts if row.account_id == cloudAccountId or row.id == cloudAccountId]
    if not accounts:
        return []
    account_ids = {row.account_id for row in accounts}
    findings = [
        row
        for row in (await db.execute(select(CSPMFinding).where(CSPMFinding.status == "OPEN"))).scalars().all()
        if in_scope(row.account_id, demo) and row.account_id in account_ids
    ]
    frameworks = FRAMEWORK_CONTROL_MAP.items()
    if frameworkType and frameworkType.upper() != "ALL":
        frameworks = [(code, keywords) for code, keywords in frameworks if code == frameworkType.upper()]
    assessments = []
    for framework, keywords in frameworks:
        failed = []
        passed = []
        for keyword in keywords:
            matches = [f for f in findings if keyword.lower() in (f.title or "").lower() or keyword.lower() in (f.remediation_playbook or "").lower()]
            if matches:
                failed.append({"control": keyword, "status": "FAIL", "evidence": matches[0].title})
            else:
                passed.append({"control": keyword, "status": "PASS"})
        total = len(keywords)
        score = round(100 * len(passed) / total, 1) if total else 100
        assessments.append({
            "framework": framework,
            "category": FRAMEWORK_META.get(framework, {}).get("category", "Custom"),
            "score": score,
            "passed": len(passed),
            "failed": len(failed),
            "controls": passed + failed,
            "assessed_at": datetime.utcnow().isoformat(),
            "account_id": cloudAccountId,
        })
    return assessments


@router.get("/compliance/export")
async def export_compliance(
    request: Request,
    db: AsyncSession = Depends(get_db),
    frameworkType: Optional[str] = None,
    cloudAccountId: Optional[str] = None,
):
    assessments = await assess_compliance(request, db, frameworkType=frameworkType, cloudAccountId=cloudAccountId)
    return {"format": "json", "assessments": assessments}
