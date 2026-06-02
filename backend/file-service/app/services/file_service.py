"""
File Service — storage layer.
Stores files on local filesystem under:
  uploads/{context}/{ref_id}/{file_id}_{original_name}

Metadata is stored in a simple JSON index file per context/ref.
No DB required — can be swapped for S3 later by replacing this module.
"""
import os
import uuid
import json
import shutil
import aiofiles
from datetime import datetime, timezone
from typing import Optional
from fastapi import UploadFile, HTTPException

from app.core.config import settings

INDEX_FILE = "file_index.json"


def _index_path() -> str:
    return os.path.join(settings.upload_dir, INDEX_FILE)


def _load_index() -> dict:
    path = _index_path()
    if not os.path.exists(path):
        return {}
    with open(path, "r") as f:
        return json.load(f)


def _save_index(index: dict) -> None:
    os.makedirs(settings.upload_dir, exist_ok=True)
    with open(_index_path(), "w") as f:
        json.dump(index, f, indent=2, default=str)


def _dest_dir(context: str, ref_id: Optional[str]) -> str:
    parts = [settings.upload_dir, context]
    if ref_id:
        parts.append(ref_id)
    return os.path.join(*parts)


async def save_file(
    file: UploadFile,
    context: str,
    ref_id: Optional[str],
) -> dict:
    # Size check
    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of {settings.max_file_size_mb}MB"
        )

    file_id = str(uuid.uuid4())
    original_name = file.filename or "unnamed"
    safe_name = original_name.replace(" ", "_")
    stored_name = f"{file_id}_{safe_name}"

    dest_dir = _dest_dir(context, ref_id)
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, stored_name)

    async with aiofiles.open(dest_path, "wb") as out:
        await out.write(content)

    url = f"/api/v1/files/download/{file_id}"

    record = {
        "file_id": file_id,
        "original_name": original_name,
        "stored_name": stored_name,
        "context": context,
        "ref_id": ref_id,
        "size_bytes": len(content),
        "content_type": file.content_type or "application/octet-stream",
        "url": url,
        "path": dest_path,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }

    index = _load_index()
    index[file_id] = record
    _save_index(index)

    return record


def get_file_record(file_id: str) -> Optional[dict]:
    return _load_index().get(file_id)


def list_files(context: Optional[str] = None, ref_id: Optional[str] = None) -> list:
    index = _load_index()
    records = list(index.values())
    if context:
        records = [r for r in records if r.get("context") == context]
    if ref_id:
        records = [r for r in records if r.get("ref_id") == ref_id]
    return sorted(records, key=lambda r: r.get("uploaded_at", ""), reverse=True)


def delete_file(file_id: str) -> bool:
    index = _load_index()
    record = index.get(file_id)
    if not record:
        return False
    path = record.get("path", "")
    if os.path.exists(path):
        os.remove(path)
    del index[file_id]
    _save_index(index)
    return True
