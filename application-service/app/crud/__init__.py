"""Application Service CRUD Operations"""

from app.crud.crud_application import application
from app.crud.crud_vulnerability import vulnerability

__all__ = ["application", "vulnerability"]
