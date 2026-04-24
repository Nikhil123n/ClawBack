import os
from datetime import datetime, timezone
from typing import List

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.document import Document


ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt", "csv"}


def _ext(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


async def save_upload(db: AsyncSession, case_id: str, file: UploadFile) -> Document:
    ext = _ext(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type '.{ext}' not allowed. Accepted: {ALLOWED_EXTENSIONS}")

    # Save file to disk
    dest_dir = os.path.join(settings.upload_dir, case_id)
    os.makedirs(dest_dir, exist_ok=True)
    file_path = os.path.join(dest_dir, file.filename)

    content = await file.read()
    if len(content) > settings.max_upload_size_mb * 1024 * 1024:
        raise ValueError(f"File exceeds {settings.max_upload_size_mb}MB limit")

    with open(file_path, "wb") as f:
        f.write(content)

    doc = Document(
        case_id=case_id,
        filename=file.filename,
        file_path=file_path,
        doc_type=ext,
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    return doc


async def get_documents(db: AsyncSession, case_id: str) -> List[Document]:
    result = await db.execute(
        select(Document).where(Document.case_id == case_id).order_by(Document.uploaded_at)
    )
    return list(result.scalars().all())
