from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import ContainerImage
from app.schemas.k8s_container import ContainerImageResponse
from app.services.container_sync_service import container_sync_service
from app.services.demo_scope import is_demo_request, in_scope

router = APIRouter()


@router.get("/containers/images", response_model=List[ContainerImageResponse])
async def list_container_images(
    request: Request,
    registry: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List scanned images from ECR, ACR, GCR, and Docker Hub."""
    query = select(ContainerImage)
    if registry and registry.upper() != "ALL":
        query = query.where(ContainerImage.registry == registry.upper())
    result = await db.execute(query)
    demo = is_demo_request(request)
    return [row for row in result.scalars().all() if in_scope(row.id, demo)]


@router.get("/containers/images/{image_id}", response_model=ContainerImageResponse)
async def get_container_image(image_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ContainerImage).where(ContainerImage.id == image_id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image


@router.post("/containers/sync", status_code=status.HTTP_200_OK)
@router.post("/containers/scan", status_code=status.HTTP_200_OK)
async def trigger_container_sync(db: AsyncSession = Depends(get_db)):
    """Trigger container image CVE scanning and SBOM package sync."""
    return await container_sync_service.run_sync(db=db)


@router.get("/containers/registries")
async def list_connected_registries(db: AsyncSession = Depends(get_db)):
    """List connected container image registries inferred from scanned images."""
    result = await db.execute(select(ContainerImage.registry))
    registries = sorted({row for row in result.scalars().all() if row})
    return [{"id": name, "name": name, "status": "CONNECTED"} for name in registries]


_VULN_STATUS = {}


@router.get("/containers/stats")
async def container_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ContainerImage))
    images = result.scalars().all()
    return {
        "images": len(images),
        "registries": len({image.registry for image in images if image.registry}),
        "critical": sum(image.critical_cve_count or 0 for image in images),
        "high": sum(image.high_cve_count or 0 for image in images),
        "open": len([
            image for image in images
            if (image.critical_cve_count or 0) + (image.high_cve_count or 0) > 0
        ]),
    }


@router.get("/containers/vulnerabilities")
async def list_container_vulnerabilities(db: AsyncSession = Depends(get_db)):
    """Flatten per-image CVE counts into a vulnerability list for the UI."""
    result = await db.execute(select(ContainerImage))
    images = result.scalars().all()
    vulns = []
    for image in images:
        for severity, count in (
            ("CRITICAL", image.critical_cve_count or 0),
            ("HIGH", image.high_cve_count or 0),
            ("MEDIUM", image.medium_cve_count or 0),
            ("LOW", image.low_cve_count or 0),
        ):
            if count:
                vuln_id = f"{image.id}:{severity}"
                vulns.append({
                    "id": vuln_id,
                    "image_id": image.id,
                    "repository": image.repository,
                    "tag": image.tag,
                    "registry": image.registry,
                    "severity": severity,
                    "count": count,
                    "status": _VULN_STATUS.get(vuln_id, "OPEN"),
                })
    return vulns


@router.patch("/containers/vulnerabilities/{vuln_id:path}/status")
async def update_container_vuln_status(vuln_id: str, status: str):
    valid = {"OPEN", "SUPPRESSED", "REMEDIATED", "FALSE_POSITIVE"}
    if status.upper() not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {sorted(valid)}")
    _VULN_STATUS[vuln_id] = status.upper()
    return {"id": vuln_id, "status": status.upper()}
