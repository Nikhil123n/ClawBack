from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CaseCreate(BaseModel):
    title: str
    tip_text: Optional[str] = None


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    attorney_approved: Optional[bool] = None


class CaseOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    title: str
    tip_text: Optional[str]
    status: str
    confidence_floor_met: bool
    attorney_approved: Optional[bool]
    attorney_brief: Optional[str]
    created_at: datetime
    updated_at: datetime
