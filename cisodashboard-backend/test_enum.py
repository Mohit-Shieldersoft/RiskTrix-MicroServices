"""Test SQLAlchemy enum loading directly."""
import sys
sys.path.insert(0, '/app')

# Test UserRole enum directly
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    CISO = "ciso"

# Test how SQLAlchemy resolves the enum
try:
    result = UserRole("admin")
    print(f"UserRole('admin') = {result!r}")
except ValueError as e:
    print(f"UserRole('admin') FAILED: {e}")

try:
    result = UserRole("ADMIN")
    print(f"UserRole('ADMIN') = {result!r}")
except ValueError as e:
    print(f"UserRole('ADMIN') FAILED (expected): {e}")

# Test SQLAlchemy Enum type
from sqlalchemy import Enum as SQLAEnum

sqla_enum = SQLAEnum(UserRole)
print(f"SQLAlchemy enum enums: {sqla_enum.enums}")

# Test result_processor
import sqlalchemy
dialect = sqlalchemy.dialects.postgresql.dialect()
proc = sqla_enum.result_processor(dialect, None)
if proc:
    try:
        result = proc("admin")
        print(f"result_processor('admin') = {result!r}")
    except Exception as e:
        print(f"result_processor('admin') FAILED: {e}")
else:
    print("No result_processor found")
