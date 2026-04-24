from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.case import CaseCreate, CaseOut, CaseUpdate
from app.services import case_service

router = APIRouter()


@router.post("/", response_model=CaseOut, status_code=status.HTTP_201_CREATED)
async def create_case(payload: CaseCreate, db: AsyncSession = Depends(get_db)):
    return await case_service.create_case(db, payload)


@router.get("/", response_model=List[CaseOut])
async def list_cases(db: AsyncSession = Depends(get_db)):
    return await case_service.list_cases(db)


@router.get("/{case_id}", response_model=CaseOut)
async def get_case(case_id: str, db: AsyncSession = Depends(get_db)):
    case = await case_service.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/{case_id}", response_model=CaseOut)
async def update_case(case_id: str, payload: CaseUpdate, db: AsyncSession = Depends(get_db)):
    case = await case_service.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return await case_service.update_case(db, case, payload)
