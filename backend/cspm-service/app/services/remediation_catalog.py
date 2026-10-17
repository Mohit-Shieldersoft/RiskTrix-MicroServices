"""Guided remediation snippets ported from CNAPP (no cloud mutation)."""

REMEDIATION_BY_POLICY = {
    "POL-AWS-001": {
        "cli": "aws s3api put-public-access-block --bucket <bucket> --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true",
        "terraform": 'resource "aws_s3_bucket_public_access_block" "this" {\n  bucket = aws_s3_bucket.this.id\n  block_public_acls       = true\n  block_public_policy     = true\n  ignore_public_acls      = true\n  restrict_public_buckets = true\n}',
        "cloudformation": "PublicAccessBlockConfiguration:\n  BlockPublicAcls: true\n  IgnorePublicAcls: true\n  BlockPublicPolicy: true\n  RestrictPublicBuckets: true",
        "console": "1. Open S3 console\n2. Select the bucket\n3. Permissions → Block public access → Edit → Enable all four settings",
    },
    "POL-AWS-002": {
        "cli": "aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol tcp --port 22 --cidr 0.0.0.0/0",
        "terraform": 'resource "aws_security_group_rule" "ssh" {\n  type        = "ingress"\n  from_port   = 22\n  to_port     = 22\n  protocol    = "tcp"\n  cidr_blocks = ["10.0.0.0/8"]\n}',
        "cloudformation": "Remove 0.0.0.0/0 from SecurityGroupIngress port 22.",
        "console": "1. VPC → Security Groups\n2. Inbound rules → Edit\n3. Remove SSH from 0.0.0.0/0",
    },
    "POL-AWS-003": {
        "cli": "aws iam enable-mfa-device --user-name root --serial-number <mfa-arn> --authentication-code1 <c1> --authentication-code2 <c2>",
        "terraform": "# Root MFA cannot be fully automated. Enforce via AWS Organizations SCP denying actions without MFA.",
        "cloudformation": "Use an SCP: Deny * unless aws:MultiFactorAuthPresent is true for root.",
        "console": "1. Sign in as root\n2. Security credentials\n3. Assign MFA device",
    },
    "POL-AZURE-001": {
        "cli": "az storage account update --name <account> --https-only true",
        "terraform": 'resource "azurerm_storage_account" "this" {\n  enable_https_traffic_only = true\n}',
        "arm": '{"properties":{"supportsHttpsTrafficOnly":true}}',
        "console": "Storage account → Configuration → Secure transfer required = Enabled",
    },
    "POL-GCP-001": {
        "cli": "gcloud sql instances patch <instance> --no-assign-ip --network=<vpc>",
        "terraform": 'resource "google_sql_database_instance" "this" {\n  settings {\n    ip_configuration {\n      ipv4_enabled = false\n    }\n  }\n}',
        "gcp": "Disable public IPv4 and enable Private Service Access.",
        "console": "Cloud SQL → Connections → Disable Public IP",
    },
}


def get_remediation(policy_id: str, playbook: str = None) -> dict:
    catalog = REMEDIATION_BY_POLICY.get(policy_id) or {
        "cli": playbook or "# Follow provider console hardening steps",
        "terraform": "# Update the resource definition to enforce the security baseline",
        "console": "1. Open the cloud console\n2. Locate the resource\n3. Apply the recommended control",
    }
    return {
        "policy_id": policy_id,
        "cloudMutated": False,
        **catalog,
    }
