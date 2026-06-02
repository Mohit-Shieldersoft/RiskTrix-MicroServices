from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String)
    risk_level = Column(String)
    vulnerabilities_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # ── Bulk import / data-centre inventory ──
    serial_number  = Column(String, nullable=True)
    device_model   = Column(String, nullable=True)
    rack_position  = Column(String, nullable=True)
    power_source   = Column(String, nullable=True)
    power_watts    = Column(String, nullable=True)
    location       = Column(String, nullable=True)
    site           = Column(String, nullable=True)
    notes          = Column(Text, nullable=True)

    # ── Lifecycle tracking ──
    vendor           = Column(String, nullable=True)
    owner            = Column(String, nullable=True)
    custodian        = Column(String, nullable=True)
    ip_address       = Column(String, nullable=True)
    hostname         = Column(String, nullable=True)
    purchase_date    = Column(Date, nullable=True)
    warranty_expiry  = Column(Date, nullable=True)
    end_of_life_date = Column(Date, nullable=True)

    # ── Classification ──
    business_criticality = Column(String, nullable=True)   # critical/high/medium/low
    tags                 = Column(String, nullable=True)   # comma-separated e.g. "PCI-DSS,HIPAA"
    compliance_scope     = Column(String, nullable=True)   # e.g. "PCI-DSS,SOC2"

    # ── Relationships ──
    vulnerabilities  = relationship("Vulnerability",    back_populates="asset", cascade="all, delete-orphan")
    software         = relationship("InstalledSoftware", back_populates="asset", cascade="all, delete-orphan")
    changelog        = relationship("AssetChangeLog",   back_populates="asset", cascade="all, delete-orphan")


class Vulnerability(Base):
    __tablename__ = "asset_vulnerabilities"

    id               = Column(Integer, primary_key=True, index=True)
    asset_id         = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    cve_id           = Column(String, nullable=True)          # e.g. CVE-2024-1234
    title            = Column(String, nullable=False)
    severity         = Column(String, default="medium")       # critical/high/medium/low/info
    cvss_score       = Column(Float, nullable=True)           # 0.0 – 10.0
    description      = Column(Text, nullable=True)
    status           = Column(String, default="open")         # open/in_progress/resolved/accepted
    discovered_at    = Column(DateTime, default=datetime.utcnow)
    resolved_at      = Column(DateTime, nullable=True)
    remediation_notes = Column(Text, nullable=True)

    asset = relationship("Asset", back_populates="vulnerabilities")


class InstalledSoftware(Base):
    __tablename__ = "asset_software"

    id             = Column(Integer, primary_key=True, index=True)
    asset_id       = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    name           = Column(String, nullable=False)
    vendor         = Column(String, nullable=True)
    version        = Column(String, nullable=True)
    patch_level    = Column(String, nullable=True)
    is_outdated    = Column(Boolean, default=False)
    is_licensed    = Column(Boolean, default=True)
    license_expiry = Column(Date, nullable=True)
    install_date   = Column(Date, nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)

    asset = relationship("Asset", back_populates="software")


class AssetChangeLog(Base):
    __tablename__ = "asset_changelog"

    id         = Column(Integer, primary_key=True, index=True)
    asset_id   = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    changed_by = Column(String, default="system")
    field_name = Column(String, nullable=False)
    old_value  = Column(Text, nullable=True)
    new_value  = Column(Text, nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("Asset", back_populates="changelog")
