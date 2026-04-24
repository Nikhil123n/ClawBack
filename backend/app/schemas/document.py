from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DocumentOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    case_id: str
    filename: str
    doc_type: str
    page_count: Optional[int]
    parsed_at: Optional[datetime]
    uploaded_at: datetime
