from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.case import Case
from app.schemas.case import CaseCreate, CaseUpdate


async def create_case(db: AsyncSession, payload: CaseCreate) -> Case:
    case = Case(title=payload.title, tip_text=payload.tip_text)
    db.add(case)
    await db.flush()  # get the generated id without committing
    await db.refresh(case)
    return case


async def get_case(db: AsyncSession, case_id: str) -> Optional[Case]:
    result = await db.execute(select(Case).where(Case.id == case_id))
    return result.scalar_one_or_none()


async def list_cases(db: AsyncSession) -> List[Case]:
    result = await db.execute(select(Case).order_by(Case.created_at.desc()))
    return list(result.scalars().all())


async def update_case(db: AsyncSession, case: Case, payload: CaseUpdate) -> Case:
    if payload.title is not None:
        case.title = payload.title
    if payload.attorney_approved is not None:
        case.attorney_approved = payload.attorney_approved
        case.status = "approved" if payload.attorney_approved else "rejected"
    case.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(case)
    return case
