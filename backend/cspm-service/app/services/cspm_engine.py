"""CNAPP-style CSPM engine: evaluate stored assets against the policy catalog."""
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.models import CloudAccount, CloudAsset, CSPMFinding, CSPMPolicy, ScanJob
from app.services.policy_evaluator import PolicyEvaluator
from app.services.seed_data import DEFAULT_POLICIES

logger = logging.getLogger("cspm.engine")


class CspmEngine:
    async def run_scan(
        self,
        db: AsyncSession,
        account_id: Optional[str] = None,
        provider: Optional[str] = None,
        triggered_by: str = "manual",
    ) -> Dict[str, Any]:
        job = ScanJob(
            id=str(uuid.uuid4()),
            account_id=account_id,
            provider=provider,
            status="RUNNING",
            triggered_by=triggered_by,
            started_at=datetime.utcnow(),
        )
        db.add(job)
        await db.commit()

        try:
            policies = await self._load_policies(db)
            evaluator = PolicyEvaluator(policies)

            query = select(CloudAsset)
            if account_id:
                query = query.where(CloudAsset.account_id == account_id)
            if provider:
                query = query.where(CloudAsset.provider == provider.upper())
            result = await db.execute(query)
            assets = result.scalars().all()

            asset_dicts = []
            for asset in assets:
                asset_dicts.append({
                    "id": asset.id,
                    "account_id": asset.account_id,
                    "name": asset.name,
                    "asset_type": asset.asset_type,
                    "provider": asset.provider,
                    "region": asset.region,
                    "resource_id": asset.resource_id,
                    "risk_score": asset.risk_score,
                    "compliance_status": asset.compliance_status,
                    "details": asset.details,
                })

            account_name = "Cloud Account"
            if account_id:
                acc_res = await db.execute(select(CloudAccount).where(CloudAccount.account_id == account_id))
                acc = acc_res.scalars().first()
                if acc:
                    account_name = acc.name

            evaluated, findings = evaluator.evaluate_assets(
                account_id=account_id or "multi-account",
                account_name=account_name,
                assets=asset_dicts,
            )

            created = 0
            for finding in findings:
                key = f"{finding['policy_id']}:{finding['resource_id']}"
                existing = await db.execute(
                    select(CSPMFinding).where(
                        CSPMFinding.policy_id == finding["policy_id"],
                        CSPMFinding.resource_id == finding["resource_id"],
                    )
                )
                row = existing.scalars().first()
                if row:
                    row.status = "OPEN"
                    row.title = finding["title"]
                    row.severity = finding["severity"]
                    row.remediation_playbook = finding.get("remediation_playbook")
                    row.deduplication_key = key
                else:
                    finding["deduplication_key"] = key
                    db.add(CSPMFinding(**{k: v for k, v in finding.items() if hasattr(CSPMFinding, k)}))
                    created += 1

            asset_by_id = {a.id: a for a in assets}
            for evaluated_asset in evaluated:
                asset = asset_by_id.get(evaluated_asset.get("id"))
                if asset:
                    asset.compliance_status = evaluated_asset.get("compliance_status", asset.compliance_status)
                    asset.risk_score = evaluated_asset.get("risk_score", asset.risk_score)

            job.status = "COMPLETED"
            job.total_assets = len(assets)
            job.findings_created = created
            job.completed_at = datetime.utcnow()
            job.details = {"evaluated": len(evaluated), "open_findings": len(findings)}
            await db.commit()
            await db.refresh(job)
            return {
                "scanJobId": job.id,
                "status": job.status,
                "totalAssets": job.total_assets,
                "findingsCreated": job.findings_created,
            }
        except Exception as exc:
            logger.exception("CSPM scan failed")
            job.status = "FAILED"
            job.details = {"error": str(exc)}
            job.completed_at = datetime.utcnow()
            await db.commit()
            return {
                "scanJobId": job.id,
                "status": "FAILED",
                "totalAssets": 0,
                "findingsCreated": 0,
                "error": str(exc),
            }

    async def _load_policies(self, db: AsyncSession) -> List[Dict[str, Any]]:
        result = await db.execute(select(CSPMPolicy))
        rows = result.scalars().all()
        if rows:
            return [
                {
                    "id": row.id,
                    "title": row.title,
                    "name": row.title,
                    "severity": row.severity,
                    "framework": row.framework,
                    "enabled": row.enabled,
                    "remediation_steps": row.remediation_steps,
                    "provider": row.provider,
                    "service": row.service,
                }
                for row in rows
            ]
        return DEFAULT_POLICIES


cspm_engine = CspmEngine()
