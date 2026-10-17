from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import SBOMPackage
from app.schemas.k8s_container import SBOMTreeResponse, SBOMPackageItem
from app.services.collectors.container_scanner import container_scanner

router = APIRouter()


@router.post("/containers/sbom/parse")
async def parse_sbom_document(payload: Dict[str, Any] = Body(...)):
    """Parse SPDX or CycloneDX JSON in-request (CNAPP /sbom/parse)."""
    document = payload.get("document") or payload
    components = []
    if document.get("bomFormat") == "CycloneDX" or document.get("components"):
        for component in document.get("components", []):
            licenses = component.get("licenses") or []
            license_id = None
            if licenses:
                license_id = (
                    (licenses[0].get("license") or {}).get("id")
                    or (licenses[0].get("license") or {}).get("name")
                )
            vulns = component.get("vulnerabilities") or []
            components.append({
                "package_name": component.get("name"),
                "version": component.get("version"),
                "ecosystem": (component.get("purl") or "pkg:generic").split("/")[0].replace("pkg:", "").upper(),
                "license": license_id or "UNKNOWN",
                "cve_id": vulns[0].get("id") if vulns else None,
                "severity": vulns[0].get("severity") if vulns else None,
            })
    for package in document.get("packages", []):
        components.append({
            "package_name": package.get("name"),
            "version": package.get("versionInfo") or package.get("version"),
            "ecosystem": "GENERIC",
            "license": package.get("licenseConcluded") or "UNKNOWN",
            "cve_id": None,
            "severity": None,
        })
    return {
        "format": "CycloneDX" if document.get("bomFormat") else "SPDX",
        "total_packages": len(components),
        "vulnerable_packages_count": len([c for c in components if c.get("cve_id")]),
        "packages": components,
    }


@router.get("/containers/sbom", response_model=List[Dict[str, Any]])
async def list_all_sbom_packages(
    ecosystem: Optional[str] = None,
    license_type: Optional[str] = None,
    severity: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all Software Bill of Materials (SBOM) dependencies across container images."""
    _, sbom_map = container_scanner.scan()
    all_packages = []
    for img_id, pkgs in sbom_map.items():
        for p in pkgs:
            if ecosystem and p.get("ecosystem", "").upper() != ecosystem.upper():
                continue
            if license_type and p.get("license", "").upper() != license_type.upper():
                continue
            if severity and p.get("severity", "").upper() != severity.upper():
                continue
            all_packages.append(p)
    return all_packages


@router.get("/containers/sbom/licenses")
async def get_license_compliance_summary():
    """Summary of open-source licenses (Copyleft GPL vs Permissive MIT/Apache)."""
    _, sbom_map = container_scanner.scan()
    licenses_count: Dict[str, int] = {}
    risk_summary = {"HIGH_RISK_COPYLEFT": 0, "PERMISSIVE": 0, "TOTAL_PACKAGES": 0}

    for img_id, pkgs in sbom_map.items():
        for p in pkgs:
            lic = p.get("license", "Unknown")
            licenses_count[lic] = licenses_count.get(lic, 0) + 1
            risk_summary["TOTAL_PACKAGES"] += 1
            if "GPL" in lic or "AGPL" in lic:
                risk_summary["HIGH_RISK_COPYLEFT"] += 1
            else:
                risk_summary["PERMISSIVE"] += 1

    return {
        "summary": risk_summary,
        "breakdown": licenses_count
    }


@router.get("/containers/sbom/export/{image_id}")
async def export_sbom_spec(image_id: str, format: str = "cyclonedx"):
    """Export standard CycloneDX 1.4 or SPDX 2.3 JSON specification payload."""
    images, sbom_map = container_scanner.scan()
    packages_data = sbom_map.get(image_id)
    if not packages_data:
        packages_data = list(sbom_map.values())[0] if sbom_map else []

    target_img = next((img for img in images if img["id"] == image_id), None)
    img_name = target_img["repository"] if target_img else "risktrix/backend"
    img_tag = target_img["tag"] if target_img else "latest"

    if format.lower() == "spdx":
        spdx_doc = {
            "spdxVersion": "SPDX-2.3",
            "dataLicense": "CC0-1.0",
            "SPDXID": "SPDXRef-DOCUMENT",
            "name": f"{img_name}-{img_tag}",
            "documentNamespace": f"https://risktrix.io/spdx/{image_id}",
            "creationInfo": {
                "creators": ["Tool: RiskTrix CNAPP Engine-1.0"],
                "created": "2026-09-21T11:23:00Z"
            },
            "packages": [
                {
                    "name": p["package_name"],
                    "versionInfo": p["version"],
                    "licenseConcluded": p["license"],
                    "externalRefs": [
                        {
                            "referenceCategory": "PACKAGE-MANAGER",
                            "referenceType": "purl",
                            "referenceLocator": f"pkg:{p['ecosystem'].lower()}/{p['package_name']}@{p['version']}"
                        }
                    ]
                } for p in packages_data
            ]
        }
        return JSONResponse(content=spdx_doc)
    
    # Default CycloneDX 1.4 JSON format
    cyclonedx_doc = {
        "bomFormat": "CycloneDX",
        "specVersion": "1.4",
        "serialNumber": f"urn:uuid:{image_id}",
        "version": 1,
        "metadata": {
            "timestamp": "2026-09-21T11:23:00Z",
            "component": {
                "type": "container",
                "name": img_name,
                "version": img_tag,
            }
        },
        "components": [
            {
                "type": "library",
                "name": p["package_name"],
                "version": p["version"],
                "purl": f"pkg:{p['ecosystem'].lower()}/{p['package_name']}@{p['version']}",
                "licenses": [{"license": {"id": p["license"]}}],
                "vulnerabilities": [
                    {"id": p["cve_id"], "severity": p["severity"]}
                ] if p.get("cve_id") else []
            } for p in packages_data
        ]
    }
    return JSONResponse(content=cyclonedx_doc)


@router.get("/containers/sbom/{image_id}", response_model=SBOMTreeResponse)
async def get_image_sbom_tree(
    image_id: str,
    db: AsyncSession = Depends(get_db),
):
    """SBOM Generator: Generate CycloneDX Software Bill of Materials package dependency tree & vulnerability licenses."""
    _, sbom_packages_map = container_scanner.scan()
    packages_data = sbom_packages_map.get(image_id)
    if not packages_data:
        packages_data = list(sbom_packages_map.values())[0]

    packages = [SBOMPackageItem(**p) for p in packages_data]
    vulnerable_count = len([p for p in packages if p.cve_id])

    return SBOMTreeResponse(
        image_id=image_id,
        format="CycloneDX-1.4",
        total_packages=len(packages),
        vulnerable_packages_count=vulnerable_count,
        packages=packages,
    )
