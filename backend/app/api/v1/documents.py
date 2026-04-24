from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.document import DocumentOut
from app.services import case_service, document_service

router = APIRouter()


@router.post("/{case_id}/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    case_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    case = await case_service.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if case.status not in ("intake", "blocked"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot upload to a case with status '{case.status}'",
        )
    try:
        return await document_service.save_upload(db, case_id, file)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/{case_id}", response_model=List[DocumentOut])
async def list_documents(case_id: str, db: AsyncSession = Depends(get_db)):
    case = await case_service.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return await document_service.get_documents(db, case_id)
