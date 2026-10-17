from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Body, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

import re
import uuid

from app.db.session import get_db
from app.models.models import CloudAccount, CloudAsset, SecretRevocation
from app.services.demo_scope import is_demo_request, in_scope

router = APIRouter()

_UNUSED_DEFAULT_SECRETS = [
    {
        "secret_id": "sec-aws-001",
        "title": "Exposed AWS Production Access Key in S3 Object",
        "category": "AWS Access Key",
        "pattern_type": "Regex (AKIA[0-9A-Z]{16})",
        "entropy_score": 8.1,
        "severity": "CRITICAL",
        "file_path": "s3://risktrix-prod-backups/config/aws_credentials.json:L14",
        "masked_value": "AKIAIOSFODNN7*******",
        "full_value": "AKIAIOSFODNN7EXAMPLEKEY123",
        "provider": "AWS",
        "status": "EXPOSED",
        "detected_at": "10 minutes ago",
        "remediation_guide": "Rotate AWS Access Key in IAM Console and purge config/aws_credentials.json from S3 bucket."
    },
    {
        "secret_id": "sec-rsa-002",
        "title": "Hardcoded RSA Private Key in Public Git/Container",
        "category": "RSA Private Key",
        "pattern_type": "PEM Header (-----BEGIN RSA PRIVATE KEY-----)",
        "entropy_score": 9.4,
        "severity": "CRITICAL",
        "file_path": "container://frontend-api:v2.1.0/etc/ssl/private/id_rsa:L1",
        "masked_value": "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...",
        "full_value": "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0x92Jz... [RSA 2048 KEY CONTENT]",
        "provider": "K8S",
        "status": "EXPOSED",
        "detected_at": "1 hour ago",
        "remediation_guide": "Store private keys in AWS Secrets Manager or HashiCorp Vault instead of image filesystems."
    },
    {
        "secret_id": "iac-tf-003",
        "title": "Terraform Unencrypted S3 Bucket Configuration",
        "category": "IaC Misconfiguration",
        "pattern_type": "Terraform Parser (aws_s3_bucket.server_side_encryption_configuration)",
        "entropy_score": 5.2,
        "severity": "HIGH",
        "file_path": "terraform/main.tf:L88",
        "masked_value": 'resource "aws_s3_bucket" "prod" { server_side_encryption = null }',
        "full_value": 'resource "aws_s3_bucket" "prod" {\n  bucket = "risktrix-data"\n  server_side_encryption = null\n}',
        "provider": "TERRAFORM",
        "status": "VIOLATION",
        "detected_at": "3 hours ago",
        "remediation_guide": "Add aws_s3_bucket_server_side_encryption_configuration block with SSE-KMS."
    },
    {
        "secret_id": "sec-slack-004",
        "title": "Exposed Slack Incoming Webhook Token",
        "category": "Webhook Token",
        "pattern_type": "Regex (https://hooks.slack.com/services/T...)",
        "entropy_score": 7.6,
        "severity": "MEDIUM",
        "file_path": "s3://risktrix-logs/app.log:L1042",
        "masked_value": "https://hooks.slack.com/services/T0000/B0000/XXXX...",
        "full_value": "https://hooks.slack.com/services/T0000/B0000/XXXXXXXXXXXXXX",
        "provider": "AWS",
        "status": "EXPOSED",
        "detected_at": "Yesterday",
        "remediation_guide": "Revoke webhook URL in Slack App management portal."
    }
]

@router.get("/secrets")
async def get_secrets_and_iac(request: Request, db: AsyncSession = Depends(get_db)):
    """List secrets discovered from live/demo-scoped cloud asset metadata."""
    demo = is_demo_request(request)
    assets = [row for row in (await db.execute(select(CloudAsset))).scalars().all() if in_scope(row.account_id, demo)]
    hits = []
    for asset in assets:
        hits.extend(_scan_text(str(asset.details or ""), asset.resource_id or asset.name or asset.id))
    revoked = {
        row.secret_id: row
        for row in (await db.execute(select(SecretRevocation))).scalars().all()
    }
    for hit in hits:
        action = revoked.get(hit["secret_id"])
        if action:
            hit["status"] = "GUIDED_REVOKE"
            hit["cloudMutated"] = False
    return hits

