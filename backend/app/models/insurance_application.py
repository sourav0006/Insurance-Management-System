from enum import Enum as PyEnum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Numeric, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.insurance_plan import InsurancePlan


class ApplicationStatus(str, PyEnum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class InsuranceApplication(Base):
    __tablename__ = "insurance_applications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("insurance_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    insurer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    application_number: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True
    )

    # Personal Information
    date_of_birth: Mapped[str] = mapped_column(String(50), nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    pincode: Mapped[str] = mapped_column(String(20), nullable=False)

    # Nominee Details
    nominee_name: Mapped[str] = mapped_column(String(255), nullable=False)
    nominee_relationship: Mapped[str] = mapped_column(String(100), nullable=False)
    nominee_phone: Mapped[str] = mapped_column(String(50), nullable=False)

    # Additional Data
    occupation: Mapped[str] = mapped_column(String(100), nullable=False)
    annual_income: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    health_declaration: Mapped[str] = mapped_column(Text, nullable=False)

    # Workflow Status
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, name="application_status_enum"),
        nullable=False,
        default=ApplicationStatus.SUBMITTED,
        index=True
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships
    customer: Mapped["User"] = relationship("User", foreign_keys=[customer_id])
    insurer: Mapped["User"] = relationship("User", foreign_keys=[insurer_id])
    plan: Mapped["InsurancePlan"] = relationship("InsurancePlan")
