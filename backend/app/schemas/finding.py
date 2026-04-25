from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class FindingOut(BaseModel):
    model_config = {"from_attributes": True, "protected_namespaces": ()}

    id: str
    case_id: str
    fraud_type: str
    severity: str
    description: str
    citation: str
    confidence: float
    applicable_statutes: Optional[str]
    source_type: str
    verification_status: str
    peer_benchmark: Optional[str] = None
    attorney_brief: Optional[str]
    model_version: Optional[str]
    prompt_version: Optional[str]
    created_at: datetime
