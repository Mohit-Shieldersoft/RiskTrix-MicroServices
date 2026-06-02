from sqlalchemy.orm import Session
from app.models.asset import Asset, Vulnerability, InstalledSoftware, AssetChangeLog
from datetime import datetime


def get_assets(db: Session):
    return db.query(Asset).all()


def get_asset_by_id(db: Session, asset_id: int):
    return db.query(Asset).filter(Asset.id == asset_id).first()


def create_asset(db: Session, asset_data):
    asset_dict = asset_data.dict(exclude_none=True)
    asset_dict["risk_level"] = asset_dict["risk_level"].lower().strip()
    asset_dict["type"] = asset_dict["type"].lower().replace(" ", "_").strip()
    asset = Asset(**asset_dict)
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


# Changelog-aware update
_TRACKED_FIELDS = {
    "name", "type", "risk_level", "vendor", "owner", "custodian",
    "ip_address", "hostname", "purchase_date", "warranty_expiry",
    "end_of_life_date", "business_criticality", "tags", "compliance_scope",
    "location", "site", "notes",
}


def update_asset(db: Session, asset_id: int, asset_data):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        return None
    update_dict = asset_data.dict(exclude_unset=True)
    changed_by = update_dict.pop("changed_by", "system")

    for key, value in update_dict.items():
        old_val = getattr(asset, key, None)
        setattr(asset, key, value)
        if key in _TRACKED_FIELDS and str(old_val) != str(value):
            db.add(AssetChangeLog(
                asset_id=asset_id,
                changed_by=changed_by,
                field_name=key,
                old_value=str(old_val) if old_val is not None else None,
                new_value=str(value) if value is not None else None,
            ))

    db.commit()
    db.refresh(asset)
    return asset


def delete_asset(db: Session, asset_id: int):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        return False
    db.delete(asset)
    db.commit()
    return True


# ── Vulnerability CRUD ────────────────────────────────────────────────────────

def get_vulnerabilities(db: Session, asset_id: int):
    return db.query(Vulnerability).filter(Vulnerability.asset_id == asset_id).order_by(Vulnerability.discovered_at.desc()).all()


def add_vulnerability(db: Session, asset_id: int, data):
    vuln = Vulnerability(asset_id=asset_id, **data.dict(exclude_none=True))
    db.add(vuln)
    # keep denormalised count in sync
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if asset:
        asset.vulnerabilities_count = db.query(Vulnerability).filter(
            Vulnerability.asset_id == asset_id,
            Vulnerability.status != "resolved",
        ).count() + 1
    db.commit()
    db.refresh(vuln)
    return vuln


def update_vulnerability(db: Session, vuln_id: int, data):
    vuln = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not vuln:
        return None
    update_dict = data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(vuln, key, value)
    if data.status == "resolved" and not vuln.resolved_at:
        vuln.resolved_at = datetime.utcnow()
    db.commit()
    # resync count
    asset = db.query(Asset).filter(Asset.id == vuln.asset_id).first()
    if asset:
        asset.vulnerabilities_count = db.query(Vulnerability).filter(
            Vulnerability.asset_id == vuln.asset_id,
            Vulnerability.status != "resolved",
        ).count()
        db.commit()
    db.refresh(vuln)
    return vuln


def delete_vulnerability(db: Session, vuln_id: int):
    vuln = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not vuln:
        return False
    asset_id = vuln.asset_id
    db.delete(vuln)
    db.commit()
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if asset:
        asset.vulnerabilities_count = db.query(Vulnerability).filter(
            Vulnerability.asset_id == asset_id,
            Vulnerability.status != "resolved",
        ).count()
        db.commit()
    return True


# ── Software inventory CRUD ───────────────────────────────────────────────────

def get_software(db: Session, asset_id: int):
    return db.query(InstalledSoftware).filter(InstalledSoftware.asset_id == asset_id).order_by(InstalledSoftware.name).all()


def add_software(db: Session, asset_id: int, data):
    sw = InstalledSoftware(asset_id=asset_id, **data.dict(exclude_none=True))
    db.add(sw)
    db.commit()
    db.refresh(sw)
    return sw


def delete_software(db: Session, sw_id: int):
    sw = db.query(InstalledSoftware).filter(InstalledSoftware.id == sw_id).first()
    if not sw:
        return False
    db.delete(sw)
    db.commit()
    return True


# ── Change log ────────────────────────────────────────────────────────────────

def get_changelog(db: Session, asset_id: int):
    return db.query(AssetChangeLog).filter(AssetChangeLog.asset_id == asset_id).order_by(AssetChangeLog.changed_at.desc()).all()


def get_dashboard_data(db: Session):
    assets = db.query(Asset).all()
    total = len(assets)
    high = len([a for a in assets if a.risk_level == "high"])
    medium = len([a for a in assets if a.risk_level == "medium"])
    low = len([a for a in assets if a.risk_level == "low"])
    by_type = {}
    for a in assets:
        by_type[a.type] = by_type.get(a.type, 0) + 1
    return {
        "total_assets": total,
        "high_risk": high,
        "medium_risk": medium,
        "low_risk": low,
        "riskDistribution": {"high": high, "medium": medium, "low": low},
        "byType": by_type,
    }


# ── Bulk import ───────────────────────────────────────────────────────────────

