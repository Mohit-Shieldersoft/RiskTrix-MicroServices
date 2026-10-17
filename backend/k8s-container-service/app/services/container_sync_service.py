"""
Container Image Sync & SBOM Persistence Service for RiskTrix
Coordinates container image CVE scanning and persists container images & SBOM package trees in PostgreSQL.
"""
import logging
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.models import ContainerImage, SBOMPackage
from app.services.collectors.container_scanner import container_scanner

logger = logging.getLogger("container.sync.service")


class ContainerSyncService:
    """Service for running container image security scans and persisting records to PostgreSQL."""

    async def run_sync(self, db: AsyncSession) -> Dict[str, Any]:
        """Runs ContainerScanner and syncs images & SBOM packages into database."""
        logger.info("Starting Container Image CVE & CycloneDX SBOM synchronization...")

        images_data, sbom_packages_map = container_scanner.scan()

        # Clean existing images and sbom packages if any
        existing_imgs = await db.execute(select(ContainerImage))
        for img in existing_imgs.scalars().all():
            await db.delete(img)

        existing_sboms = await db.execute(select(SBOMPackage))
        for s in existing_sboms.scalars().all():
            await db.delete(s)

        await db.commit()

        # Insert Container Images
        saved_images = []
        for img_dict in images_data:
            img_obj = ContainerImage(**img_dict)
            db.add(img_obj)
            saved_images.append(img_obj)

        # Insert SBOM Packages
        saved_sbom_count = 0
        for img_id, packages in sbom_packages_map.items():
            for pkg_dict in packages:
                # Ensure fields match SBOMPackage model
                clean_pkg = {
                    "id": pkg_dict.get("id"),
                    "image_id": img_id,
                    "package_name": pkg_dict.get("package_name"),
                    "version": pkg_dict.get("version"),
                    "ecosystem": pkg_dict.get("ecosystem"),
                    "license": pkg_dict.get("license", "MIT"),
                    "cve_id": pkg_dict.get("cve_id"),
                    "severity": pkg_dict.get("severity")
                }
                sbom_obj = SBOMPackage(**clean_pkg)
                db.add(sbom_obj)
                saved_sbom_count += 1

        await db.commit()

        logger.info(f"Container Sync Complete: {len(saved_images)} container images and {saved_sbom_count} SBOM packages synced.")

        return {
            "status": "SUCCESS",
            "images_synced": len(saved_images),
            "sbom_packages_synced": saved_sbom_count,
            "message": f"Successfully scanned and updated {len(saved_images)} container images and {saved_sbom_count} SBOM package dependencies."
        }


container_sync_service = ContainerSyncService()
