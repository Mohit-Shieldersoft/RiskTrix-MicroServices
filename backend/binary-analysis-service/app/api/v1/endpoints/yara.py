from fastapi import APIRouter

router = APIRouter()

@router.post("/scan")
async def scan_with_yara(scan_request: dict):
    # TODO: On-demand YARA scan
    return {"result": {}}