# Flexible column aliases — normalised key → possible Excel header variants
_COL_ALIASES = {
    "name":          ["name", "asset name", "device make & model", "device make and model",
                      "device model", "model", "asset", "description", "equipment",
                      "item", "device name", "hostname"],
    "type":          ["type", "asset type", "device type", "category", "equipment type"],
    "risk_level":    ["risk level", "risk", "risk_level", "criticality", "priority"],
    "serial_number": ["serial number", "serial no", "serial_number", "sn", "s/n",
                      "serial #", "serialnumber"],
    "device_model":  ["device make & model", "device model", "make & model", "model",
                      "device make and model", "make/model", "make model"],
    "rack_position": ["u space", "rack position", "rack pos", "rack_position", "rack",
                      "u", "ru", "rack unit", "position", "slot", "rack slot", "u-space"],
    "power_source":  ["power source", "power_source", "pdu", "power feed", "power supply",
                      "psu", "feed"],
    "power_watts":   ["power watts", "power_watts", "power (w)", "watts", "wattage",
                      "power", "power consumption", "power (watts)", "power w"],
    "location":      ["location", "loc", "physical location", "room", "floor"],
    "site":          ["site", "site name", "data center", "dc", "datacenter", "facility"],
    "notes":         ["notes", "remarks", "comments", "description", "note", "info"],
}

_VALID_TYPES = {
    "web_application", "mobile_application", "api",
    "server", "database", "network_device", "endpoint",
    "cloud_service", "iot_device", "container",
    "firewall", "router", "switch", "load_balancer",
}

_VALID_RISKS = {"low", "medium", "high"}

# Flat set of all known aliases for header-row detection
_ALL_ALIASES = {alias for aliases in _COL_ALIASES.values() for alias in aliases}


def _normalise_col(col: str) -> str:
    return str(col).strip().lower().replace("_", " ").replace("-", " ")


def _find_header_row(df_raw) -> int:
    """
    Scan the first 15 rows to find which row contains the most recognisable
    column keywords.  Returns that row index (0-based).
    Falls back to 0 if nothing matches.
    """
    import math
    best_row, best_score = 0, 0
    for i in range(min(15, len(df_raw))):
        score = 0
        for val in df_raw.iloc[i]:
            if val is None or (isinstance(val, float) and math.isnan(val)):
                continue
            if _normalise_col(str(val)) in _ALL_ALIASES:
                score += 1
        if score > best_score:
            best_score, best_row = score, i
    return best_row


def _build_col_map(df_columns: list) -> dict:
    """Return {our_field: df_column_name} for every column we can match."""
    normalised = {_normalise_col(c): c for c in df_columns}
    mapping = {}
    for field, aliases in _COL_ALIASES.items():
        for alias in aliases:
            if alias in normalised and field not in mapping:
                mapping[field] = normalised[alias]
    return mapping


def _infer_type(device_model: str) -> str:
    """Guess asset type from device model string (best-effort)."""
    if not device_model:
        return "network_device"
    m = device_model.lower()
    if any(k in m for k in ["switch", "dgs", "dlink", "cisco catalyst", "nexus", "sw"]):
        return "switch"
    if any(k in m for k in ["firewall", "asa", "fortinet", "palo alto", "fw"]):
        return "firewall"
    if any(k in m for k in ["router", "isr", "asr", "rt"]):
        return "router"
    if any(k in m for k in ["server", "poweredge", "proliant", "blade"]):
        return "server"
    if any(k in m for k in ["storage", "san", "nas", "ds"]):
        return "database"
    if any(k in m for k in ["ups", "pdu", "ats"]):
        return "endpoint"
    return "network_device"


def import_assets_from_dataframe(db: Session, df, sheet_name: str = "") -> dict:
    """
    Process one pandas DataFrame (one Excel sheet / CSV).
    Returns {success, failed, errors}.
    """
    import math

    col_map = _build_col_map(list(df.columns))
    success = 0
    failed = 0
    errors = []

    for idx, row in df.iterrows():
        row_num = int(idx) + 2  # 1-based, header is row 1
        label = f"Sheet '{sheet_name}', Row {row_num}" if sheet_name else f"Row {row_num}"

        def cell(field):
            col = col_map.get(field)
            if col is None:
                return None
            val = row.get(col)
            if val is None or (isinstance(val, float) and math.isnan(val)):
                return None
            return str(val).strip() or None

        # ── Resolve name ──
        name = cell("name")
        device_model_val = cell("device_model")
        if not name:
            name = device_model_val  # fallback: use model as name
        if not name:
            failed += 1
            errors.append({"row": row_num, "error": f"{label}: missing name / device model — row skipped", "data": {}})
            continue

        # ── Duplicate check by serial_number ──
        serial = cell("serial_number")
        if serial:
            existing = db.query(Asset).filter(Asset.serial_number == serial).first()
            if existing:
                failed += 1
                errors.append({"row": row_num, "error": f"{label}: serial '{serial}' already exists — skipped", "data": {"serial_number": serial}})
                continue

        # ── Resolve type ──
        raw_type = cell("type")
        if raw_type:
            normalised_type = raw_type.lower().replace(" ", "_")
            asset_type = normalised_type if normalised_type in _VALID_TYPES else _infer_type(device_model_val or "")
        else:
            asset_type = _infer_type(device_model_val or name or "")

        # ── Resolve risk_level ──
        raw_risk = cell("risk_level")
        if raw_risk and raw_risk.lower() in _VALID_RISKS:
            risk_level = raw_risk.lower()
        else:
            risk_level = "medium"  # sensible default for imported assets

        asset = Asset(
            name=name,
            type=asset_type,
            risk_level=risk_level,
            serial_number=serial,
            device_model=device_model_val,
            rack_position=cell("rack_position"),
            power_source=cell("power_source"),
            power_watts=cell("power_watts"),
            location=cell("location"),
            site=cell("site"),
            notes=cell("notes"),
        )
        db.add(asset)
        success += 1

    db.commit()
    total = success + failed
    return {
        "success": success,
        "failed": failed,
        "errors": errors,
        "message": f"Import complete: {success} asset(s) added, {failed} skipped out of {total} rows processed.",
    }