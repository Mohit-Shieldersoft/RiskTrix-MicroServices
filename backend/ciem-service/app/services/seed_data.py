from datetime import datetime, timedelta

DEFAULT_IDENTITIES = []
DEFAULT_ENTITLEMENTS = []

DEFAULT_ENTITLEMENTS = [
    {
        "id": "ent-001",
        "identity_id": "arn:aws:iam::123456789012:user/devops-jdoe",
        "policy_name": "AdministratorAccess",
        "action": "*:*",
        "resource": "*",
        "is_used": False,
        "last_used_at": None,
        "is_high_risk": True,
    },
    {
        "id": "ent-002",
        "identity_id": "arn:aws:iam::123456789012:user/devops-jdoe",
        "policy_name": "IAMFullAccess",
        "action": "iam:PassRole",
        "resource": "*",
        "is_used": True,
        "last_used_at": datetime.utcnow() - timedelta(days=5),
        "is_high_risk": True,
    },
    {
        "id": "ent-003",
        "identity_id": "arn:aws:iam::123456789012:user/legacy-contractor",
        "policy_name": "PowerUserAccess",
        "action": "s3:*",
        "resource": "arn:aws:s3:::*",
        "is_used": False,
        "last_used_at": datetime.utcnow() - timedelta(days=120),
        "is_high_risk": True,
    },
    {
        "id": "ent-004",
        "identity_id": "azure:sub-9876/role/AzureGlobalAdmin",
        "policy_name": "GlobalAdministratorPolicy",
        "action": "Microsoft.Authorization/*",
        "resource": "*",
        "is_used": False,
        "last_used_at": None,
        "is_high_risk": True,
    },
]
