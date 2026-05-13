from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class IntegrityBaselineBase(BaseModel):
    agent_id: str
    file_path: str
    sha256_baseline: str

class IntegrityBaseline(IntegrityBaselineBase):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True

class IntegrityCheck(BaseModel):
    agent_id: str
    file_path: str
    sha256_current: str

class IntegrityEventBase(BaseModel):
    agent_id: str
    file_path: str
    sha256_expected: str
    sha256_actual: str
    event_type: str

class IntegrityEvent(IntegrityEventBase):
    id: str
    detected_at: datetime

    class Config:
        orm_mode = True