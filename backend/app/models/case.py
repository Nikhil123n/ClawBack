import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    tip_text: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="intake")
    # intake | processing | review_pending | approved | rejected
    attorney_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"))
    confidence_floor_met: Mapped[bool] = mapped_column(Boolean, default=False)
    attorney_approved: Mapped[Optional[bool]] = mapped_column(Boolean)
    attorney_brief: Mapped[Optional[str]] = mapped_column(Text)  # JSON brief from narrative agent
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    attorney: Mapped["User"] = relationship("User", back_populates="cases")  # noqa: F821
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="case", cascade="all, delete-orphan")  # noqa: F821
    findings: Mapped[list["Finding"]] = relationship("Finding", back_populates="case", cascade="all, delete-orphan")  # noqa: F821
