"""Seed data for Unified Alert Inbox, Webhook Channels & SLA Policies."""

DEFAULT_ALERTS = []
DEFAULT_WEBHOOKS = []

DEFAULT_SLA_POLICIES = [
    {
        "policy_id": "sla-crit-001",
        "name": "Critical Severity SLA",
        "severity": "CRITICAL",
        "max_remediation_hours": 4,
        "notify_before_hours": 1,
    },
    {
        "policy_id": "sla-high-002",
        "name": "High Severity SLA",
        "severity": "HIGH",
        "max_remediation_hours": 24,
        "notify_before_hours": 4,
    },
    {
        "policy_id": "sla-med-003",
        "name": "Medium Severity SLA",
        "severity": "MEDIUM",
        "max_remediation_hours": 72,
        "notify_before_hours": 12,
    },
    {
        "policy_id": "sla-low-004",
        "name": "Low Severity SLA",
        "severity": "LOW",
        "max_remediation_hours": 168,
        "notify_before_hours": 24,
    },
]
