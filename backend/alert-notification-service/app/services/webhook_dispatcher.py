import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import urllib.request
import urllib.parse

logger = logging.getLogger("webhook-dispatcher")

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False


async def dispatch_webhook_notification(
    channel_type: str,
    target_url: str,
    alert_payload: Dict[str, Any],
) -> Dict[str, Any]:
    """Dispatch alert payload to Slack, MS Teams, Email Gateway, or Splunk HEC SIEM."""
    timestamp = datetime.utcnow()
    
    # Format message payload depending on channel type
    if channel_type.upper() == "SLACK":
        payload = {
            "text": f"🚨 *[RiskTrix Alert - {alert_payload.get('severity')}]* {alert_payload.get('title')}",
            "attachments": [
                {
                    "color": "#d32f2f" if alert_payload.get('severity') == "CRITICAL" else "#f57c00",
                    "fields": [
                        {"title": "Alert ID", "value": alert_payload.get('alert_id'), "short": True},
                        {"title": "Source", "value": alert_payload.get('source_service'), "short": True},
                        {"title": "Asset", "value": str(alert_payload.get('asset_id')), "short": False},
                        {"title": "Remediation", "value": str(alert_payload.get('remediation_steps')), "short": False},
                    ]
                }
            ]
        }
    elif channel_type.upper() == "TEAMS":
        payload = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": "d32f2f",
            "summary": alert_payload.get('title'),
            "title": f"RiskTrix Alert: {alert_payload.get('title')}",
            "sections": [
                {
                    "facts": [
                        {"name": "Severity", "value": alert_payload.get('severity')},
                        {"name": "Alert ID", "value": alert_payload.get('alert_id')},
                        {"name": "Source Service", "value": alert_payload.get('source_service')},
                    ],
                    "text": alert_payload.get('description'),
                }
            ],
        }
    elif channel_type.upper() == "SIEM_SPLUNK":
        payload = {
            "event": {
                "source": "RiskTrix-CNAPP",
                "alert_id": alert_payload.get('alert_id'),
                "severity": alert_payload.get('severity'),
                "title": alert_payload.get('title'),
                "asset_id": alert_payload.get('asset_id'),
                "source_service": alert_payload.get('source_service'),
            },
            "sourcetype": "_json",
        }
    else:
        # Generic Webhook or Email
        payload = alert_payload

    # Delivery attempt via httpx or urllib
    try:
        if target_url.startswith("http://") or target_url.startswith("https://"):
            if HAS_HTTPX:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    res = await client.post(target_url, json=payload)
                    return {
                        "status": "SUCCESS" if res.status_code < 400 else "FAILED",
                        "status_code": res.status_code,
                        "response_message": f"HTTP {res.status_code} - Delivery confirmed via httpx.",
                        "timestamp": timestamp,
                    }
            else:
                req_data = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(target_url, data=req_data, headers={"Content-Type": "application/json"}, method="POST")
                with urllib.request.urlopen(req, timeout=3.0) as response:
                    return {
                        "status": "SUCCESS",
                        "status_code": response.status,
                        "response_message": f"HTTP {response.status} - Delivery confirmed via urllib.",
                        "timestamp": timestamp,
                    }
        return {
            "status": "FAILED",
            "status_code": 400,
            "response_message": f"Target is not an HTTP URL: {target_url}",
            "timestamp": timestamp,
        }
    except Exception as e:
        logger.warning("Webhook delivery failed: %s", e)
        return {
            "status": "FAILED",
            "status_code": 502,
            "response_message": str(e),
            "timestamp": timestamp,
        }
