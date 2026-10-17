import json
import logging
from datetime import datetime
from typing import List, Dict, Any
import urllib.request

logger = logging.getLogger("threat-feed-ingestion")

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False

# Standard Rich Seed Dataset for NIST NVD v2.0 + CISA KEV + FIRST EPSS Scores
SEED_VULNERABILITIES = [
    {
        "cve_id": "CVE-2023-38606",
        "summary": "Apple iOS/macOS Kernel memory corruption vulnerability permitting arbitrary kernel code execution with system privileges.",
        "cvss_v3_score": 9.8,
        "severity": "CRITICAL",
        "is_cisa_kev": True,
        "kev_date_added": "2023-07-25",
        "kev_required_action": "Apply vendor security update immediately per CISA Directive 23-02.",
        "kev_due_date": "2023-08-15",
        "epss_score": 0.9423,
        "epss_percentile": 0.9912,
        "cwe_id": "CWE-119",
        "vendor_project": "Apple",
        "product": "iOS and macOS Kernel",
    },
    {
        "cve_id": "CVE-2021-44228",
        "summary": "Apache Log4j2 JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP endpoints (Log4Shell).",
        "cvss_v3_score": 10.0,
        "severity": "CRITICAL",
        "is_cisa_kev": True,
        "kev_date_added": "2021-12-10",
        "kev_required_action": "Upgrade Log4j2 to version 2.17.1 or higher.",
        "kev_due_date": "2021-12-24",
        "epss_score": 0.9752,
        "epss_percentile": 0.9985,
        "cwe_id": "CWE-502",
        "vendor_project": "Apache",
        "product": "Log4j Core",
    },
    {
        "cve_id": "CVE-2023-34362",
        "summary": "MOVEit Transfer SQL Injection vulnerability leading to unauthenticated remote code execution and unauthorized data exfiltration.",
        "cvss_v3_score": 9.8,
        "severity": "CRITICAL",
        "is_cisa_kev": True,
        "kev_date_added": "2023-06-02",
        "kev_required_action": "Apply MOVEit Transfer emergency hotfix and restrict HTTP/HTTPS inbound traffic.",
        "kev_due_date": "2023-06-23",
        "epss_score": 0.9615,
        "epss_percentile": 0.9950,
        "cwe_id": "CWE-89",
        "vendor_project": "Progress Software",
        "product": "MOVEit Transfer",
    },
    {
        "cve_id": "CVE-2024-21887",
        "summary": "Ivanti Connect Secure command injection vulnerability allowing an authenticated administrator to execute arbitrary commands.",
        "cvss_v3_score": 9.1,
        "severity": "CRITICAL",
        "is_cisa_kev": True,
        "kev_date_added": "2024-01-12",
        "kev_required_action": "Import mitigation XML file and apply patch build 9.1R18.2.",
        "kev_due_date": "2024-01-22",
        "epss_score": 0.9140,
        "epss_percentile": 0.9880,
        "cwe_id": "CWE-77",
        "vendor_project": "Ivanti",
        "product": "Connect Secure / Policy Secure",
    },
    {
        "cve_id": "CVE-2024-30078",
        "summary": "Windows Wi-Fi Driver Remote Code Execution Vulnerability allowing unauthenticated attacker to execute code over wireless network packets.",
        "cvss_v3_score": 8.8,
        "severity": "HIGH",
        "is_cisa_kev": False,
        "kev_date_added": None,
        "kev_required_action": None,
        "kev_due_date": None,
        "epss_score": 0.1245,
        "epss_percentile": 0.4580,
        "cwe_id": "CWE-20",
        "vendor_project": "Microsoft",
        "product": "Windows 11 and Windows Server 2022",
    },
    {
        "cve_id": "CVE-2023-23397",
        "summary": "Microsoft Outlook Elevation of Privilege Vulnerability triggered when receiving specially crafted email with custom chime sound URI.",
        "cvss_v3_score": 9.8,
        "severity": "CRITICAL",
        "is_cisa_kev": True,
        "kev_date_added": "2023-03-14",
        "kev_required_action": "Install March 2023 Microsoft Office cumulative update.",
        "kev_due_date": "2023-03-28",
        "epss_score": 0.9580,
        "epss_percentile": 0.9940,
        "cwe_id": "CWE-200",
        "vendor_project": "Microsoft",
        "product": "Outlook Desktop Client",
    },
]


