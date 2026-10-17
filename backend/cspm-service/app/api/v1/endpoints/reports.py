import json
import os
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, PlainTextResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import CloudReport, CSPMFinding, CloudAsset, CloudAccount, SecurityScoreSnapshot
from app.services.demo_scope import is_demo_request, in_scope
from app.services.report_pdf import render_report_pdf
from app.services.report_template import REPORT_META, content_to_csv, render_report_html

router = APIRouter()

REPORT_TITLES = {code: meta["label"] for code, meta in REPORT_META.items()}

CIEM_URL = os.getenv("CIEM_SERVICE_URL", "http://ciem-service:8015")
ALERT_URL = os.getenv("ALERT_SERVICE_URL", "http://alert-notification-service:8017")
K8S_URL = os.getenv("K8S_SERVICE_URL", "http://k8s-container-service:8016")
APP_URL = os.getenv("APPLICATION_SERVICE_URL", "http://application-service:8001")
IAM_URL = os.getenv("IDENTITY_SERVICE_URL", "http://cisodashboard-backend:8000")


def _serialize_report(row: CloudReport) -> Dict[str, Any]:
    return {
        "id": row.id,
        "report_type": row.report_type,
        "type": row.report_type,
        "title": row.title,
        "format": row.format,
        "status": "COMPLETED",
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "expires_at": row.expires_at.isoformat() if row.expires_at else None,
    }


def _parse_content(raw: Any) -> Dict[str, Any]:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {"rows": parsed, "generatedAt": datetime.utcnow().isoformat()}
        except Exception:
            return {"raw": raw, "generatedAt": datetime.utcnow().isoformat()}
    return {"generatedAt": datetime.utcnow().isoformat()}


