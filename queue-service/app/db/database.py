import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Queue service reads outbox_events from the ticket DB
# Use environment variable if available, otherwise fallback to localhost for local development
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:password@postgres:5432/risktrix_db"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
