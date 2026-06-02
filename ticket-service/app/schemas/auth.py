from pydantic import BaseModel, validator
from app.models.user import UserRole
from typing import Union


class CurrentUser(BaseModel):
    id: Union[int, str]  # ✅ accepts both "1" and 1
    email: str
    role: UserRole

    @validator("id", pre=True)
    def parse_id(cls, v):
        try:
            return int(v)
        except (ValueError, TypeError):
            return v