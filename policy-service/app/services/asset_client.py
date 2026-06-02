"""
asset_client.py

Thin synchronous HTTP client for fetching device data from Asset Service.
Policy Service reads device metadata (name, owner, platform, etc.) from here
rather than duplicating it in its own DB.
"""
import httpx
from typing import Optional

ASSET_SERVICE_URL = "http://localhost:8003/api/v1"
_TIMEOUT = 5.0  # seconds


def get_device(device_id: int) -> Optional[dict]:
    """Fetch a single device from Asset Service by ID. Returns dict or None."""
    try:
        r = httpx.get(f"{ASSET_SERVICE_URL}/devices/{device_id}", timeout=_TIMEOUT)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return None


def get_all_devices() -> list[dict]:
    """Fetch all devices from Asset Service."""
    try:
        r = httpx.get(f"{ASSET_SERVICE_URL}/devices", timeout=_TIMEOUT)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return []
