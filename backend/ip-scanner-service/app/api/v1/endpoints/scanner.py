import asyncio
import csv
import io
import ipaddress
import json
import uuid
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import delete, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal, get_db
from app.models.models import IpScan, IpScheduledScan, IpScanRange
from app.services.scan_engine import (
    PRESET_DEFAULTS,
    TIMING_PROFILE,
    build_scan_plan,
    is_blocked_target,
    probe_host,
)
from app.services.nmap_engine import is_nmap_available, nmap_has_privileges
from app.services.demo_scope import is_demo_request, in_scope

router = APIRouter()


class ScanOptionsIn(BaseModel):
    target: Optional[str] = None
    ipAddress: Optional[str] = None
    label: Optional[str] = Field(default=None, max_length=100)
    preset: Optional[str] = None
    portRange: Optional[str] = None
    timing: Optional[str] = None
    enableUdp: Optional[bool] = None
    enableOsDetect: Optional[bool] = None
    enableNse: Optional[bool] = None
    enableShodan: bool = False
    enableVirusTotal: bool = False
    useHostDiscovery: bool = False
    enableHttpTls: Optional[bool] = None
    concurrency: Optional[int] = None
    timeout: Optional[float] = None


class CidrScanIn(ScanOptionsIn):
    cidr: Optional[str] = None


class ScheduleIn(BaseModel):
    target: str
    cron: str = "0 2 * * *"
    cronExpression: Optional[str] = None
    name: Optional[str] = None
    preset: Optional[str] = "standard"
    scanOptions: Optional[dict] = None
    enabled: bool = True
    isActive: Optional[bool] = None


class SchedulePatchIn(BaseModel):
    target: Optional[str] = None
    cron: Optional[str] = None
    cronExpression: Optional[str] = None
    name: Optional[str] = None
    enabled: Optional[bool] = None
    isActive: Optional[bool] = None
    scanOptions: Optional[dict] = None


class BulkDeleteIn(BaseModel):
    ids: List[str]


def _options_from_body(body: Optional[ScanOptionsIn], target: Optional[str] = None) -> dict:
    data = body.model_dump(exclude_none=True) if body else {}
    resolved_target = (target or data.get("target") or data.get("ipAddress") or "").strip()
    data["target"] = resolved_target
    return data


def _serialize_scan(row: IpScan) -> dict:
    result = row.result or {}
    open_ports = row.open_ports or []
    return {
        "id": row.id,
        "target": row.target,
        "ipAddress": row.target,
        "label": row.label,
        "status": row.status,
        "open_ports": open_ports,
        "ports": open_ports,
        "openPortCount": len([p for p in open_ports if (p or {}).get("state") == "open"]),
        "summary": row.summary,
        "risk_grade": row.risk_grade or result.get("risk_grade"),
        "riskGrade": row.risk_grade or result.get("risk_grade"),
        "scan_options": row.scan_options or {},
        "scanOptions": row.scan_options or {},
        "result": result,
        "http": result.get("http") or [],
        "tls": result.get("tls") or [],
        "os": result.get("os"),
        "findings": result.get("findings") or [],
        "vulnerabilities": result.get("findings") or [],
        "udp_ports": result.get("udp_ports") or [],
        "shodan": result.get("shodan"),
        "virustotal": result.get("virustotal"),
        "duration_ms": result.get("duration_ms"),
        "engine": result.get("engine"),
        "nmap": result.get("nmap"),
        "created_at": row.created_at,
        "createdAt": row.created_at,
        "enrichment": result.get("enrichment") or _enrichment(row.target),
        "dns": (result.get("enrichment") or _enrichment(row.target)).get("dns"),
        "evidence": {
            "command": (row.scan_options or {}).get("command"),
            "engine": result.get("engine"),
            "summary": row.summary,
            "nmap": result.get("nmap"),
        },
    }


