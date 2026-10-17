from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.post("/scan")
async def scan_with_yara(scan_request: dict):
    payload = (
        scan_request.get("payload")
        or scan_request.get("data")
        or scan_request.get("content")
        or scan_request.get("file_bytes")
    )
    rules = scan_request.get("rules") or scan_request.get("rule")
    if not payload or not rules:
        raise HTTPException(
            status_code=501,
            detail="YARA scan requires both payload and rules. Nothing was scanned.",
        )
    try:
        import yara
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="YARA engine is not installed on this service.",
        )
    try:
        compiled = yara.compile(source=rules if isinstance(rules, str) else str(rules))
        data = payload.encode("utf-8", errors="ignore") if isinstance(payload, str) else bytes(payload)
        matches = compiled.match(data=data)
        return {
            "result": {
                "matched": bool(matches),
                "matches": [str(m) for m in matches],
            }
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"YARA scan failed: {exc}")
