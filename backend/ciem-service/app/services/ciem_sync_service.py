"""
CIEM Live Sync Service Orchestrator
Aggregates AWS IAM, Azure Entra ID, and GCP IAM telemetry and updates IAMGraphEngine and PostgreSQL DB.
"""
import json
import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.models.models import IAMIdentity, IAMPolicyEntitlement, IAMGraphEdge
from app.services.collectors import AWS_IAMCollector, Azure_IAMCollector, GCP_IAMCollector
from app.services.iam_graph_engine import iam_graph_engine
from app.services.seed_data import DEFAULT_IDENTITIES

logger = logging.getLogger("ciem.sync_service")


class CIEMSyncService:
    """Orchestrator for executing multi-cloud identity and entitlement ingestion."""

    async def run_sync(self, db: AsyncSession = None) -> Dict[str, Any]:
        logger.info("🚀 Triggering Live CIEM Ingestion Sync (AWS IAM, Azure Entra ID, GCP IAM)...")

        aws_coll = AWS_IAMCollector()
        azure_coll = Azure_IAMCollector()
        gcp_coll = GCP_IAMCollector()

        aws_identities, aws_entitlements, aws_edges = aws_coll.collect()
        azure_identities, azure_entitlements, azure_edges = azure_coll.collect()
        gcp_identities, gcp_entitlements, gcp_edges = gcp_coll.collect()

        all_identities = aws_identities + azure_identities + gcp_identities
        all_entitlements = aws_entitlements + azure_entitlements + gcp_entitlements
        all_edges = aws_edges + azure_edges + gcp_edges

        # 1. Update NetworkX IAM Graph Engine
        nodes_data = []
        for ident in all_identities:
            nodes_data.append({
                "id": ident["id"],
                "label": f"{ident['name']} ({ident['type']})",
                "type": ident["type"],
                "provider": ident["provider"],
                "risk_score": ident["privilege_risk_score"],
                "is_dormant": ident["is_dormant"],
            })

        links_data = []
        for edge in all_edges:
            links_data.append({
                "source": edge["source"],
                "target": edge["target"],
                "relationship": edge["relationship"],
                "is_escalation_path": edge["is_escalation_path"],
            })

        iam_graph_engine.update_graph(nodes_data, links_data)

        # 2. Persist in Database if DB session is provided
        if db:
            try:
                await db.execute(delete(IAMPolicyEntitlement))
                await db.execute(delete(IAMGraphEdge))
                await db.execute(delete(IAMIdentity))

                for item in all_identities:
                    p_str = json.dumps(item.get("policies", [])) if isinstance(item.get("policies"), list) else str(item.get("policies", ""))
                    u_str = json.dumps(item.get("unused_services", [])) if isinstance(item.get("unused_services"), list) else str(item.get("unused_services", ""))
                    
                    db_ident = IAMIdentity(
                        id=item["id"],
                        name=item["name"],
                        type=item["type"],
                        provider=item["provider"],
                        account_id=item["account_id"],
                        account_name=item.get("account_name"),
                        granted_permissions_count=item["granted_permissions_count"],
                        used_permissions_count=item["used_permissions_count"],
                        excessive_percentage=item["excessive_percentage"],
                        is_dormant=item["is_dormant"],
                        is_overprivileged=item.get("is_overprivileged", False),
                        last_active=item["last_active"],
                        privilege_risk_score=item["privilege_risk_score"],
                        policies=p_str,
                        unused_services=u_str,
                        recommended_policy=item.get("recommended_policy"),
                    )
                    db.add(db_ident)

                for ent in all_entitlements:
                    db_ent = IAMPolicyEntitlement(
                        id=ent["id"],
                        identity_id=ent["identity_id"],
                        policy_name=ent["policy_name"],
                        action=ent["action"],
                        resource=ent["resource"],
                        is_used=ent["is_used"],
                        last_used_at=ent.get("last_used_at"),
                        is_high_risk=ent.get("is_high_risk", False),
                    )
                    db.add(db_ent)

                for edge in all_edges:
                    db_edge = IAMGraphEdge(
                        source=edge["source"],
                        target=edge["target"],
                        relationship=edge["relationship"],
                        is_escalation_path=edge.get("is_escalation_path", False),
                    )
                    db.add(db_edge)

                await db.commit()
                logger.info("✅ Database updated successfully in schema_ciem.")
            except Exception as e:
                logger.warning(f"⚠️ DB sync note: {e}")
                await db.rollback()

        # Update in-memory seed reference fallback
        DEFAULT_IDENTITIES.clear()
        DEFAULT_IDENTITIES.extend(all_identities)

        return {
            "status": "success",
            "identities_count": len(all_identities),
            "entitlements_count": len(all_entitlements),
            "graph_edges_count": len(all_edges),
            "identities": all_identities,
        }


ciem_sync_service = CIEMSyncService()
