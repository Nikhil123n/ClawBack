from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.database_url, echo=settings.environment == "development")

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Idempotent column additions — safe to run on every startup
        await conn.execute(text("ALTER TABLE cases ADD COLUMN IF NOT EXISTS attorney_brief TEXT"))
        await conn.execute(text("ALTER TABLE findings ADD COLUMN IF NOT EXISTS source_type VARCHAR(30) DEFAULT 'DOCUMENT_EVIDENCE'"))
        await conn.execute(text("ALTER TABLE findings ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) DEFAULT 'document_supported'"))
        await conn.execute(text("ALTER TABLE findings ADD COLUMN IF NOT EXISTS peer_benchmark TEXT"))
