"""Debug script to test user loading from DB."""
import asyncio
import sys
sys.path.insert(0, '/app')


async def test():
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select

    engine = create_async_engine(
        'postgresql+asyncpg://postgres:password@micro-ciso-postgres:5432/risktrix_db'
    )
    Session = sessionmaker(engine, class_=AsyncSession)

    async with Session() as db:
        from app.models.models import User, UserRole
        print("UserRole values:", [r.value for r in UserRole])

        result = await db.execute(
            select(User).where(User.email == 'admin@risktrix.com')
        )
        user = result.scalar_one_or_none()
        if user:
            print(f"User found: {user.email}, role={user.role}")
            from app.core.security import SecurityManager
            ok = SecurityManager.verify_password('Admin@123', user.hashed_password)
            print(f"Password verify: {ok}")
        else:
            print("User not found!")


asyncio.run(test())
