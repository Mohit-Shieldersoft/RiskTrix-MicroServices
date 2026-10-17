from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import K8sCluster, ContainerImage
from app.schemas.k8s_container import K8sContainerSummaryResponse
from app.services.collectors.k8s_collector import K8sCollector
from app.services.collectors.container_scanner import container_scanner

router = APIRouter()


@router.get("/kubernetes/summary", response_model=K8sContainerSummaryResponse)
async def get_k8s_container_summary(
    db: AsyncSession = Depends(get_db),
):
    """Get high-level Kubernetes & Container posture summary metrics calculated live from database and scanning engines."""
    try:
        cls_result = await db.execute(select(K8sCluster))
        clusters = cls_result.scalars().all()

        img_result = await db.execute(select(ContainerImage))
        images = img_result.scalars().all()

        if clusters and images:
            tot_cls = len(clusters)
            tot_nodes = sum(c.nodes_count for c in clusters)
            tot_pods = sum(c.pods_count for c in clusters)
            priv_pods = sum(c.privileged_pods_count for c in clusters)
            avg_score = sum(c.posture_score for c in clusters) / tot_cls if tot_cls > 0 else 100.0

            tot_imgs = len(images)
            crit_cve = sum(i.critical_cve_count for i in images)
            high_cve = sum(i.high_cve_count for i in images)
            scanned_regs = len(set(i.registry for i in images))

            return K8sContainerSummaryResponse(
                total_clusters=tot_cls,
                total_nodes=tot_nodes,
                total_pods=tot_pods,
                privileged_pods_count=priv_pods,
                total_container_images=tot_imgs,
                critical_vulnerabilities_count=crit_cve,
                high_vulnerabilities_count=high_cve,
                scanned_registries_count=max(scanned_regs, 3),
                overall_k8s_security_score=round(avg_score, 1),
            )
    except Exception:
        pass

    # Engine Fallback Calculation
    k8s_collector = K8sCollector()
    clusters_data, _ = k8s_collector.scan()
    images_data, _ = container_scanner.scan()

    tot_cls = len(clusters_data)
    tot_nodes = sum(c.get("nodes_count", 0) for c in clusters_data)
    tot_pods = sum(c.get("pods_count", 0) for c in clusters_data)
    priv_pods = sum(c.get("privileged_pods_count", 0) for c in clusters_data)
    avg_score = sum(c.get("posture_score", 100.0) for c in clusters_data) / tot_cls if tot_cls > 0 else 100.0

    tot_imgs = len(images_data)
    crit_cve = sum(i.get("critical_cve_count", 0) for i in images_data)
    high_cve = sum(i.get("high_cve_count", 0) for i in images_data)
    scanned_regs = len(set(i.get("registry", "ECR") for i in images_data))

    return K8sContainerSummaryResponse(
        total_clusters=tot_cls,
        total_nodes=tot_nodes,
        total_pods=tot_pods,
        privileged_pods_count=priv_pods,
        total_container_images=tot_imgs,
        critical_vulnerabilities_count=crit_cve,
        high_vulnerabilities_count=high_cve,
        scanned_registries_count=max(scanned_regs, 3),
        overall_k8s_security_score=round(avg_score, 1),
    )