def _as_list(payload: Any) -> List[Dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        for key in ("items", "data", "results", "identities", "alerts"):
            if isinstance(payload.get(key), list):
                return [item for item in payload[key] if isinstance(item, dict)]
    return []


async def _fetch_json(url: str, params: Optional[dict] = None, headers: Optional[dict] = None) -> Any:
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            res = await client.get(url, params=params, headers=headers)
            if res.status_code == 200:
                return res.json()
    except Exception:
        return None
    return None


def _finding_row(finding: CSPMFinding) -> Dict[str, Any]:
    return {
        "id": finding.id,
        "title": finding.title,
        "severity": finding.severity,
        "status": finding.status,
        "asset": finding.asset_name,
        "policy": finding.policy_id,
        "region": None,
        "account": finding.account_name,
        "framework": finding.compliance_framework,
        "created_at": finding.created_at.isoformat() if finding.created_at else None,
    }


def _asset_row(asset: CloudAsset) -> Dict[str, Any]:
    return {
        "id": asset.id,
        "name": asset.name,
        "type": asset.asset_type,
        "provider": asset.provider,
        "region": asset.region,
        "risk_score": asset.risk_score,
        "status": asset.compliance_status,
        "account": asset.account_id,
    }


async def _scoped(db: AsyncSession, demo: bool):
    findings = [row for row in (await db.execute(select(CSPMFinding))).scalars().all() if in_scope(row.account_id, demo)]
    assets = [row for row in (await db.execute(select(CloudAsset))).scalars().all() if in_scope(row.account_id, demo)]
    accounts = [row for row in (await db.execute(select(CloudAccount))).scalars().all() if in_scope(row.account_id, demo)]
    return findings, assets, accounts


def _operational(findings: List[CSPMFinding]) -> Dict[str, int]:
    open_findings = [row for row in findings if row.status == "OPEN"]
    return {
        "openFindings": len(open_findings),
        "openAlerts": 0,
        "criticalAlerts": len([row for row in open_findings if row.severity == "CRITICAL"]),
    }


def _summary(findings: List[CSPMFinding], assets: List[CloudAsset], accounts: List[CloudAccount], score: Optional[float]) -> Dict[str, Any]:
    risky = [row for row in assets if (row.risk_score or 0) >= 40 or row.compliance_status == "NON_COMPLIANT"]
    return {
        "totalAssets": len(assets),
        "totalCloudAccounts": len(accounts),
        "totalRiskyAssets": len(risky),
        "riskScore": score,
        "criticalAssets": len([row for row in assets if (row.risk_score or 0) >= 80]),
        "highAssets": len([row for row in assets if 60 <= (row.risk_score or 0) < 80]),
    }


async def _latest_score(db: AsyncSession) -> Optional[float]:
    result = await db.execute(select(SecurityScoreSnapshot).order_by(SecurityScoreSnapshot.created_at.desc()))
    row = result.scalars().first()
    return row.overall_score if row else None


async def build_report_content(report_type: str, db: AsyncSession, demo: bool, filters: Optional[dict] = None) -> Dict[str, Any]:
    filters = filters or {}
    findings, assets, accounts = await _scoped(db, demo)
    score = await _latest_score(db)
    headers = {"X-RiskTrix-Demo": "1"} if demo else {}
    now = datetime.utcnow().isoformat()
    base = {
        "generatedAt": now,
        "filters": filters,
        "summary": _summary(findings, assets, accounts, score),
        "operationalSnapshot": _operational(findings),
        "overall_score": score,
        "accounts": len(accounts),
        "assets": len(assets),
        "open_findings": len([row for row in findings if row.status == "OPEN"]),
        "critical": len([row for row in findings if row.severity == "CRITICAL" and row.status == "OPEN"]),
    }

    if report_type in ("EXECUTIVE", "CLOUD_POSTURE"):
        return {
            **base,
            "cloudAccounts": [
                {"id": row.id, "name": row.name, "provider": row.provider, "status": row.status, "region": row.region}
                for row in accounts
            ],
            "topRiskyAssets": sorted((_asset_row(row) for row in assets), key=lambda item: item.get("risk_score") or 0, reverse=True)[:20],
            "findings": [_finding_row(row) for row in findings if row.status == "OPEN"][:80],
        }

    if report_type == "CSPM":
        return {**base, "findings": [_finding_row(row) for row in findings if row.status == "OPEN"][:500]}

    if report_type == "ASSET_INVENTORY":
        return {**base, "assets": [_asset_row(row) for row in assets][:1000]}

    if report_type == "COMPLIANCE":
        payload = await _fetch_json(f"{os.getenv('CSPM_SELF_URL', 'http://127.0.0.1:8014')}/api/v1/cloud/compliance/assessments", headers=headers)
        assessments = _as_list(payload)
        if not assessments:
            frameworks = {}
            for finding in findings:
                frameworks.setdefault(finding.compliance_framework or "CIS", []).append(finding)
            assessments = [
                {
                    "framework": name,
                    "status": "GAP" if rows else "PASS",
                    "open_findings": len([row for row in rows if row.status == "OPEN"]),
                    "severity": "HIGH" if any(row.severity == "CRITICAL" for row in rows) else "MEDIUM",
                }
                for name, rows in frameworks.items()
            ]
        return {**base, "assessments": assessments}

    if report_type == "CIEM":
        identities = _as_list(await _fetch_json(f"{CIEM_URL}/api/v1/ciem/identities", headers=headers))
        return {**base, "identities": identities[:500]}

    if report_type == "KUBERNETES":
        clusters = _as_list(await _fetch_json(f"{K8S_URL}/api/v1/kubernetes/clusters", headers=headers))
        k8s_findings = _as_list(await _fetch_json(f"{K8S_URL}/api/v1/kubernetes/findings", headers=headers))
        return {**base, "clusters": clusters, "findings": k8s_findings[:200]}

    if report_type == "CONTAINER":
        images = _as_list(await _fetch_json(f"{K8S_URL}/api/v1/containers/images", headers=headers))
        vulns = _as_list(await _fetch_json(f"{K8S_URL}/api/v1/containers/vulnerabilities", headers=headers))
        return {**base, "images": images, "vulnerabilities": vulns[:200]}

    if report_type == "RUNTIME":
        threats = _as_list(await _fetch_json(f"{K8S_URL}/api/v1/runtime/threats", headers=headers))
        events = _as_list(await _fetch_json(f"{K8S_URL}/api/v1/runtime/events", headers=headers))
        return {**base, "threats": threats[:100], "events": events[:200]}

    if report_type == "ALERT":
        alerts = _as_list(await _fetch_json(f"{ALERT_URL}/api/v1/alerts", headers=headers))
        open_alerts = [row for row in alerts if str(row.get("status") or "").upper() not in ("RESOLVED", "CLOSED")]
        critical = [row for row in alerts if str(row.get("severity") or "").upper() == "CRITICAL"]
        base["operationalSnapshot"]["openAlerts"] = len(open_alerts)
        base["operationalSnapshot"]["criticalAlerts"] = len(critical)
        return {**base, "alerts": alerts[:500]}

    if report_type == "AUDIT":
        logs = _as_list(await _fetch_json(f"{IAM_URL}/api/v1/platform-audit", headers=headers))
        return {**base, "auditLogs": logs[:1000]}

    if report_type in ("VULNERABILITY", "APPLICATION"):
        params = {"size": 100}
        if filters.get("application_id"):
            params["application_id"] = filters["application_id"]
        apps = _as_list(await _fetch_json(f"{APP_URL}/api/v1/applications", headers=headers))
        vulns = _as_list(await _fetch_json(f"{APP_URL}/api/v1/vulnerabilities", params=params, headers=headers))
        if filters.get("application_id"):
            apps = [row for row in apps if str(row.get("id")) == str(filters["application_id"])]
        return {**base, "applications": apps[:100], "vulnerabilities": vulns[:500]}

    return {**base, "findings": [_finding_row(row) for row in findings][:100]}


@router.get("/reports/types")
async def list_report_types():
    return [
        {"value": code, "label": meta["label"], "purpose": meta["purpose"], "audience": meta["audience"]}
        for code, meta in REPORT_META.items()
    ]


@router.get("/reports")
async def list_reports(report_type: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CloudReport).order_by(CloudReport.created_at.desc()))
    rows = result.scalars().all()
    if report_type:
        rows = [row for row in rows if (row.report_type or "").upper() == report_type.upper()]
    return [_serialize_report(row) for row in rows]


