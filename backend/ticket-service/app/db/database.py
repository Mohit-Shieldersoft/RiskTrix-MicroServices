import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Use environment variable if available, otherwise fallback to localhost for local development
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:password@postgres:5432/risktrix_db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()