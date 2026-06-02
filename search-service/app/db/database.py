from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Both services share the same DB — one engine is sufficient
# If they ever split to separate DBs, change ASSET_DB_URL
TICKET_DB_URL = os.getenv(
    "TICKET_DB_URL",
    "postgresql://postgres:password@postgres:5432/risktrix_db"
)
ASSET_DB_URL = os.getenv(
    "ASSET_DB_URL",
    "postgresql://postgres:postgres123@localhost:5432/risktrix_db"
)
DIRECTORY_DB_URL = os.getenv(
    "DIRECTORY_DB_URL",
    "postgresql://postgres:postgres123@localhost:5432/risktrix_db"
)
POLICY_DB_URL = os.getenv(
    "POLICY_DB_URL",
    "postgresql://postgres:postgres123@localhost:5432/risktrix_db"
)

ticket_engine = create_engine(TICKET_DB_URL)
asset_engine = create_engine(ASSET_DB_URL)
directory_engine = create_engine(DIRECTORY_DB_URL)
policy_engine = create_engine(POLICY_DB_URL)

TicketSession = sessionmaker(bind=ticket_engine)
AssetSession = sessionmaker(bind=asset_engine)
DirectorySession = sessionmaker(bind=directory_engine)
PolicySession = sessionmaker(bind=policy_engine)
