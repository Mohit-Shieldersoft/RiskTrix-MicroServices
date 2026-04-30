import asyncio
import os
os.environ.setdefault('SECRET_KEY', 'test-secret')

from app.db.session import engine
from sqlalchemy import text

async def test():
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text('SELECT 1'))
            print('DB connected OK')
            result = await conn.execute(text(
                "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
            ))
            tables = [r[0] for r in result]
            print('Tables:', tables)
    except Exception as e:
        print('DB ERROR:', type(e).__name__, str(e))

asyncio.run(test())
