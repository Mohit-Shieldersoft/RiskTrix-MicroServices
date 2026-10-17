"""Build toxic combinations and attack paths from persisted CSPM assets/findings."""
from datetime import datetime
from typing import Dict, Any, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.models import CloudAsset, CSPMFinding, CloudAccount
from app.services.demo_scope import in_scope


async def build_toxic_combinations(db: AsyncSession, demo: bool = False) -> List[Dict[str, Any]]:
    accounts = [row for row in (await db.execute(select(CloudAccount))).scalars().all() if in_scope(row.account_id, demo)]
    if not accounts:
        return []
    allowed = {row.account_id for row in accounts}
    assets = [row for row in (await db.execute(select(CloudAsset))).scalars().all() if row.account_id in allowed]
    findings = [row for row in (await db.execute(select(CSPMFinding).where(CSPMFinding.status == "OPEN"))).scalars().all() if row.account_id in allowed]
    findings_by_asset = {}
    for finding in findings:
        findings_by_asset.setdefault(finding.resource_id, []).append(finding)

    combinations = []
    for asset in assets:
        related = findings_by_asset.get(asset.resource_id, [])
        internet = "public" in str(asset.details or "").lower() or "0.0.0.0/0" in str(asset.details or "")
        if not related and not internet:
            continue
        severity_weight = max(({"CRITICAL": 1.0, "HIGH": 0.8, "MEDIUM": 0.5, "LOW": 0.2}.get(f.severity, 0.3) for f in related), default=0.2)
        score = min(99.0, 40 + severity_weight * 40 + (20 if internet else 0) + (asset.risk_score or 0) * 2)
        if score < 55:
            continue
        combinations.append({
            "id": f"tc-{asset.id[:12]}",
            "asset_name": asset.name,
            "asset_type": asset.asset_type,
            "provider": asset.provider,
            "account_id": asset.account_id,
            "region": asset.region,
            "toxic_score": round(score, 1),
            "risk_level": "TOXIC_CRITICAL" if score >= 85 else "HIGH" if score >= 70 else "MEDIUM",
            "pillars": {
                "cspm_misconfig_score": round(severity_weight, 2),
                "cve_severity_score": 0.4,
                "ciem_privilege_score": 0.5 if asset.asset_type == "IAM" else 0.2,
                "internet_reachability_score": 1.0 if internet else 0.2,
            },
            "cspm_finding_summary": related[0].title if related else asset.details,
            "cve_id": None,
            "cve_summary": None,
            "ciem_role_arn": asset.resource_id if asset.asset_type == "IAM" else None,
            "internet_exposure": "PUBLIC_IP_ATTACHED" if internet else "PRIVATE_VPC",
            "remediation_status": "OPEN",
            "created_at": (asset.created_at or datetime.utcnow()).isoformat(),
        })
    return combinations


async def build_attack_paths(db: AsyncSession, demo: bool = False) -> List[Dict[str, Any]]:
    assets = [row for row in (await db.execute(select(CloudAsset))).scalars().all() if in_scope(row.account_id, demo)]
    findings = [row for row in (await db.execute(select(CSPMFinding).where(CSPMFinding.status == "OPEN"))).scalars().all() if in_scope(row.account_id, demo)]
    if not assets:
        return []

    network = next((a for a in assets if a.asset_type in ("NETWORK", "SECURITY_GROUP")), None)
    compute = next((a for a in assets if a.asset_type in ("COMPUTE", "EC2_INSTANCE")), None)
    iam = next((a for a in assets if a.asset_type in ("IAM", "IAM_USER", "IAM_ROLE")), None)
    storage = next((a for a in assets if a.asset_type in ("STORAGE", "S3_BUCKET", "DATABASE")), None)
    if not any([network, compute, iam, storage]):
        return []

    nodes = [{"id": "node-1", "label": "Internet", "type": "ENTRY", "icon": "🌐", "detail": "Untrusted ingress"}]
    edges = []
    prev = "node-1"
    idx = 2
    for asset, kind in ((network, "NETWORK"), (compute, "COMPUTE"), (iam, "IAM"), (storage, "CROWN_JEWEL")):
        if not asset:
            continue
        node_id = f"node-{idx}"
        nodes.append({"id": node_id, "label": asset.name, "type": kind, "icon": "●", "detail": asset.details or asset.resource_id})
        edges.append({"from": prev, "to": node_id, "label": "leads to"})
        prev = node_id
        idx += 1

    top = findings[0] if findings else None
    return [{
        "path_id": "ap-correlated-001",
        "title": top.title if top else "Internet to sensitive data path",
        "severity": top.severity if top else "HIGH",
        "risk_score": 9.1 if top and top.severity == "CRITICAL" else 7.5,
        "entry_point": "Internet / public exposure",
        "choke_point": (iam.name if iam else (network.name if network else "Restrict ingress")),
        "target_asset": storage.resource_id if storage else (compute.resource_id if compute else "sensitive-asset"),
        "status": "ACTIVE",
        "nodes": nodes,
        "edges": edges,
    }]
