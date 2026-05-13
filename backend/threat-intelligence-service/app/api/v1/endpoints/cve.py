from fastapi import APIRouter
import requests
from app.core.config import settings

router = APIRouter()

NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"

@router.post("/lookup")
async def lookup_cve(lookup_data: dict):
    binary_name = lookup_data.get("binary_name")
    version = lookup_data.get("version")

    if not binary_name:
        return {"error": "binary_name required"}

    # Query NVD API for CVEs
    params = {
        "cpeName": f"cpe:2.3:a:*:{binary_name}:{version}:*:*:*:*:*:*"
    }

    try:
        response = requests.get(NVD_API_URL, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        cves = []
        for vuln in data.get("vulnerabilities", []):
            cve = vuln.get("cve", {})
            cves.append({
                "cve_id": cve.get("id"),
                "description": cve.get("descriptions", [{}])[0].get("value", ""),
                "cvss_score": None,  # TODO: Extract from metrics
                "severity": "unknown"  # TODO: Map from CVSS
            })

        return {"cves": cves}
    except requests.RequestException as e:
        return {"error": f"NVD API error: {str(e)}"}