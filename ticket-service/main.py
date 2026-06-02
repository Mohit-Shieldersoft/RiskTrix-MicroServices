from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from app.api.routes import tickets, analytics
from app.db.database import Base, engine
from app.services.sla_checker import sla_check_loop

# Import all models so Base.metadata knows about them before create_all
import app.models.ticket  # noqa: F401  (Ticket, TicketComment, AssignmentLog, TicketHistory)
import app.models.outbox  # noqa: F401

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(sla_check_loop())
    yield


app = FastAPI(title="Ticket Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")