from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FileUploadResponse(BaseModel):
    file_id: str
    original_name: str
    stored_name: str
    context: str          # e.g. "ticket", "vulnerability", "poc", "general"
    ref_id: Optional[str] = None   # ticket_id, vuln_id, etc.
    size_bytes: int
    content_type: str
    url: str
    uploaded_at: datetime


class FileListItem(BaseModel):
    file_id: str
    original_name: str
    context: str
    ref_id: Optional[str] = None
    size_bytes: int
    content_type: str
    url: str
    uploaded_at: datetime


class DeleteResponse(BaseModel):
    success: bool
    detail: str