def _apply_result(row: IpScan, result: dict, label: Optional[str] = None) -> None:
    row.status = "COMPLETED"
    row.open_ports = result.get("open_ports") or []
    row.summary = result.get("summary")
    row.risk_grade = result.get("risk_grade")
    row.scan_options = result.get("scan_options")
    row.result = {
        "resolved_ip": result.get("resolved_ip"),
        "udp_ports": result.get("udp_ports") or [],
        "http": result.get("http") or [],
        "tls": result.get("tls") or [],
        "os": result.get("os"),
        "findings": result.get("findings") or [],
        "shodan": result.get("shodan"),
        "virustotal": result.get("virustotal"),
        "duration_ms": result.get("duration_ms"),
        "engine": result.get("engine") or "tcp-http-probe",
        "nmap": result.get("nmap"),
        "risk_grade": result.get("risk_grade"),
        "host_discovery": result.get("host_discovery"),
    }
    if label:
        row.label = label


async def _run_scan_job(scan_id: str, target: str, options: dict) -> None:
    async with AsyncSessionLocal() as session:
        row = await session.get(IpScan, scan_id)
        if not row or row.status == "CANCELLED":
            return
        try:
            result = await asyncio.to_thread(probe_host, target, None, 0.4, options)
            fresh = await session.get(IpScan, scan_id)
            if not fresh or fresh.status == "CANCELLED":
                return
            _apply_result(fresh, result, options.get("label"))
            await session.commit()
        except Exception as exc:
            fresh = await session.get(IpScan, scan_id)
            if fresh and fresh.status != "CANCELLED":
                fresh.status = "FAILED"
                fresh.summary = str(exc)[:240]
                await session.commit()


@router.get("/ip-scanner/capabilities")
async def capabilities():
    return {
        "tcp_probe": True,
        "http_tls": True,
        "udp_probe": True,
        "os_infer": True,
        "os_fingerprint": "nmap-os-detect" if is_nmap_available() else "advanced-multi-signal",
        "risk_findings": True,
        "nmap": is_nmap_available(),
        "nmap_privileged": nmap_has_privileges() if is_nmap_available() else False,
        "async": True,
        "schedules": True,
        "diff": True,
        "reports": ["json", "csv"],
        "presets": list(PRESET_DEFAULTS.keys()),
        "timing": list(TIMING_PROFILE.keys()),
        "port_ranges": ["top40", "top100", "top1000", "1-1024", "1-65535", "custom"],
        "allow_internal_scan": settings.ALLOW_INTERNAL_SCAN,
        "max_cidr_hosts": settings.MAX_CIDR_HOSTS,
        "shodan": bool(settings.SHODAN_API_KEY),
        "virustotal": bool(settings.VIRUSTOTAL_API_KEY),
        "engine": "nmap" if is_nmap_available() else "tcp-http-probe",
    }


@router.get("/ip-scanner/profiles")
async def profiles():
    return {
        "presets": PRESET_DEFAULTS,
        "timing": TIMING_PROFILE,
        "plans": {name: build_scan_plan({"preset": name}) for name in PRESET_DEFAULTS},
    }


@router.get("/ip-scanner/readiness")
async def readiness():
    return {
        "ready": True,
        "service": "ip-scanner-service",
        "engine": "nmap" if is_nmap_available() else "tcp-http-probe",
        "nmap": is_nmap_available(),
        "privileged": nmap_has_privileges() if is_nmap_available() else False,
    }


@router.get("/ip-scanner/stats")
async def scan_stats(request: Request, db: AsyncSession = Depends(get_db)):
    demo = is_demo_request(request)
    rows = (await db.execute(select(IpScan))).scalars().all()
    scoped = [row for row in rows if in_scope(row.summary, demo)]
    completed = [row for row in scoped if row.status == "COMPLETED"]
    open_ports = sum(len(row.open_ports or []) for row in completed)
    high_risk = len([row for row in completed if (row.risk_grade or "") in {"D", "F"}])
    return {
        "totalScans": len(scoped),
        "completedScans": len(completed),
        "runningScans": len([row for row in scoped if row.status == "RUNNING"]),
        "totalOpenPorts": open_ports,
        "highRiskScans": high_risk,
    }


@router.post("/ip-scanner/scan")
async def scan_host(
    target: Optional[str] = None,
    body: Optional[ScanOptionsIn] = Body(None),
    db: AsyncSession = Depends(get_db),
):
    options = _options_from_body(body, target)
    resolved = options.get("target")
    if not resolved:
        raise HTTPException(status_code=400, detail="Target hostname or IP is required")
    try:
        result = await asyncio.to_thread(probe_host, resolved, None, 0.4, options)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    row = IpScan(id=str(uuid.uuid4()), target=resolved, label=options.get("label"), status="COMPLETED")
    _apply_result(row, result, options.get("label"))
    db.add(row)
    await db.commit()
    return {"id": row.id, "status": "COMPLETED", **result, **_serialize_scan(row)}


