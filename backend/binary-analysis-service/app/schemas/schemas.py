from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BinaryScanBase(BaseModel):
    agent_id: str
    file_path: str
    file_name: str
    sha256: str
    md5: Optional[str]
    file_size: Optional[int]
    entropy: Optional[float]
    file_type: Optional[str]
    is_signed: Optional[bool]
    yara_matched: Optional[bool]
    malware_score: Optional[int]

class BinaryScan(BinaryScanBase):
    id: str
    scanned_at: datetime

    class Config:
        orm_mode = True

class YaraScanRequest(BaseModel):
    file_path: str