@router.get("/reports/{report_id}")
async def get_report(report_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CloudReport).where(CloudReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {**_serialize_report(report), "content": _parse_content(report.content)}


@router.get("/reports/{report_id}/download")
async def download_report(report_id: str, fmt: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CloudReport).where(CloudReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    content = _parse_content(report.content)
    export_fmt = (fmt or report.format or "JSON").upper()
    slug = f"risktrix-{(report.report_type or 'report').lower()}-{report.id[:8]}"
    if export_fmt == "CSV":
        return PlainTextResponse(
            content_to_csv(content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{slug}.csv"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    if export_fmt == "HTML":
        html = render_report_html(
            report.title,
            (report.report_type or "EXECUTIVE").upper(),
            content,
            {"reportId": report.id, "organizationName": "RiskTrix", "generatedByEmail": "RiskTrix Platform"},
        )
        return HTMLResponse(
            content=html,
            headers={
                "Content-Disposition": f'attachment; filename="{slug}.html"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    if export_fmt == "PDF":
        pdf = render_report_pdf(
            report.title,
            (report.report_type or "EXECUTIVE").upper(),
            content,
            {"reportId": report.id, "organizationName": "RiskTrix", "generatedByEmail": "RiskTrix Platform"},
        )
        return Response(
            content=pdf,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{slug}.pdf"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    body = json.dumps(content, indent=2, default=str)
    return Response(
        content=body,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{slug}.json"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.post("/reports/generate")
async def generate_report(
    request: Request,
    payload: dict = Body(default=None),
    report_type: str = "EXECUTIVE",
    fmt: str = "PDF",
    title: str = None,
    db: AsyncSession = Depends(get_db),
):
    body = payload or {}
    report_type = (body.get("report_type") or body.get("type") or report_type or "EXECUTIVE").upper()
    if report_type not in REPORT_META:
        raise HTTPException(status_code=400, detail=f"Unsupported report type: {report_type}")
    fmt = (body.get("format") or fmt or "PDF").upper()
    title = body.get("title") or title or REPORT_TITLES[report_type]
    filters = body.get("filters") or {}
    demo = is_demo_request(request)
    content = await build_report_content(report_type, db, demo, filters)
    report = CloudReport(
        id=str(uuid.uuid4()),
        report_type=report_type,
        title=title,
        format=fmt,
        content=json.dumps(content, default=str),
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=30),
    )
    db.add(report)
    await db.commit()
    return {
        **_serialize_report(report),
        "status": "COMPLETED",
        "content": content,
    }
