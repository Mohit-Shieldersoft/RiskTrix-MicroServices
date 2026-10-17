"""Seed telemetry only for DEMO-* cloud accounts. Never write to real accounts."""
import json
import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.models import CloudAccount, CloudAsset, CSPMFinding

DEMO_ACCOUNTS = [
    {
        "account_id": "DEMO-AWS",
        "name": "Demo AWS Production",
        "provider": "AWS",
        "region": "us-east-1",
    },
    {
        "account_id": "DEMO-AZURE",
        "name": "Demo Azure Subscription",
        "provider": "AZURE",
        "region": "eastus2",
    },
    {
        "account_id": "DEMO-GCP",
        "name": "Demo GCP Project",
        "provider": "GCP",
        "region": "us-central1",
    },
]

DEMO_ASSETS = [
    {
        "id": "demo-asset-ec2",
        "account_id": "DEMO-AWS",
        "name": "demo-web-gateway",
        "asset_type": "COMPUTE",
        "provider": "AWS",
        "region": "us-east-1",
        "resource_id": "i-demo0a891f4c28e9",
        "risk_score": 9.2,
        "compliance_status": "NON_COMPLIANT",
        "details": json.dumps({"public": True, "sg": "sg-demo0a8bf", "ingress": "0.0.0.0/0:22,80", "public_ip": "203.0.113.12"}),
    },
    {
        "id": "demo-asset-sg",
        "account_id": "DEMO-AWS",
        "name": "demo-web-sg",
        "asset_type": "NETWORK",
        "provider": "AWS",
        "region": "us-east-1",
        "resource_id": "sg-demo0a8bf",
        "risk_score": 8.8,
        "compliance_status": "NON_COMPLIANT",
        "details": "Security group open to 0.0.0.0/0 on ports 22 and 80. public=true",
    },
    {
        "id": "demo-asset-iam",
        "account_id": "DEMO-AWS",
        "name": "DemoS3FullAdminAccess",
        "asset_type": "IAM",
        "provider": "AWS",
        "region": "us-east-1",
        "resource_id": "arn:aws:iam::DEMO-AWS:role/DemoS3FullAdminAccess",
        "risk_score": 8.5,
        "compliance_status": "NON_COMPLIANT",
        "details": "Over-privileged s3:* on production buckets",
    },
    {
        "id": "demo-asset-s3",
        "account_id": "DEMO-AWS",
        "name": "demo-prod-customer-pii",
        "asset_type": "STORAGE",
        "provider": "AWS",
        "region": "us-east-1",
        "resource_id": "s3://demo-prod-customer-pii",
        "risk_score": 9.0,
        "compliance_status": "NON_COMPLIANT",
        "details": "Public ACL enabled. password=demo-not-real-secret-value AKIADEMOEXAMPLEKEY",
    },
    {
        "id": "demo-asset-aks",
        "account_id": "DEMO-AZURE",
        "name": "demo-aks-auth-pod",
        "asset_type": "KUBERNETES",
        "provider": "AZURE",
        "region": "eastus2",
        "resource_id": "aks-pod-demo-auth",
        "risk_score": 8.4,
        "compliance_status": "NON_COMPLIANT",
        "details": "Privileged pod running as root with public ingress. 0.0.0.0/0",
    },
    {
        "id": "demo-asset-gcs",
        "account_id": "DEMO-GCP",
        "name": "demo-analytics-raw",
        "asset_type": "STORAGE",
        "provider": "GCP",
        "region": "us-central1",
        "resource_id": "gs://demo-analytics-raw",
        "risk_score": 7.6,
        "compliance_status": "NON_COMPLIANT",
        "details": "public bucket missing uniform access",
    },
]

DEMO_FINDINGS = [
    {
        "id": "demo-finding-sg",
        "policy_id": "POL-AWS-001",
        "account_id": "DEMO-AWS",
        "account_name": "Demo AWS Production",
        "asset_name": "demo-web-sg",
        "resource_id": "sg-demo0a8bf",
        "title": "Security group open to the internet on SSH and HTTP",
        "severity": "CRITICAL",
        "status": "OPEN",
        "compliance_framework": "CIS_v1.4",
        "remediation_playbook": "Restrict ingress to a bastion or VPN CIDR. Guided only — cloudMutated=false.",
    },
    {
        "id": "demo-finding-s3",
        "policy_id": "POL-AWS-014",
        "account_id": "DEMO-AWS",
        "account_name": "Demo AWS Production",
        "asset_name": "demo-prod-customer-pii",
        "resource_id": "s3://demo-prod-customer-pii",
        "title": "S3 bucket allows public read",
        "severity": "CRITICAL",
        "status": "OPEN",
        "compliance_framework": "CIS_v1.4",
        "remediation_playbook": "Enable Block Public Access. Guided only.",
    },
    {
        "id": "demo-finding-aks",
        "policy_id": "POL-AZ-009",
        "account_id": "DEMO-AZURE",
        "account_name": "Demo Azure Subscription",
        "asset_name": "demo-aks-auth-pod",
        "resource_id": "aks-pod-demo-auth",
        "title": "Privileged AKS pod with public ingress",
        "severity": "HIGH",
        "status": "OPEN",
        "compliance_framework": "CIS_AKS",
        "remediation_playbook": "Drop privileged flag and lock ingress.",
    },
    {
        "id": "demo-finding-gcs",
        "policy_id": "POL-GCP-004",
        "account_id": "DEMO-GCP",
        "account_name": "Demo GCP Project",
        "asset_name": "demo-analytics-raw",
        "resource_id": "gs://demo-analytics-raw",
        "title": "GCS bucket missing uniform bucket-level access",
        "severity": "HIGH",
        "status": "OPEN",
        "compliance_framework": "CIS_GCP",
        "remediation_playbook": "Enable uniform bucket-level access.",
    },
]


async def provision_demo_workspace(db: AsyncSession) -> dict:
    now = datetime.utcnow()
    created = {"accounts": 0, "assets": 0, "findings": 0}

    for item in DEMO_ACCOUNTS:
        existing = (await db.execute(select(CloudAccount).where(CloudAccount.account_id == item["account_id"]))).scalar_one_or_none()
        if existing:
            existing.name = item["name"]
            existing.status = "ACTIVE"
            existing.last_synced = now
            continue
        db.add(CloudAccount(
            id=str(uuid.uuid4()),
            name=item["name"],
            provider=item["provider"],
            account_id=item["account_id"],
            status="ACTIVE",
            region=item["region"],
            credentials={"mode": "demo", "mutable": False},
            assets_count=0,
            findings_count=0,
            last_synced=now,
        ))
        created["accounts"] += 1

    for item in DEMO_ASSETS:
        existing = (await db.execute(select(CloudAsset).where(CloudAsset.id == item["id"]))).scalar_one_or_none()
        if existing:
            continue
        db.add(CloudAsset(**item))
        created["assets"] += 1

    for item in DEMO_FINDINGS:
        existing = (await db.execute(select(CSPMFinding).where(CSPMFinding.id == item["id"]))).scalar_one_or_none()
        if existing:
            continue
        db.add(CSPMFinding(**item))
        created["findings"] += 1

    accounts = (await db.execute(select(CloudAccount).where(CloudAccount.account_id.like("DEMO-%")))).scalars().all()
    for account in accounts:
        account.assets_count = len([a for a in DEMO_ASSETS if a["account_id"] == account.account_id])
        account.findings_count = len([f for f in DEMO_FINDINGS if f["account_id"] == account.account_id])

    await db.commit()
    created["mode"] = "demo"
    created["note"] = "Sample telemetry is scoped to DEMO-* accounts only."
    return created