@router.post("/ip-scanner/scan/async")
async def scan_host_async(
    background: BackgroundTasks,
    target: Optional[str] = None,
    body: Optional[ScanOptionsIn] = Body(None),
    db: AsyncSession = Depends(get_db),
):
    options = _options_from_body(body, target)
    resolved = options.get("target")
    if not resolved:
        raise HTTPException(status_code=400, detail="Target hostname or IP is required")
    if is_blocked_target(resolved):
        raise HTTPException(status_code=400, detail="Internal scan blocked")
    row = IpScan(
        id=str(uuid.uuid4()),
        target=resolved,
        label=options.get("label"),
        status="RUNNING",
        open_ports=[],
        summary="queued",
        scan_options=build_scan_plan(options),
    )
    db.add(row)
    await db.commit()
    background.add_task(_run_scan_job, row.id, resolved, options)
    return {"id": row.id, "scanId": row.id, "status": "RUNNING", "target": resolved, "label": row.label}


@router.post("/ip-scanner/scan/range")
async def scan_range(
    cidr: Optional[str] = None,
    body: Optional[CidrScanIn] = Body(None),
    db: AsyncSession = Depends(get_db),
):
    options = _options_from_body(body, None)
    block = (cidr or (body.cidr if body else None) or options.get("target") or "").strip()
    if not block:
        raise HTTPException(status_code=400, detail="CIDR block is required")
    try:
        network = ipaddress.ip_network(block, strict=False)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid CIDR")
    if network.is_private and not settings.ALLOW_INTERNAL_SCAN:
        raise HTTPException(status_code=400, detail="RFC1918 ranges blocked unless ALLOW_INTERNAL_SCAN=true")
    hosts = list(network.hosts())[: settings.MAX_CIDR_HOSTS]
    range_row = IpScanRange(
        id=str(uuid.uuid4()),
        cidr=block,
        label=options.get("label"),
        status="COMPLETED",
        hosts_scanned=0,
        scan_options=build_scan_plan(options),
    )
    db.add(range_row)
    scans = []
    for host in hosts:
        try:
            result = await asyncio.to_thread(probe_host, str(host), None, 0.4, options)
            scan = IpScan(id=str(uuid.uuid4()), target=str(host), label=options.get("label"), status="COMPLETED")
            _apply_result(scan, result, options.get("label"))
            db.add(scan)
            scans.append({"id": scan.id, **result})
        except Exception:
            continue
    range_row.hosts_scanned = len(scans)
    await db.commit()
    return {
        "range_id": range_row.id,
        "rangeJobId": range_row.id,
        "cidr": block,
        "hosts_scanned": len(scans),
        "totalHosts": len(scans),
        "scans": scans,
    }


@router.get("/ip-scanner/ranges/{range_id}")
async def get_range(range_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IpScanRange).where(IpScanRange.id == range_id))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Range not found")
    return {
        "id": row.id,
        "cidr": row.cidr,
        "label": row.label,
        "status": row.status,
        "hosts_scanned": row.hosts_scanned,
        "scan_options": row.scan_options,
        "isRange": True,
    }


