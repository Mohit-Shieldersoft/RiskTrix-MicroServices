"""
Policy Evaluation Engine for RiskTrix CSPM Service
Evaluates multi-cloud assets (AWS, Azure, GCP, Kubernetes) against active security policies.
"""
import uuid
import logging
from typing import List, Dict, Any, Tuple
from app.services.seed_data import DEFAULT_POLICIES

logger = logging.getLogger("cspm.policy_evaluator")


class PolicyEvaluator:
    """Live policy rule evaluation engine for CSPM multi-cloud posture auditing."""

    def __init__(self, policies: List[Dict[str, Any]] = None):
        self.policies = {p["id"]: p for p in (policies or DEFAULT_POLICIES)}

    def evaluate_assets(
        self, account_id: str, account_name: str, assets: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Evaluate a list of discovered cloud assets against enabled security policy rules.
        Returns (updated_assets, new_findings).
        """
        evaluated_assets = []
        findings = []

        for asset in assets:
            a_copy = dict(asset)
            provider = a_copy.get("provider", "AWS").upper()
            asset_type = a_copy.get("asset_type", "").upper()
            details = str(a_copy.get("details", "")).lower()

            # Rule match evaluations
            is_non_compliant = False
            violated_policies = []

            # AWS Rules (CNAPP check IDs mapped onto RiskTrix policy catalog)
            if provider == "AWS":
                if asset_type in ("STORAGE", "S3_BUCKET") and (
                    "publicaccessblock: disabled" in details
                    or "public access" in details
                    or "is_public=true" in details
                    or "publicaccessblocked=false" in details
                ):
                    violated_policies.append("POL-AWS-001")
                if asset_type in ("STORAGE", "S3_BUCKET") and ("unencrypted" in details or "encryption=false" in details):
                    violated_policies.append("POL-AWS-001")
                if asset_type in ("NETWORK", "SECURITY_GROUP") and (
                    "openssh=true" in details or "port 22" in details or "0.0.0.0/0" in details
                ):
                    violated_policies.append("POL-AWS-002")
                if asset_type in ("IAM", "IAM_USER") and ("mfa: disabled" in details or "root" in details):
                    violated_policies.append("POL-AWS-003")
                if asset_type in ("DATABASE", "RDS_INSTANCE") and ("public" in details):
                    violated_policies.append("POL-AWS-001")
                if asset_type in ("COMPUTE", "EC2_INSTANCE") and ("imdsv1" in details or "httptokens=optional" in details):
                    violated_policies.append("POL-AWS-005")

            # Azure Rules
            elif provider == "AZURE":
                if asset_type == "STORAGE" and ("enablehttpstrafficonly=false" in details or "https: disabled" in details):
                    violated_policies.append("POL-AZURE-001")
                if asset_type == "NETWORK" and ("port 3389" in details or "open rdp" in details):
                    violated_policies.append("POL-AZURE-003")

            # GCP Rules
            elif provider == "GCP":
                if asset_type == "DATABASE" and ("public ip" in details or "is_public=true" in details):
                    violated_policies.append("POL-GCP-001")
                if asset_type == "STORAGE" and ("public access" in details or "allusers" in details):
                    violated_policies.append("POL-GCP-002")

            # Kubernetes Rules
            elif provider == "K8S":
                if "privileged=true" in details:
                    violated_policies.append("POL-K8S-001")
                if "runasroot=true" in details:
                    violated_policies.append("POL-K8S-002")

            # Generate findings for matched active policies
            for pol_id in violated_policies:
                pol = self.policies.get(pol_id)
                if pol and pol.get("enabled", True):
                    is_non_compliant = True
                    findings.append({
                        "id": str(uuid.uuid4()),
                        "policy_id": pol_id,
                        "account_id": account_id,
                        "account_name": account_name or f"{provider} Account ({account_id})",
                        "asset_name": a_copy.get("name", "Unknown Asset"),
                        "resource_id": a_copy.get("resource_id", "arn:unknown"),
                        "title": f"{pol.get('name', pol.get('title'))} - {a_copy.get('name')}",
                        "severity": pol.get("severity", "HIGH"),
                        "status": "OPEN",
                        "compliance_framework": pol.get("framework", "CIS"),
                        "remediation_playbook": pol.get("remediation_steps", ""),
                    })

            if is_non_compliant:
                a_copy["compliance_status"] = "NON_COMPLIANT"
                a_copy["risk_score"] = max(a_copy.get("risk_score", 0.0), 8.0)
            else:
                a_copy["compliance_status"] = "COMPLIANT"
                a_copy["risk_score"] = min(a_copy.get("risk_score", 1.0), 1.5)

            evaluated_assets.append(a_copy)

        return evaluated_assets, findings
