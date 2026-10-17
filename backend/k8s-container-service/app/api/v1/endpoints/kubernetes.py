from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import K8sCluster, K8sPodAudit
from app.schemas.k8s_container import K8sClusterResponse, K8sPodAuditResponse
from app.services.k8s_sync_service import k8s_sync_service
from app.services.demo_scope import is_demo_request, in_scope

router = APIRouter()


@router.get("/kubernetes/search")
async def search_kubernetes(q: str, db: AsyncSession = Depends(get_db)):
    term = f"%{q}%"
    clusters = (await db.execute(select(K8sCluster).where(K8sCluster.name.ilike(term)))).scalars().all()
    audits = (await db.execute(select(K8sPodAudit).where(K8sPodAudit.pod_name.ilike(term)))).scalars().all()
    hits = [{"type": "cluster", "id": c.id, "title": c.name, "url": "/kubernetes"} for c in clusters[:8]]
    hits.extend({"type": "k8s_finding", "id": a.id, "title": f"{a.pod_name}: {a.check_name}", "url": "/kubernetes", "severity": a.severity} for a in audits[:8])
    return hits


@router.get("/kubernetes/stats")
async def kubernetes_stats(request: Request, db: AsyncSession = Depends(get_db)):
    demo = is_demo_request(request)
    clusters = [row for row in (await db.execute(select(K8sCluster))).scalars().all() if in_scope(row.id, demo)]
    findings = [row for row in (await db.execute(select(K8sPodAudit))).scalars().all() if in_scope(row.cluster_id, demo)]
    return {
        "clusters": len(clusters),
        "findings": len(findings),
        "critical": len([row for row in findings if (row.severity or "").upper() == "CRITICAL"]),
        "high": len([row for row in findings if (row.severity or "").upper() == "HIGH"]),
        "privileged_pods": sum((row.privileged_pods_count or 0) for row in clusters),
        "avg_posture": round(
            (sum((row.posture_score or 0) for row in clusters) / len(clusters)) if clusters else 0,
            1,
        ),
    }


@router.get("/kubernetes/clusters", response_model=List[K8sClusterResponse])
async def list_k8s_clusters(
    request: Request,
    provider: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List registered EKS, GKE, AKS, and on-prem Kubernetes clusters."""
    query = select(K8sCluster)
    if provider and provider.upper() != "ALL":
        query = query.where(K8sCluster.provider == provider.upper())
    result = await db.execute(query)
    demo = is_demo_request(request)
    return [row for row in result.scalars().all() if in_scope(row.id, demo)]


@router.post("/kubernetes/demo/provision")
async def provision_demo_kubernetes(request: Request, db: AsyncSession = Depends(get_db)):
    if not is_demo_request(request):
        raise HTTPException(status_code=403, detail="Demo Kubernetes data is only available to the demo account.")
    existing = (await db.execute(select(K8sCluster).where(K8sCluster.id == "DEMO-eks-prod"))).scalar_one_or_none()
    if not existing:
        db.add(K8sCluster(
            id="DEMO-eks-prod",
            name="demo-eks-prod",
            provider="EKS",
            version="1.29",
            region="us-east-1",
            status="WARNING",
            nodes_count=6,
            namespaces_count=12,
            pods_count=84,
            privileged_pods_count=3,
            posture_score=71.0,
        ))
        db.add(K8sPodAudit(
            audit_id="DEMO-AUDIT-001",
            cluster_id="DEMO-eks-prod",
            cluster_name="demo-eks-prod",
            namespace="prod",
            pod_name="demo-auth-service",
            check_name="privileged-container",
            severity="CRITICAL",
            status="VIOLATION",
            description="Demo pod runs privileged=true",
            remediation="Remove privileged flag from the security context.",
        ))
        await db.commit()
    return {"status": "ready", "mode": "demo"}


@router.get("/kubernetes/clusters/{cluster_id}", response_model=K8sClusterResponse)
async def get_k8s_cluster(cluster_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(K8sCluster).where(K8sCluster.id == cluster_id))
    cluster = result.scalar_one_or_none()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return cluster


@router.post("/kubernetes/clusters/sync", status_code=status.HTTP_200_OK)
@router.post("/kubernetes/scan", status_code=status.HTTP_200_OK)
async def trigger_k8s_cluster_sync(db: AsyncSession = Depends(get_db)):
    """Trigger live Kubernetes API cluster posture scan and Pod Security Standards audit."""
    return await k8s_sync_service.run_sync(db=db)


@router.get("/kubernetes/audits", response_model=List[K8sPodAuditResponse])
@router.get("/kubernetes/findings", response_model=List[K8sPodAuditResponse])
async def get_k8s_pod_security_audits(
    request: Request,
    cluster_id: Optional[str] = None,
    severity: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Kubernetes Pod Security Standards audit results."""
    query = select(K8sPodAudit)
    if cluster_id:
        query = query.where(K8sPodAudit.cluster_id == cluster_id)
    if severity and severity.upper() != "ALL":
        query = query.where(K8sPodAudit.severity == severity.upper())
    result = await db.execute(query)
    demo = is_demo_request(request)
    return [row for row in result.scalars().all() if in_scope(row.cluster_id, demo)]


@router.patch("/kubernetes/findings/{finding_id}/status", response_model=K8sPodAuditResponse)
async def update_k8s_finding_status(
    finding_id: str,
    status: str,
    db: AsyncSession = Depends(get_db),
):
    valid = {"OPEN", "SUPPRESSED", "REMEDIATED", "VIOLATION", "WARNING", "PASSED"}
    if status.upper() not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {sorted(valid)}")
    result = await db.execute(
        select(K8sPodAudit).where((K8sPodAudit.id == finding_id) | (K8sPodAudit.audit_id == finding_id))
    )
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    finding.status = status.upper()
    await db.commit()
    await db.refresh(finding)
    return finding
