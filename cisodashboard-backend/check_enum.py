"""Check what enum values Python actually loads."""
import importlib.util
import sys

spec = importlib.util.spec_from_file_location("models_direct", "/app/app/models/models.py")
mod = importlib.util.module_from_spec(spec)

# Pre-populate required dependencies manually
import sqlalchemy
from sqlalchemy.orm import DeclarativeBase

class FakeBase(DeclarativeBase):
    pass

sys.modules['app'] = type(sys)('app')
sys.modules['app.db'] = type(sys)('app.db')
sys.modules['app.db.session'] = type(sys)('app.db.session')
sys.modules['app.db.session'].Base = FakeBase

try:
    spec.loader.exec_module(mod)
    print("Enum values:", [(r.name, r.value) for r in mod.UserRole])
except Exception as e:
    # Even if it fails partway, check if UserRole was defined
    if hasattr(mod, 'UserRole'):
        print("UserRole found:", [(r.name, r.value) for r in mod.UserRole])
    else:
        print("Error:", e)
        # Just read the file and parse enum manually
        with open("/app/app/models/models.py") as f:
            content = f.read()
        import re
        matches = re.findall(r'(\w+)\s*=\s*"([^"]+)"', content[:500])
        print("Raw enum defs:", matches[:10])
