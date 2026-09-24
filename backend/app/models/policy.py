from enum import Enum as PyEnum
from datetime import datetime, date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Numeric, Integer, Date, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.insurance_plan import InsurancePlan
    from app.models.insurance_application import InsuranceApplication


class PolicyStatus(str, PyEnum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    policy_number: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True
    )
    application_id: Mapped[int] = mapped_column(
        ForeignKey("insurance_applications.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    insurer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("insurance_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Dates
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Financial Terms Snapshot
    coverage_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    premium_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    premium_frequency: Mapped[str] = mapped_column(String(50), nullable=False)
    policy_term_years: Mapped[int] = mapped_column(Integer, nullable=False)

    # Status Lifecycle
    status: Mapped[PolicyStatus] = mapped_column(
        Enum(PolicyStatus, name="policy_status_enum"),
        nullable=False,
        default=PolicyStatus.ACTIVE,
        index=True
    )
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
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
    application: Mapped["InsuranceApplication"] = relationship("InsuranceApplication")
    customer: Mapped["User"] = relationship("User", foreign_keys=[customer_id])
    insurer: Mapped["User"] = relationship("User", foreign_keys=[insurer_id])
    plan: Mapped["InsurancePlan"] = relationship("InsurancePlan")
