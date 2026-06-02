from sqlalchemy.orm import Session
from app.models.policy import Policy

# ── Built-in templates ────────────────────────────────────
TEMPLATES = [
    {
        "id": "hipaa-baseline",
        "name": "HIPAA Baseline",
        "description": "Minimum security controls required for HIPAA-covered devices. Enforces encryption, screen lock, strong passwords, and OS updates.",
        "category": "device_security",
        "platform": "all",
        "tags": ["compliance", "healthcare", "hipaa"],
        "settings": {
            "require_screen_lock": True,
            "min_password_length": 8,
            "password_complexity": True,
            "password_expiry_days": 90,
            "bluetooth_disabled": False,
            "usb_disabled": True,
            "wifi_restricted": False,
            "os_update_required": True,
            "min_os_version": "",
            "encryption_required": True,
        },
    },
    {
        "id": "byod-android",
        "name": "BYOD Android",
        "description": "Bring-Your-Own-Device policy for Android. Balances user privacy with corporate security requirements.",
        "category": "device_security",
        "platform": "android",
        "tags": ["byod", "android", "mobile"],
        "settings": {
            "require_screen_lock": True,
            "min_password_length": 6,
            "password_complexity": False,
            "password_expiry_days": 180,
            "bluetooth_disabled": False,
            "usb_disabled": False,
            "wifi_restricted": False,
            "os_update_required": True,
            "min_os_version": "10",
            "encryption_required": True,
        },
    },
    {
        "id": "windows-corporate",
        "name": "Windows Corporate",
        "description": "Standard corporate policy for managed Windows devices. Disables USB, enforces BitLocker, and requires Windows Update.",
        "category": "device_security",
        "platform": "windows",
        "tags": ["corporate", "windows", "endpoint"],
        "settings": {
            "require_screen_lock": True,
            "min_password_length": 12,
            "password_complexity": True,
            "password_expiry_days": 60,
            "bluetooth_disabled": True,
            "usb_disabled": True,
            "wifi_restricted": False,
            "os_update_required": True,
            "min_os_version": "10.0.19041",
            "encryption_required": True,
        },
    },
    {
        "id": "ios-strict",
        "name": "iOS Strict",
        "description": "High-security policy for corporate iOS devices. Restricts connectivity and enforces strong authentication.",
        "category": "device_security",
        "platform": "ios",
        "tags": ["ios", "strict", "corporate"],
        "settings": {
            "require_screen_lock": True,
            "min_password_length": 8,
            "password_complexity": True,
            "password_expiry_days": 60,
            "bluetooth_disabled": True,
            "usb_disabled": True,
            "wifi_restricted": True,
            "os_update_required": True,
            "min_os_version": "16.0",
            "encryption_required": True,
        },
    },
    {
        "id": "network-lockdown",
        "name": "Network Lockdown",
        "description": "Restricts all wireless connectivity. Suitable for high-security environments where network access must be controlled.",
        "category": "network",
        "platform": "all",
        "tags": ["network", "high-security", "lockdown"],
        "settings": {
            "require_screen_lock": True,
            "min_password_length": 0,
            "password_complexity": False,
            "password_expiry_days": 0,
            "bluetooth_disabled": True,
            "usb_disabled": True,
            "wifi_restricted": True,
            "os_update_required": False,
            "min_os_version": "",
            "encryption_required": True,
        },
    },
    {
        "id": "open-byod",
        "name": "Open BYOD",
        "description": "Minimal policy for personal devices. Only enforces screen lock and encryption. Suitable for low-risk environments.",
        "category": "device_security",
        "platform": "all",
        "tags": ["byod", "minimal", "personal"],
        "settings": {
            "require_screen_lock": True,
            "min_password_length": 4,
            "password_complexity": False,
            "password_expiry_days": 0,
            "bluetooth_disabled": False,
            "usb_disabled": False,
            "wifi_restricted": False,
            "os_update_required": False,
            "min_os_version": "",
            "encryption_required": True,
        },
    },
]

TEMPLATE_MAP = {t["id"]: t for t in TEMPLATES}


def get_all_templates() -> list[dict]:
    return TEMPLATES


def get_template_by_id(template_id: str) -> dict | None:
    return TEMPLATE_MAP.get(template_id)


def apply_template(db: Session, template_id: str, name_override: str | None = None) -> Policy | None:
    """Create a new Policy from a template. Returns the saved Policy."""
    template = TEMPLATE_MAP.get(template_id)
    if not template:
        return None

    policy_name = name_override or template["name"]
    settings = template["settings"]

    policy = Policy(
        name=policy_name,
        description=template["description"],
        category=template["category"],
        platform=template["platform"],
        status="active",
        **settings,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy
