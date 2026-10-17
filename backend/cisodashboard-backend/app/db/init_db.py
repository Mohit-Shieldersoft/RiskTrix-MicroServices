from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import logging

logger = logging.getLogger(__name__)


async def init_db(session: AsyncSession) -> None:
    """Initialize database with admin, demo user, and default organization."""
    from app.crud.crud_user import user_crud
    from app.schemas.user import UserCreate
    from app.models.models import UserRole, Organization

    logger.info("Initializing identity database...")

    superuser = await user_crud.get_by_email(session, email="admin@risktrix.com")
    if not superuser:
        logger.info("Creating superuser...")
        superuser = await user_crud.create(session, obj_in=UserCreate(
            email="admin@risktrix.com",
            username="admin",
            full_name="RiskTrix Administrator",
            password="admin123",
            is_active=True,
            is_superuser=True,
            role=UserRole.ADMIN,
        ))
        logger.info("Superuser created: %s", superuser.email)

    demo = await user_crud.get_by_email(session, email="demo@risktrix.io")
    if not demo:
        logger.info("Creating isolated demo account...")
        demo = await user_crud.create(session, obj_in=UserCreate(
            email="demo@risktrix.io",
            username="demo",
            full_name="RiskTrix Demo",
            password="Demo@1234",
            is_active=True,
            is_superuser=True,
            role=UserRole.ADMIN,
            company="RiskTrix Demo",
            profile_type="demo",
        ))
        logger.info("Demo user created: %s", demo.email)

    org = (await session.execute(select(Organization))).scalars().first()
    if not org:
        session.add(Organization(
            name="RiskTrix",
            description="Default organization",
            industry="Cybersecurity",
            contact_email="admin@risktrix.com",
        ))
        await session.commit()

    logger.info("Database initialization completed")