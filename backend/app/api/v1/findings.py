from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.finding import FindingOut
from app.services import case_service, pipeline_service

router = APIRouter()


@router.get("/{case_id}", response_model=List[FindingOut])
async def get_findings(case_id: str, db: AsyncSession = Depends(get_db)):
    case = await case_service.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return await pipeline_service.get_findings(db, case_id)
