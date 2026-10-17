"""
Kubernetes & Container Service Ingestion Sync Orchestrator
Aggregates live Kubernetes cluster security posture scans and pod security audits.
"""
import logging
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.models.models import K8sCluster, K8sPodAudit
from app.services.collectors.k8s_collector import K8sCollector
from app.services.seed_data import DEFAULT_CLUSTERS

logger = logging.getLogger("k8s.sync_service")


class K8sSyncService:
    """Orchestrator for executing Kubernetes cluster and pod security standards auditing."""

    async def run_sync(self, db: AsyncSession = None) -> Dict[str, Any]:
        logger.info("🚀 Triggering Live Kubernetes Cluster Posture & Pod Security Ingestion Sync...")

        collector = K8sCollector()
        clusters_data, audits_data = collector.scan()

        if db:
            try:
                await db.execute(delete(K8sPodAudit))
                await db.execute(delete(K8sCluster))

                for cls_item in clusters_data:
                    db_cls = K8sCluster(
                        id=cls_item["id"],
                        name=cls_item["name"],
                        provider=cls_item["provider"],
                        version=cls_item["version"],
                        region=cls_item.get("region", "us-east-1"),
                        status=cls_item.get("status", "ACTIVE"),
                        nodes_count=cls_item["nodes_count"],
                        namespaces_count=cls_item["namespaces_count"],
                        pods_count=cls_item["pods_count"],
                        privileged_pods_count=cls_item["privileged_pods_count"],
                        posture_score=cls_item["posture_score"],
                        last_audited=cls_item["last_audited"],
                    )
                    db.add(db_cls)

                for aud_item in audits_data:
                    db_aud = K8sPodAudit(
                        id=aud_item.get("id"),
                        audit_id=aud_item["audit_id"],
                        cluster_id=aud_item["cluster_id"],
                        cluster_name=aud_item.get("cluster_name"),
                        namespace=aud_item["namespace"],
                        pod_name=aud_item["pod_name"],
                        check_name=aud_item["check_name"],
                        severity=aud_item["severity"],
                        status=aud_item["status"],
                        description=aud_item.get("description"),
                        remediation=aud_item.get("remediation"),
                    )
                    db.add(db_aud)

                await db.commit()
                logger.info("✅ Database updated successfully in schema_k8s_container.")
            except Exception as e:
                logger.warning(f"⚠️ DB K8s sync note: {e}")
                await db.rollback()

        # Update in-memory seed data reference fallback
        DEFAULT_CLUSTERS.clear()
        DEFAULT_CLUSTERS.extend(clusters_data)

        return {
            "status": "success",
            "clusters_count": len(clusters_data),
            "audits_count": len(audits_data),
            "clusters": clusters_data,
            "audits": audits_data,
        }


k8s_sync_service = K8sSyncService()
