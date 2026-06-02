"""One-shot script to reset admin password bypassing the user CRUD."""
import sys
sys.path.insert(0, '/app')

from app.core.security import SecurityManager
from sqlalchemy import create_engine, text

db_url = 'postgresql://postgres:password@micro-ciso-postgres:5432/risktrix_db'
engine = create_engine(db_url)
new_hash = SecurityManager.get_password_hash('Admin@123')

with engine.connect() as conn:
    result = conn.execute(
        text("UPDATE users SET hashed_password = :h WHERE email = :email"),
        {"h": new_hash, "email": "admin@risktrix.com"}
    )
    conn.commit()
    row = conn.execute(
        text("SELECT id, email, role FROM users WHERE email = :email"),
        {"email": "admin@risktrix.com"}
    ).fetchone()
    if row:
        print(f"OK: id={row[0]}, email={row[1]}, role={row[2]}")
        print(f"Hash set to: {new_hash[:15]}...")
    else:
        print("ERROR: user not found")