SECRET_PATTERNS = [
    ("AWS Access Key", r"AKIA[0-9A-Z]{16}", "CRITICAL"),
    ("RSA Private Key", r"-----BEGIN (RSA |OPENSSH )?PRIVATE KEY-----", "CRITICAL"),
    ("Slack Webhook", r"https://hooks\.slack\.com/services/[A-Za-z0-9/_-]+", "MEDIUM"),
    ("Generic Secret", r"(?i)(password|secret|api[_-]?key)\s*[:=]\s*['\"][^'\"]{8,}", "HIGH"),
]


def _scan_text(content: str, source: str) -> list:
    hits = []
    for category, pattern, severity in SECRET_PATTERNS:
        for match in re.finditer(pattern, content):
            value = match.group(0)
            hits.append({
                "secret_id": f"sec-{uuid.uuid5(uuid.NAMESPACE_URL, f'{source}:{category}:{value}').hex[:16]}",
                "title": f"{category} in {source}",
                "category": category,
                "pattern_type": pattern,
                "entropy_score": min(9.9, 4 + len(value) / 8),
                "severity": severity,
                "file_path": source,
                "masked_value": value[:6] + "****",
                "provider": "IAC",
                "status": "EXPOSED",
                "detected_at": datetime.utcnow().isoformat(),
                "remediation_guide": "Rotate the credential and store it in a secrets manager.",
            })
    if "aws_s3_bucket" in content and "server_side_encryption" not in content:
        hits.append({
            "secret_id": f"iac-{uuid.uuid5(uuid.NAMESPACE_URL, f'{source}:s3-encryption').hex[:16]}",
            "title": "Terraform S3 bucket missing encryption",
            "category": "IaC Misconfiguration",
            "pattern_type": "Terraform parser",
            "entropy_score": 5.0,
            "severity": "HIGH",
            "file_path": source,
            "masked_value": "aws_s3_bucket without encryption",
            "provider": "TERRAFORM",
            "status": "VIOLATION",
            "detected_at": datetime.utcnow().isoformat(),
            "remediation_guide": "Add aws_s3_bucket_server_side_encryption_configuration.",
        })
    return hits


@router.post("/secrets/scan")
@router.post("/iac-secrets/scan")
async def trigger_secrets_scan(payload: Optional[dict] = Body(None)):
    """Scan pasted IaC or return catalog scan results."""
    content = (payload or {}).get("content") or (payload or {}).get("source") or ""
    if content:
        hits = _scan_text(content, (payload or {}).get("filename") or "pasted.tf")
        return {"status": "COMPLETED", "secrets_found": len(hits), "findings": hits, "timestamp": datetime.utcnow().isoformat()}
    return {
        "status": "COMPLETED",
        "files_scanned": 0,
        "secrets_found": 0,
        "findings": [],
        "message": "Paste IaC content in 'content' to scan, or use /secrets/cloud-scan.",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/iac-secrets/cloud-scan")
@router.post("/secrets/cloud-scan")
async def cloud_scan_secrets(db: AsyncSession = Depends(get_db)):
    assets = (await db.execute(select(CloudAsset))).scalars().all()
    hits = []
    for asset in assets:
        hits.extend(_scan_text(str(asset.details or ""), asset.resource_id))
    return {"status": "COMPLETED", "secrets_found": len(hits), "findings": hits}

@router.post("/secrets/{secret_id}/revoke")
async def revoke_secret(secret_id: str, db: AsyncSession = Depends(get_db)):
    """Record a guided revoke. Does not mutate cloud IAM or rotate live keys."""
    existing = (await db.execute(select(SecretRevocation).where(SecretRevocation.secret_id == secret_id))).scalar_one_or_none()
    if not existing:
        existing = SecretRevocation(
            secret_id=secret_id,
            status="GUIDED_REVOKE",
            cloud_mutated=False,
            message="Guided revoke recorded. Rotate the credential in the cloud console; no API mutation was performed.",
        )
        db.add(existing)
        await db.commit()
    return {
        "status": "GUIDED",
        "secret_id": secret_id,
        "cloudMutated": False,
        "message": existing.message,
        "timestamp": datetime.utcnow().isoformat(),
    }
