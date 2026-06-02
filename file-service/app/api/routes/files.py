import os
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse

from app.schemas.file import FileUploadResponse, FileListItem, DeleteResponse
from app.services.file_service import save_file, get_file_record, list_files, delete_file

router = APIRouter(prefix="/files", tags=["Files"])

ALLOWED_CONTEXTS = {"ticket", "vulnerability", "poc", "asset", "audit", "general"}


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    context: str = Query(default="general", description="ticket | vulnerability | poc | asset | audit | general"),
    ref_id: Optional[str] = Query(default=None, description="ID of the related entity, e.g. ticket_id"),
):
    """Upload a file and associate it with a context (ticket, vulnerability, POC, etc.)."""
    if context not in ALLOWED_CONTEXTS:
        raise HTTPException(status_code=400, detail=f"Invalid context. Must be one of: {ALLOWED_CONTEXTS}")
    record = await save_file(file, context, ref_id)
    return record


@router.get("/list", response_model=list[FileListItem])
def list_uploaded_files(
    context: Optional[str] = Query(default=None),
    ref_id: Optional[str] = Query(default=None),
):
    """List all uploaded files, optionally filtered by context and/or ref_id."""
    return list_files(context, ref_id)


@router.get("/download/{file_id}")
def download_file(file_id: str):
    """Download a file by its file_id."""
    record = get_file_record(file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    path = record.get("path", "")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File missing from storage")
    return FileResponse(
        path=path,
        filename=record["original_name"],
        media_type=record.get("content_type", "application/octet-stream"),
    )


@router.get("/info/{file_id}", response_model=FileListItem)
def file_info(file_id: str):
    """Get metadata for a specific file."""
    record = get_file_record(file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    return record


@router.delete("/{file_id}", response_model=DeleteResponse)
def remove_file(file_id: str):
    """Delete a file by its file_id."""
    success = delete_file(file_id)
    if not success:
        raise HTTPException(status_code=404, detail="File not found")
    return DeleteResponse(success=True, detail=f"File {file_id} deleted")
