"""Database initialization script for Application Service.

Creates database tables from SQLAlchemy models.
"""
import asyncio
from sqlalchemy import text
from app.db.session import engine, Base
from app.models import models  # Import models to register them with Base


async def init_db():
    """Initialize database tables"""
    print("🔄 Initializing database tables...")
    
    async with engine.begin() as conn:
        # Create all tables defined in Base.metadata
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database tables created successfully!")
    print(f"   Created tables: {', '.join(Base.metadata.tables.keys())}")


async def drop_all_tables():
    """Drop all tables (use with caution!)"""
    print("⚠️  Dropping all tables...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    print("✅ All tables dropped!")


async def check_tables():
    """Check what tables exist in the database"""
    print("🔍 Checking existing tables...")
    
    async with engine.connect() as conn:
        result = await conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """))
        
        tables = [row[0] for row in result]
        
        if tables:
            print(f"✅ Found {len(tables)} tables:")
            for table in tables:
                print(f"   - {table}")
        else:
            print("❌ No tables found in database")
        
        return tables


if __name__ == "__main__":
    # Run initialization
    asyncio.run(init_db())
    asyncio.run(check_tables())
