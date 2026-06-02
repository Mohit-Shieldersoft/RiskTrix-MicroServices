from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.schemas.asset import AssetCreate, AssetResponse, AssetUpdate, AssetImportResult
from app.schemas.dashboard import AssetDashboardResponse

from app.services.asset_service import (
    get_assets, create_asset, get_dashboard_data,
    update_asset, get_asset_by_id, delete_asset,
    import_assets_from_dataframe, _find_header_row,
)
import io, pandas as pd

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ✅ MUST be first — before any /{asset_id} routes
@router.get("/assets/dashboard", response_model=AssetDashboardResponse)
def get_asset_dashboard(db: Session = Depends(get_db)):
    return get_dashboard_data(db)

@router.get("/assets", response_model=list[AssetResponse])
def read_assets(db: Session = Depends(get_db)):
    return get_assets(db)

@router.post("/assets", response_model=AssetResponse, status_code=201)
def add_asset(asset: AssetCreate, db: Session = Depends(get_db)):
    if not asset.name.strip():
        raise HTTPException(status_code=422, detail="Asset name cannot be empty")
    return create_asset(db, asset)

# ✅ PUT before GET for /{asset_id}
@router.put("/assets/{asset_id}", response_model=AssetResponse)
def edit_asset(asset_id: int, asset: AssetUpdate, db: Session = Depends(get_db)):
    updated = update_asset(db, asset_id, asset)
    if not updated:
        raise HTTPException(status_code=404, detail="Asset not found")
    return updated

@router.delete("/assets/{asset_id}")
def remove_asset(asset_id: int, db: Session = Depends(get_db)):
    success = delete_asset(db, asset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Asset deleted successfully"}


# ── Bulk import ─────────────────────────────────────────────────────────────

@router.post("/assets/import/preview")
async def preview_import_columns(file: UploadFile = File(...)):
    """
    Debug endpoint: returns the detected header row index and column names
    found in each sheet, plus the first 3 data rows.
    """
    filename = file.filename or ""
    contents = await file.read()
    result = {}
    try:
        if filename.lower().endswith(".csv"):
            df_raw = pd.read_csv(io.BytesIO(contents), header=None, dtype=str, keep_default_na=False)
            hr = _find_header_row(df_raw)
            df = pd.read_csv(io.BytesIO(contents), header=hr, dtype=str, keep_default_na=False)
            result["CSV"] = {"header_row_detected": hr, "columns": list(df.columns), "sample": df.head(3).to_dict(orient="records")}
        elif filename.lower().endswith((".xlsx", ".xls")):
            xls = pd.ExcelFile(io.BytesIO(contents))
            for sheet in xls.sheet_names:
                df_raw = pd.read_excel(xls, sheet_name=sheet, header=None, dtype=str, keep_default_na=False)
                hr = _find_header_row(df_raw)
                df = pd.read_excel(xls, sheet_name=sheet, header=hr, dtype=str, keep_default_na=False)
                result[sheet] = {"header_row_detected": hr, "columns": list(df.columns), "sample": df.head(3).to_dict(orient="records")}
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return result


@router.post("/assets/import", response_model=AssetImportResult, status_code=200)
async def import_assets(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Accept .xlsx or .csv, process every sheet (Excel) / the single table (CSV),
    insert assets into the database, and return an import summary.
    """
    filename = file.filename or ""
    contents = await file.read()

    try:
        if filename.lower().endswith(".csv"):
            # Try to auto-detect header row in CSV too
            df_raw = pd.read_csv(io.BytesIO(contents), header=None, dtype=str, keep_default_na=False)
            header_row = _find_header_row(df_raw)
            df = pd.read_csv(io.BytesIO(contents), header=header_row, dtype=str, keep_default_na=False)
            df.replace("", None, inplace=True)
            result = import_assets_from_dataframe(db, df, sheet_name="")
        elif filename.lower().endswith((".xlsx", ".xls")):
            xls = pd.ExcelFile(io.BytesIO(contents))
            combined = {"success": 0, "failed": 0, "errors": [], "message": ""}
            for sheet in xls.sheet_names:
                # Read raw (no header) to detect where the header row actually is
                df_raw = pd.read_excel(xls, sheet_name=sheet, header=None, dtype=str, keep_default_na=False)
                header_row = _find_header_row(df_raw)
                df = pd.read_excel(xls, sheet_name=sheet, header=header_row, dtype=str, keep_default_na=False)
                df.replace("", None, inplace=True)
                r = import_assets_from_dataframe(db, df, sheet_name=sheet)
                combined["success"] += r["success"]
                combined["failed"]  += r["failed"]
                combined["errors"]  += r["errors"]
            total = combined["success"] + combined["failed"]
            combined["message"] = (
                f"Import complete across {len(xls.sheet_names)} sheet(s): "
                f"{combined['success']} asset(s) added, {combined['failed']} skipped "
                f"out of {total} rows processed."
            )
            result = combined
        else:
            raise HTTPException(status_code=400, detail="Only .xlsx, .xls, or .csv files are accepted.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse file: {exc}")

    return result


# ✅ MUST be last
@router.get("/assets/{asset_id}", response_model=AssetResponse)
def read_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = get_asset_by_id(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset