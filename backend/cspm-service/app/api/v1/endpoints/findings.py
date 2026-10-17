from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import CSPMFinding, CloudAccount, CloudAsset, CSPMPolicy
from app.schemas.cspm import CSPMFindingResponse, CSPMSummaryResponse
from app.services.seed_data import DEFAULT_FINDINGS, DEFAULT_ACCOUNTS, DEFAULT_ASSETS, DEFAULT_POLICIES

router = APIRouter()


from sqlalchemy import delete

@router.get("/findings", response_model=List[CSPMFindingResponse])
async def list_cspm_findings(
    request: Request,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    account_id: Optional[str] = None,
    search: Optional[str] = None,
    provider: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List CSPM security findings & compliance violations."""
    try:
        from app.services.demo_scope import is_demo_request, scope_ids
        acc_query = select(CloudAccount.account_id)
        acc_res = await db.execute(acc_query)
        all_account_ids = [a for a in acc_res.scalars().all() if a]
        connected_account_ids = scope_ids(all_account_ids, is_demo_request(request))

        if all_account_ids:
            await db.execute(delete(CSPMFinding).where(~CSPMFinding.account_id.in_(all_account_ids)))
            await db.commit()

        if not connected_account_ids:
            return []

        query = select(CSPMFinding).where(CSPMFinding.account_id.in_(connected_account_ids))
        if severity:
            query = query.where(CSPMFinding.severity == severity.upper())
        if status:
            query = query.where(CSPMFinding.status == status.upper())
        if account_id:
            query = query.where(CSPMFinding.account_id == account_id)

        result = await db.execute(query)
        findings = result.scalars().all()
        if search:
            term = search.lower()
            findings = [row for row in findings if term in (row.title or "").lower() or term in (row.resource_id or "").lower()]
        if provider:
            findings = [row for row in findings if provider.upper() in ((row.account_name or "") + (row.title or "")).upper()]
        return findings
    except Exception:
        return []


@router.get("/findings/stats")
async def findings_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CSPMFinding))
    findings = result.scalars().all()
    now = datetime.utcnow()
    sla_breached = 0
    for finding in findings:
        due = getattr(finding, "sla_due_at", None)
        if due and due < now and finding.status == "OPEN":
            sla_breached += 1
    return {
        "total": len(findings),
        "open": len([f for f in findings if f.status == "OPEN"]),
        "suppressed": len([f for f in findings if f.status == "SUPPRESSED"]),
        "remediated": len([f for f in findings if f.status == "REMEDIATED"]),
        "critical": len([f for f in findings if f.severity == "CRITICAL"]),
        "high": len([f for f in findings if f.severity == "HIGH"]),
        "sla_breached": sla_breached,
    }


@router.get("/findings/sla/stats")
async def findings_sla_stats(db: AsyncSession = Depends(get_db)):
    return await findings_stats(db)


@router.get("/findings/export")
async def export_findings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CSPMFinding))
    findings = result.scalars().all()
    rows = ["id,policy_id,account_id,asset_name,severity,status,title"]
    for finding in findings:
        title = (finding.title or "").replace(",", " ")
        rows.append(
            f"{finding.id},{finding.policy_id},{finding.account_id},{finding.asset_name},{finding.severity},{finding.status},{title}"
        )
    return {"format": "csv", "content": "\n".join(rows), "count": len(findings)}


@router.get("/findings/{finding_id}", response_model=CSPMFindingResponse)
async def get_finding(finding_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CSPMFinding).where(CSPMFinding.id == finding_id))
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="CSPM Finding not found")
    return finding


@router.patch("/findings/{finding_id}/assign")
async def assign_finding(finding_id: str, assignee: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CSPMFinding).where(CSPMFinding.id == finding_id))
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="CSPM Finding not found")
    finding.assigned_to = assignee
    if finding.status == "OPEN":
        finding.status = "ASSIGNED"
    await db.commit()
    await db.refresh(finding)
    return finding


@router.get("/summary", response_model=CSPMSummaryResponse)
async def get_cspm_summary(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Get high-level CSPM posture executive summary metrics."""
    try:
        a_query = select(CloudAccount)
        a_res = await db.execute(a_query)
        from app.services.demo_scope import is_demo_request, in_scope
        accounts = [row for row in a_res.scalars().all() if in_scope(row.account_id, is_demo_request(request))]

        if not accounts:
            return CSPMSummaryResponse(
                total_accounts=0,
                total_assets=0,
                total_findings=0,
                critical_findings=0,
                high_findings=0,
                medium_findings=0,
                low_findings=0,
                compliance_score=None,
                provider_breakdown={"AWS": 0, "AZURE": 0, "GCP": 0},
            )

        f_query = select(CSPMFinding).where(CSPMFinding.account_id.in_([acc.account_id for acc in accounts]))
        f_res = await db.execute(f_query)
        findings = f_res.scalars().all()

        ast_query = select(CloudAsset).where(CloudAsset.account_id.in_([acc.account_id for acc in accounts]))
        ast_res = await db.execute(ast_query)
        assets = ast_res.scalars().all()

        total_acc = len(accounts) if accounts else 0
        total_ast = len(assets) if assets else 0
        total_fnd = len(findings) if findings else 0
        crit = len([f for f in findings if f.severity == "CRITICAL"]) if findings else 0
        high = len([f for f in findings if f.severity == "HIGH"]) if findings else 0
        med = len([f for f in findings if f.severity == "MEDIUM"]) if findings else 0
        low = len([f for f in findings if f.severity == "LOW"]) if findings else 0
        comp_score = 100.0 if not total_fnd else max(0.0, min(100.0, 100.0 - (crit * 15 + high * 8 + med * 3)))
        
        provider_map = {"AWS": 0, "AZURE": 0, "GCP": 0}
        if accounts:
            for acc in accounts:
                provider_map[acc.provider] = provider_map.get(acc.provider, 0) + 1

        return CSPMSummaryResponse(
            total_accounts=total_acc,
            total_assets=total_ast,
            total_findings=total_fnd,
            critical_findings=crit,
            high_findings=high,
            medium_findings=med,
            low_findings=low,
            compliance_score=round(comp_score, 1),
            provider_breakdown=provider_map,
        )
    except Exception:
        return CSPMSummaryResponse(
            total_accounts=0,
            total_assets=0,
            total_findings=0,
            critical_findings=0,
            high_findings=0,
            medium_findings=0,
            low_findings=0,
            compliance_score=100.0,
            provider_breakdown={"AWS": 0, "AZURE": 0, "GCP": 0},
        )


@router.post("/findings/{finding_id}/remediate", response_model=CSPMFindingResponse)
async def remediate_finding(finding_id: str, db: AsyncSession = Depends(get_db)):
    return await _set_finding_status(finding_id, "REMEDIATED", db)


@router.post("/findings/{finding_id}/suppress", response_model=CSPMFindingResponse)
async def suppress_finding(finding_id: str, db: AsyncSession = Depends(get_db)):
    return await _set_finding_status(finding_id, "SUPPRESSED", db)


@router.patch("/findings/bulk-status")
async def bulk_update_finding_status(
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
):
    finding_ids = payload.get("finding_ids") or payload.get("findingIds") or []
    status = payload.get("status") or "OPEN"
    updated = []
    for finding_id in finding_ids:
        try:
            updated.append(await _set_finding_status(finding_id, status, db))
        except HTTPException:
            continue
    return {"updated": len(updated), "findings": updated}


@router.patch("/findings/{finding_id}/status", response_model=CSPMFindingResponse)
async def update_finding_status(
    finding_id: str,
    status: str,
    db: AsyncSession = Depends(get_db),
):
    """Update finding status (OPEN, SUPPRESSED, REMEDIATED)."""
    return await _set_finding_status(finding_id, status, db)


async def _set_finding_status(finding_id: str, status: str, db: AsyncSession) -> CSPMFindingResponse:
    valid_statuses = ["OPEN", "SUPPRESSED", "REMEDIATED", "ASSIGNED"]
    if status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    result = await db.execute(select(CSPMFinding).where(CSPMFinding.id == finding_id))
    finding = result.scalar_one_or_none()
    if finding:
        finding.status = status.upper()
        await db.commit()
        await db.refresh(finding)
        return finding

    raise HTTPException(status_code=404, detail="CSPM Finding not found")
