import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Any

from app.core.database import get_db
from app.schemas.case import CaseOut
from app.services import case_service, pipeline_service

router = APIRouter()


class PipelineStatusOut(BaseModel):
    case_id: str
    status: str
    confidence_floor_met: bool
    finding_count: Optional[int] = None
    high_finding_count: Optional[int] = None
    attorney_brief: Optional[Any] = None  # parsed JSON or None


@router.post("/{case_id}/run", response_model=CaseOut)
async def run_pipeline(case_id: str, db: AsyncSession = Depends(get_db)):
    case = await case_service.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if case.status == "processing":
        raise HTTPException(status_code=409, detail="Pipeline already running for this case")
    if case.status in ("approved", "rejected"):
        raise HTTPException(status_code=409, detail=f"Case is already {case.status}")
    try:
        updated = await pipeline_service.run_pipeline(db, case)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{case_id}/status", response_model=PipelineStatusOut)
async def pipeline_status(case_id: str, db: AsyncSession = Depends(get_db)):
    case = await case_service.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    findings = await pipeline_service.get_findings(db, case_id)
    high_count = sum(1 for f in findings if f.severity == "HIGH")

    brief = None
    if case.attorney_brief:
        try:
            brief = json.loads(case.attorney_brief)
        except json.JSONDecodeError:
            brief = case.attorney_brief

    return PipelineStatusOut(
        case_id=case.id,
        status=case.status,
        confidence_floor_met=case.confidence_floor_met,
        finding_count=len(findings),
        high_finding_count=high_count,
        attorney_brief=brief,
    )