async def fetch_cisa_kev_feed() -> List[Dict[str, Any]]:
    """Fetch live CISA Known Exploited Vulnerabilities catalog feed."""
    url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
    try:
        if HAS_HTTPX:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    vulnerabilities = data.get("vulnerabilities", [])
                    logger.info(f"Successfully fetched {len(vulnerabilities)} CISA KEV records via httpx.")
                    return vulnerabilities
        else:
            req = urllib.request.Request(url, headers={"User-Agent": "RiskTrix-ThreatIntel/1.0"})
            with urllib.request.urlopen(req, timeout=4.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    vulnerabilities = data.get("vulnerabilities", [])
                    logger.info(f"Successfully fetched {len(vulnerabilities)} CISA KEV records via urllib.")
                    return vulnerabilities
    except Exception as e:
        logger.info(f"CISA KEV live fetch fallback note: {e}")
    return []


async def fetch_first_epss_scores(cve_ids: List[str]) -> Dict[str, Dict[str, float]]:
    """Fetch live EPSS score probabilities from FIRST.org API."""
    if not cve_ids:
        return {}
    url = f"https://api.first.org/data/v1/epss?cve={','.join(cve_ids[:10])}"
    try:
        if HAS_HTTPX:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    results = {}
                    for item in data.get("data", []):
                        results[item["cve"]] = {
                            "epss": float(item.get("epss", 0.0)),
                            "percentile": float(item.get("percentile", 0.0)),
                        }
                    return results
        else:
            req = urllib.request.Request(url, headers={"User-Agent": "RiskTrix-ThreatIntel/1.0"})
            with urllib.request.urlopen(req, timeout=4.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    results = {}
                    for item in data.get("data", []):
                        results[item["cve"]] = {
                            "epss": float(item.get("epss", 0.0)),
                            "percentile": float(item.get("percentile", 0.0)),
                        }
                    return results
    except Exception as e:
        logger.info(f"FIRST EPSS live fetch note: {e}")
    return {}


async def fetch_nvd_cves() -> tuple:
    """Fetch a live NVD page. Returns (records, error). Never invents a count."""
    url = "https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=20"
    try:
        if HAS_HTTPX:
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.get(url, headers={"User-Agent": "RiskTrix-ThreatIntel/1.0"})
                if resp.status_code != 200:
                    return [], f"NVD HTTP {resp.status_code}"
                data = resp.json()
        else:
            req = urllib.request.Request(url, headers={"User-Agent": "RiskTrix-ThreatIntel/1.0"})
            with urllib.request.urlopen(req, timeout=12.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        items = []
        for vuln in data.get("vulnerabilities", []):
            cve = vuln.get("cve") or {}
            metrics = (((cve.get("metrics") or {}).get("cvssMetricV31") or [{}])[0].get("cvssData") or {})
            items.append({
                "cve_id": cve.get("id"),
                "summary": ((cve.get("descriptions") or [{}])[0].get("value")),
                "cvss_v3_score": metrics.get("baseScore") or 0,
                "severity": (metrics.get("baseSeverity") or "UNKNOWN").upper(),
                "is_cisa_kev": False,
                "cwe_id": None,
                "vendor_project": None,
                "product": None,
            })
        return [item for item in items if item.get("cve_id")], None
    except Exception as exc:
        logger.info("NVD live fetch note: %s", exc)
        return [], str(exc)


async def persist_feed_items(db, records, source: str = "nvd"):
    from sqlalchemy.future import select
    from app.models.models import VulnerabilityFeedItem

    for raw in records or []:
        cve_id = raw.get("cve_id") or raw.get("cveID")
        if not cve_id:
            continue
        existing = (await db.execute(select(VulnerabilityFeedItem).where(VulnerabilityFeedItem.cve_id == cve_id))).scalar_one_or_none()
        summary = raw.get("summary") or raw.get("shortDescription") or raw.get("vulnerabilityName")
        severity = (raw.get("severity") or "HIGH").upper()
        if existing:
            if summary:
                existing.summary = summary
            if source == "cisa":
                existing.is_cisa_kev = True
            continue
        db.add(VulnerabilityFeedItem(
            cve_id=cve_id,
            summary=summary,
            cvss_v3_score=float(raw.get("cvss_v3_score") or 0),
            severity=severity,
            is_cisa_kev=source == "cisa" or bool(raw.get("is_cisa_kev")),
            kev_required_action=raw.get("requiredAction") or raw.get("kev_required_action"),
            vendor_project=raw.get("vendorProject") or raw.get("vendor_project"),
            product=raw.get("product"),
        ))

