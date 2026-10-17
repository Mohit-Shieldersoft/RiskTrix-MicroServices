"""
AWS Multi-Cloud SDK Collector for RiskTrix CSPM Service
Scans S3, EC2, Security Groups, and IAM for misconfigurations and security compliance violations.
"""
import os
import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any, Tuple

logger = logging.getLogger("cspm.aws_collector")

try:
    import boto3
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False


class AWSCollector:
    """Collector for AWS cloud infrastructure security scanning."""

    def __init__(self, account_id: str, region: str = "us-east-1", credentials: Dict[str, str] = None):
        self.account_id = account_id
        self.region = region or "us-east-1"
        self.credentials = credentials or {}
        self.access_key = self.credentials.get("access_key") or os.getenv("AWS_ACCESS_KEY_ID")
        self.secret_key = self.credentials.get("secret_key") or os.getenv("AWS_SECRET_ACCESS_KEY")
        self.session_token = self.credentials.get("session_token") or os.getenv("AWS_SESSION_TOKEN")

    def is_live_configured(self) -> bool:
        """Check if live AWS API credentials are configured."""
        return HAS_BOTO3 and bool(self.access_key and self.secret_key)

    def scan(self) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Execute AWS cloud infrastructure security scan.
        Returns (assets, findings) tuple.
        """
        if self.is_live_configured():
            try:
                logger.info(f"Executing LIVE AWS SDK scan for account {self.account_id} in {self.region}...")
                return self._scan_live_aws()
            except Exception as e:
                logger.warning(f"Live AWS scan error: {e}. Returning empty results (no synthetic telemetry).")
                return [], []
        else:
            logger.info(f"No AWS credentials for account {self.account_id}. Connect credentials to scan.")
            return [], []

    def _scan_live_aws(self) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        session = boto3.Session(
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            aws_session_token=self.session_token,
            region_name=self.region,
        )
        assets = []
        findings = []

        # 1. Scan S3 Buckets
        try:
            s3 = session.client("s3")
            buckets = s3.list_buckets().get("Buckets", [])
            for bucket in buckets:
                b_name = bucket["Name"]
                res_arn = f"arn:aws:s3:::{b_name}"
                
                # Check Public Access Block
                is_public = False
                try:
                    pab = s3.get_public_access_block(Bucket=b_name)
                    config = pab.get("PublicAccessBlockConfiguration", {})
                    if not (config.get("BlockPublicAcls") and config.get("RestrictPublicBuckets")):
                        is_public = True
                except Exception:
                    is_public = True

                comp_status = "NON_COMPLIANT" if is_public else "COMPLIANT"
                risk_score = 8.5 if is_public else 1.0

                assets.append({
                    "id": str(uuid.uuid4()),
                    "account_id": self.account_id,
                    "name": b_name,
                    "asset_type": "STORAGE",
                    "provider": "AWS",
                    "region": self.region,
                    "resource_id": res_arn,
                    "risk_score": risk_score,
                    "compliance_status": comp_status,
                    "details": f"AWS S3 Bucket: {b_name} | PublicAccessBlocked={not is_public}",
                })

                if is_public:
                    findings.append({
                        "id": str(uuid.uuid4()),
                        "policy_id": "POL-AWS-001",
                        "account_id": self.account_id,
                        "account_name": f"AWS Account ({self.account_id})",
                        "asset_name": b_name,
                        "resource_id": res_arn,
                        "title": f"S3 Bucket {b_name} permits public read access",
                        "severity": "CRITICAL",
                        "status": "OPEN",
                        "compliance_framework": "CIS_AWS_v1.4",
                        "remediation_playbook": "Enable S3 Block Public Access setting: aws s3api put-public-access-block --bucket " + b_name + " --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true",
                    })
        except Exception as e:
            logger.error(f"Error scanning S3 buckets: {e}")

        # 2. Scan EC2 Security Groups & Instances
        try:
            ec2 = session.client("ec2")
            sgs = ec2.describe_security_groups().get("SecurityGroups", [])
            for sg in sgs:
                sg_id = sg["GroupId"]
                sg_name = sg.get("GroupName", sg_id)
                res_arn = f"arn:aws:ec2:{self.region}:{self.account_id}:security-group/{sg_id}"

                has_open_ssh = False
                for rule in sg.get("IpPermissions", []):
                    from_port = rule.get("FromPort")
                    to_port = rule.get("ToPort")
                    if from_port and to_port and from_port <= 22 <= to_port:
                        for ip_range in rule.get("IpRanges", []):
                            if ip_range.get("CidrIp") == "0.0.0.0/0":
                                has_open_ssh = True
                                break

                comp_status = "NON_COMPLIANT" if has_open_ssh else "COMPLIANT"
                risk_score = 7.5 if has_open_ssh else 1.0

                assets.append({
                    "id": str(uuid.uuid4()),
                    "account_id": self.account_id,
                    "name": sg_name,
                    "asset_type": "NETWORK",
                    "provider": "AWS",
                    "region": self.region,
                    "resource_id": res_arn,
                    "risk_score": risk_score,
                    "compliance_status": comp_status,
                    "details": f"AWS Security Group: {sg_id} ({sg_name}) | OpenSSH={has_open_ssh}",
                })

                if has_open_ssh:
                    findings.append({
                        "id": str(uuid.uuid4()),
                        "policy_id": "POL-AWS-002",
                        "account_id": self.account_id,
                        "account_name": f"AWS Account ({self.account_id})",
                        "asset_name": sg_name,
                        "resource_id": res_arn,
                        "title": f"Security Group {sg_id} allows unrestricted SSH (port 22) ingress",
                        "severity": "HIGH",
                        "status": "OPEN",
                        "compliance_framework": "CIS_AWS_v1.4",
                        "remediation_playbook": "Remove 0.0.0.0/0 ingress rule on port 22 in VPC console and restrict to corporate CIDR ranges.",
                    })
        except Exception as e:
            logger.warning(f"Skipping EC2 Security Group scan (permission missing or error): {e}")

        # 3. Scan EC2 Instances
        try:
            ec2 = session.client("ec2")
            reservations = ec2.describe_instances().get("Reservations", [])
            for res in reservations:
                for inst in res.get("Instances", []):
                    inst_id = inst["InstanceId"]
                    res_arn = f"arn:aws:ec2:{self.region}:{self.account_id}:instance/{inst_id}"
                    pub_ip = inst.get("PublicIpAddress")
                    
                    is_public = bool(pub_ip)
                    comp_status = "COMPLIANT"
                    risk_score = 3.0 if is_public else 1.0

                    assets.append({
                        "id": str(uuid.uuid4()),
                        "account_id": self.account_id,
                        "name": f"ec2-{inst_id}",
                        "asset_type": "COMPUTE",
                        "provider": "AWS",
                        "region": self.region,
                        "resource_id": res_arn,
                        "risk_score": risk_score,
                        "compliance_status": comp_status,
                        "details": f"AWS EC2 Instance: {inst_id} | State={inst.get('State', {}).get('Name')} | PublicIP={pub_ip or 'None'}",
                    })
        except Exception as e:
            logger.warning(f"Skipping EC2 Instance scan (permission missing or error): {e}")

        # 4. Scan IAM Users
        try:
            iam = session.client("iam")
            users = iam.list_users().get("Users", [])
            for u in users:
                u_name = u["UserName"]
                res_arn = u["Arn"]
                assets.append({
                    "id": str(uuid.uuid4()),
                    "account_id": self.account_id,
                    "name": u_name,
                    "asset_type": "IAM",
                    "provider": "AWS",
                    "region": "global",
                    "resource_id": res_arn,
                    "risk_score": 2.0,
                    "compliance_status": "COMPLIANT",
                    "details": f"AWS IAM User: {u_name} | Created={u.get('CreateDate')}",
                })
        except Exception as e:
            logger.warning(f"Skipping IAM Users scan (permission missing or error): {e}")

        return assets, findings

    def _scan_fallback_aws(self) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Removed: empty tenants stay empty. Demo data comes from DEMO-* provision only."""
        return [], []

    def _unused_scan_fallback_aws(self) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Kept only so historical comments remain searchable; not called."""
        bucket_name = f"prod-customer-pii-backups-{self.account_id[:4]}"
        sg_id = f"sg-08f3a9a{self.account_id[:4]}21"
        res_s3_arn = f"arn:aws:s3:::{bucket_name}"
        res_sg_arn = f"arn:aws:ec2:{self.region}:{self.account_id}:security-group/{sg_id}"

        assets = [
            {
                "id": str(uuid.uuid4()),
                "account_id": self.account_id,
                "name": bucket_name,
                "asset_type": "STORAGE",
                "provider": "AWS",
                "region": self.region,
                "resource_id": res_s3_arn,
                "risk_score": 8.5,
                "compliance_status": "NON_COMPLIANT",
                "details": "AWS S3 Storage Bucket | Unencrypted PII Archives | PublicAccessBlock: Disabled",
            },
            {
                "id": str(uuid.uuid4()),
                "account_id": self.account_id,
                "name": "production-api-bastion-sg",
                "asset_type": "NETWORK",
                "provider": "AWS",
                "region": self.region,
                "resource_id": res_sg_arn,
                "risk_score": 7.5,
                "compliance_status": "NON_COMPLIANT",
                "details": "AWS EC2 Security Group | Unrestricted SSH (0.0.0.0/0) Ingress Rule Detected",
            },
            {
                "id": str(uuid.uuid4()),
                "account_id": self.account_id,
                "name": "aws-root-account-identity",
                "asset_type": "IAM",
                "provider": "AWS",
                "region": "global",
                "resource_id": f"arn:aws:iam::{self.account_id}:root",
                "risk_score": 9.0,
                "compliance_status": "NON_COMPLIANT",
                "details": "AWS IAM Root User Account | Hardware/Virtual MFA Protection: Disabled",
            },
        ]

        findings = [
            {
                "id": str(uuid.uuid4()),
                "policy_id": "POL-AWS-001",
                "account_id": self.account_id,
                "account_name": f"AWS Account ({self.account_id})",
                "asset_name": bucket_name,
                "resource_id": res_s3_arn,
                "title": f"S3 Bucket {bucket_name} permits public read access",
                "severity": "CRITICAL",
                "status": "OPEN",
                "compliance_framework": "CIS_AWS_v1.4",
                "remediation_playbook": "Enable S3 Block Public Access setting: aws s3api put-public-access-block --bucket " + bucket_name + " --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true",
            },
            {
                "id": str(uuid.uuid4()),
                "policy_id": "POL-AWS-002",
                "account_id": self.account_id,
                "account_name": f"AWS Account ({self.account_id})",
                "asset_name": "production-api-bastion-sg",
                "resource_id": res_sg_arn,
                "title": f"Security Group {sg_id} allows unrestricted SSH (port 22) ingress",
                "severity": "HIGH",
                "status": "OPEN",
                "compliance_framework": "CIS_AWS_v1.4",
                "remediation_playbook": "Modify Security Group rules in VPC console to remove 0.0.0.0/0 ingress on port 22 and restrict to bastion/corporate VPN CIDRs.",
            },
            {
                "id": str(uuid.uuid4()),
                "policy_id": "POL-AWS-003",
                "account_id": self.account_id,
                "account_name": f"AWS Account ({self.account_id})",
                "asset_name": "aws-root-account-identity",
                "resource_id": f"arn:aws:iam::{self.account_id}:root",
                "title": "IAM Root Account MFA must be enabled",
                "severity": "CRITICAL",
                "status": "OPEN",
                "compliance_framework": "NIST_SP800_53",
                "remediation_playbook": "Log into AWS Root account and enable hardware/virtual MFA device in IAM Security Credentials dashboard.",
            },
        ]

        return assets, findings
