import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id: Mapped[str] = mapped_column(String, ForeignKey("cases.id"), nullable=False)

    # What was found
    fraud_type: Mapped[str] = mapped_column(String(100))        # e.g. "phantom_billing"
    severity: Mapped[str] = mapped_column(String(20))            # HIGH | MEDIUM | LOW
    description: Mapped[str] = mapped_column(Text)
    citation: Mapped[str] = mapped_column(Text)                  # "document.pdf, page 3"
    confidence: Mapped[float] = mapped_column(Float)             # 0.0 – 1.0
    applicable_statutes: Mapped[Optional[str]] = mapped_column(Text)  # JSON list as string

    # Evidence classification — prevents tip-only findings from reaching HIGH
    source_type: Mapped[str] = mapped_column(
        String(30), default="DOCUMENT_EVIDENCE"
    )  # DOCUMENT_EVIDENCE | TIP_ALLEGATION | PUBLIC_DATA_EVIDENCE | AI_INFERENCE
    verification_status: Mapped[str] = mapped_column(
        String(30), default="unverified"
    )  # document_supported | unverified | public_data_supported

    # Narrative output (set by narrative_generator agent)
    attorney_brief: Mapped[Optional[str]] = mapped_column(Text)

    # Provenance — which model/prompt version produced this
    model_version: Mapped[Optional[str]] = mapped_column(String(100))
    prompt_version: Mapped[Optional[str]] = mapped_column(String(50))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    case: Mapped["Case"] = relationship("Case", back_populates="findings")  # noqa: F821
