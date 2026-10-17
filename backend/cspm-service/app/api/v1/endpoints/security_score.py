from datetime import datetime

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import CSPMFinding, CloudAsset, CloudAccount, SecurityScoreSnapshot
from app.services.demo_scope import is_demo_request, in_scope

router = APIRouter()


def _score_from_findings(findings, assets, accounts) -> dict:
    crit = len([f for f in findings if f.severity == "CRITICAL" and f.status == "OPEN"])
    high = len([f for f in findings if f.severity == "HIGH" and f.status == "OPEN"])
    med = len([f for f in findings if f.severity == "MEDIUM" and f.status == "OPEN"])
    posture = max(0.0, 100 - crit * 12 - high * 6 - med * 2)
    iam_assets = [a for a in assets if a.asset_type in ("IAM", "IAM_USER", "IAM_ROLE")]
    iam = max(0.0, 100 - len([a for a in iam_assets if a.compliance_status == "NON_COMPLIANT"]) * 8)
    vuln = max(0.0, 100 - crit * 8 - high * 4)
    compliance = max(0.0, 100 - crit * 10 - high * 5)
    overall = round(posture * 0.4 + iam * 0.2 + vuln * 0.2 + compliance * 0.2, 1)
    return {
        "overall_score": overall,
        "posture_score": round(posture, 1),
        "iam_score": round(iam, 1),
        "vuln_score": round(vuln, 1),
        "compliance_score": round(compliance, 1),
        "critical_findings": crit,
        "high_findings": high,
        "accounts_active": len(accounts),
        "assets_scanned": len(assets),
    }


@router.get("/security-score")
async def get_security_score(request: Request, db: AsyncSession = Depends(get_db)):
    demo = is_demo_request(request)
    findings = [row for row in (await db.execute(select(CSPMFinding))).scalars().all() if in_scope(row.account_id, demo)]
    assets = [row for row in (await db.execute(select(CloudAsset))).scalars().all() if in_scope(row.account_id, demo)]
    accounts = [row for row in (await db.execute(select(CloudAccount))).scalars().all() if in_scope(row.account_id, demo)]
    if not accounts:
        return {
            "overall_score": None,
            "posture_score": None,
            "iam_score": None,
            "vuln_score": None,
            "compliance_score": None,
            "critical_findings": 0,
            "high_findings": 0,
            "accounts_active": 0,
            "assets_scanned": 0,
            "calculated_at": None,
        }
    payload = _score_from_findings(findings, assets, accounts)
    snapshot = SecurityScoreSnapshot(**{k: payload[k] for k in (
        "overall_score", "posture_score", "iam_score", "vuln_score", "compliance_score", "critical_findings", "high_findings"
    )})
    db.add(snapshot)
    await db.commit()
    payload["calculated_at"] = datetime.utcnow().isoformat()
    providers = {}
    for account in accounts:
        providers.setdefault(account.provider, {"accounts": 0, "findings": 0})
        providers[account.provider]["accounts"] += 1
        providers[account.provider]["findings"] += len([f for f in findings if f.account_id == account.account_id and f.status == "OPEN"])
    payload["providerScores"] = [
        {
            "provider": name,
            "score": max(0.0, 100 - info["findings"] * 6),
            "accounts": info["accounts"],
            "open_findings": info["findings"],
        }
        for name, info in providers.items()
    ]
    payload["categoryScores"] = [
        {"category": "Posture", "score": payload["posture_score"]},
        {"category": "IAM", "score": payload["iam_score"]},
        {"category": "Vulnerability", "score": payload["vuln_score"]},
        {"category": "Compliance", "score": payload["compliance_score"]},
    ]
    payload["open_findings"] = [
        {"id": f.id, "title": f.title, "severity": f.severity, "provider": next((a.provider for a in accounts if a.account_id == f.account_id), None)}
        for f in findings if f.status == "OPEN"
    ][:20]
    payload["risky_assets"] = [
        {"id": a.id, "name": a.name, "risk_score": a.risk_score, "provider": a.provider}
        for a in sorted(assets, key=lambda item: item.risk_score or 0, reverse=True)[:12]
    ]
    return payload


@router.get("/security-score/history")
async def security_score_history(days: int = 30, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SecurityScoreSnapshot).order_by(SecurityScoreSnapshot.created_at.desc()))
    rows = result.scalars().all()
    limit = max(1, min(days, 90))
    return [
        {
            "overall_score": row.overall_score,
            "posture_score": row.posture_score,
            "iam_score": getattr(row, "iam_score", None),
            "vuln_score": getattr(row, "vuln_score", None),
            "compliance_score": getattr(row, "compliance_score", None),
            "created_at": row.created_at,
        }
        for row in rows[:limit]
    ]