@router.get("/ip-scanner/scans")
async def list_scans(
    request: Request,
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(IpScan).order_by(IpScan.created_at.desc())
    if status:
        stmt = stmt.where(IpScan.status == status.upper())
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(or_(IpScan.target.ilike(like), IpScan.label.ilike(like), IpScan.summary.ilike(like)))
    result = await db.execute(stmt)
    demo = is_demo_request(request)
    rows = [row for row in result.scalars().all() if in_scope(row.summary, demo)]
    total = len(rows)
    start = (page - 1) * limit
    page_rows = rows[start:start + limit]
    return {
        "scans": [_serialize_scan(row) for row in page_rows],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/ip-scanner/scans/{scan_id}")
async def get_scan(scan_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(IpScan, scan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Scan not found")
    return _serialize_scan(row)


@router.delete("/ip-scanner/scans/{scan_id}")
async def delete_scan(scan_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(IpScan, scan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Scan not found")
    await db.delete(row)
    await db.commit()
    return {"status": "deleted", "id": scan_id}


@router.post("/ip-scanner/scans/bulk-delete")
async def bulk_delete_scans(body: BulkDeleteIn, db: AsyncSession = Depends(get_db)):
    if not body.ids:
        return {"status": "deleted", "count": 0}
    await db.execute(delete(IpScan).where(IpScan.id.in_(body.ids)))
    await db.commit()
    return {"status": "deleted", "count": len(body.ids)}


@router.post("/ip-scanner/scans/{scan_id}/cancel")
async def cancel_scan(scan_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(IpScan, scan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Scan not found")
    if row.status in {"COMPLETED", "FAILED", "CANCELLED"}:
        return {"id": scan_id, "status": row.status}
    row.status = "CANCELLED"
    row.summary = "Cancelled by operator"
    await db.commit()
    return {"id": scan_id, "status": "CANCELLED"}


_CANCELLED_RANGES = set()


@router.post("/ip-scanner/ranges/{range_id}/cancel")
async def cancel_range(range_id: str, db: AsyncSession = Depends(get_db)):
    _CANCELLED_RANGES.add(range_id)
    row = await db.get(IpScanRange, range_id)
    if row:
        row.status = "CANCELLED"
        await db.commit()
    return {"id": range_id, "status": "CANCELLED"}


@router.post("/ip-scanner/scans/{scan_id}/rescan")
async def rescan_host(scan_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(IpScan, scan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Scan not found")
    options = row.scan_options or {}
    result = await asyncio.to_thread(probe_host, row.target, None, 0.6, options)
    _apply_result(row, result, row.label)
    row.status = "COMPLETED"
    await db.commit()
    return _serialize_scan(row)


@router.get("/ip-scanner/scans/{scan_id}/report")
async def scan_report_export(scan_id: str, fmt: str = "json", db: AsyncSession = Depends(get_db)):
    row = await db.get(IpScan, scan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Scan not found")
    payload = _serialize_scan(row)
    if fmt.lower() == "pdf":
        from fastapi.responses import HTMLResponse
        html = f"""<html><body><h1>IP Scan Report {payload.get('target')}</h1>
        <p>{payload.get('summary')}</p><pre>{json.dumps(payload, default=str, indent=2)}</pre></body></html>"""
        return HTMLResponse(content=html, headers={"Content-Disposition": f"attachment; filename=scan-{scan_id}.html"})
    return payload


def _enrichment(target: str) -> dict:
    data = {"dns": [], "geo": None, "whois": None}
    try:
        import socket
        data["dns"] = socket.getaddrinfo(target, None)
        data["dns"] = list({item[4][0] for item in data["dns"]})
    except Exception:
        data["dns"] = []
    return data


@router.post("/ip-scanner/demo/provision")
async def provision_demo_scan(request: Request, db: AsyncSession = Depends(get_db)):
    if not is_demo_request(request):
        raise HTTPException(status_code=403, detail="Demo scans are only available to the demo account.")
    existing = (await db.execute(select(IpScan).where(IpScan.id == "DEMO-scan-example"))).scalar_one_or_none()
    if not existing:
        db.add(IpScan(
            id="DEMO-scan-example",
            target="example.com",
            label="Demo host",
            status="COMPLETED",
            open_ports=[{"port": 80, "state": "open", "banner": "HTTP", "service": "http", "protocol": "tcp"}, {"port": 443, "state": "open", "banner": "TLS", "service": "https", "protocol": "tcp"}],
            summary="[DEMO] TCP/HTTP probe of example.com. Nmap is not used. RFC1918 remains blocked.",
            risk_grade="B",
            scan_options={"preset": "standard", "engine": "tcp-http-probe"},
            result={"findings": [], "os": {"family": "Generic network host", "confidence": "low"}, "http": [], "tls": []},
        ))
        await db.commit()
    return {"status": "ready", "mode": "demo", "engine": "tcp-http", "nmap": False}


@router.get("/ip-scanner/{currentScanId}/diff/{previousScanId}")
async def scan_diff(currentScanId: str, previousScanId: str, db: AsyncSession = Depends(get_db)):
    current = (await db.execute(select(IpScan).where(IpScan.id == currentScanId))).scalar_one_or_none()
    previous = (await db.execute(select(IpScan).where(IpScan.id == previousScanId))).scalar_one_or_none()
    if not current or not previous:
        raise HTTPException(status_code=404, detail="Scan not found")
    cur_ports = {p.get("port") for p in (current.open_ports or []) if (p or {}).get("state") == "open"}
    prev_ports = {p.get("port") for p in (previous.open_ports or []) if (p or {}).get("state") == "open"}
    return {
        "current": current.target,
        "previous": previous.target,
        "opened": sorted(cur_ports - prev_ports),
        "closed": sorted(prev_ports - cur_ports),
        "unchanged": sorted(cur_ports & prev_ports),
        "added": sorted(cur_ports - prev_ports),
        "removed": sorted(prev_ports - cur_ports),
    }


@router.get("/ip-scanner/schedules")
async def list_schedules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IpScheduledScan).order_by(IpScheduledScan.created_at.desc()))
    return [
        {
            "id": row.id,
            "name": row.name,
            "target": row.target,
            "cron": row.cron,
            "cronExpression": row.cron,
            "enabled": row.enabled,
            "isActive": row.enabled,
            "scanOptions": row.scan_options or {},
            "created_at": row.created_at,
        }
        for row in result.scalars().all()
    ]


@router.post("/ip-scanner/schedules")
async def create_schedule(
    target: Optional[str] = None,
    cron: str = "0 2 * * *",
    body: Optional[ScheduleIn] = Body(None),
    db: AsyncSession = Depends(get_db),
):
    payload = body.model_dump() if body else {}
    resolved = (payload.get("target") or target or "").strip()
    if not resolved:
        raise HTTPException(status_code=400, detail="Target is required")
    expression = payload.get("cronExpression") or payload.get("cron") or cron
    enabled = payload.get("isActive") if payload.get("isActive") is not None else payload.get("enabled", True)
    row = IpScheduledScan(
        id=str(uuid.uuid4()),
        name=payload.get("name") or f"Scan {resolved}",
        target=resolved,
        cron=expression,
        enabled=bool(enabled),
        scan_options=payload.get("scanOptions") or {"preset": payload.get("preset") or "standard"},
    )
    db.add(row)
    await db.commit()
    return {"id": row.id, "name": row.name, "target": resolved, "cron": expression, "enabled": row.enabled}


@router.patch("/ip-scanner/schedules/{schedule_id}")
async def patch_schedule(schedule_id: str, body: SchedulePatchIn, db: AsyncSession = Depends(get_db)):
    row = await db.get(IpScheduledScan, schedule_id)
    if not row:
        raise HTTPException(status_code=404, detail="Schedule not found")
    if body.target:
        row.target = body.target
    if body.name:
        row.name = body.name
    if body.cron or body.cronExpression:
        row.cron = body.cronExpression or body.cron
    if body.enabled is not None:
        row.enabled = body.enabled
    if body.isActive is not None:
        row.enabled = body.isActive
    if body.scanOptions is not None:
        row.scan_options = body.scanOptions
    await db.commit()
    return {"id": row.id, "target": row.target, "cron": row.cron, "enabled": row.enabled, "name": row.name}


@router.delete("/ip-scanner/schedules/{schedule_id}")
async def delete_schedule(schedule_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IpScheduledScan).where(IpScheduledScan.id == schedule_id))
    row = result.scalar_one_or_none()
    if row:
        await db.delete(row)
        await db.commit()
    return {"status": "deleted", "id": schedule_id}


@router.get("/ip-scanner/{scan_id}/report")
async def scan_report(scan_id: str, fmt: str = "json", format: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IpScan).where(IpScan.id == scan_id))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Scan not found")
    payload = _serialize_scan(row)
    chosen = (format or fmt or "json").lower()
    if chosen == "csv":
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["target", "port", "protocol", "state", "service", "banner", "risk_grade"])
        for port in row.open_ports or []:
            writer.writerow([
                row.target,
                port.get("port"),
                port.get("protocol") or "tcp",
                port.get("state"),
                port.get("service"),
                port.get("banner"),
                row.risk_grade,
            ])
        return {"format": "csv", "content": buffer.getvalue()}
    return payload


@router.get("/ip-scanner/health-detail")
async def health_detail():
    return {"status": "healthy", "service": "ip-scanner-service", "port": 8018}
