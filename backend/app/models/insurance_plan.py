from enum import Enum as PyEnum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Numeric, Integer, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class PlanStatus(str, PyEnum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class InsurancePlan(Base):
    __tablename__ = "insurance_plans"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    insurer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    plan_name: Mapped[str] = mapped_column(String(255), nullable=False)
    plan_code: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    coverage_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    premium_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    premium_frequency: Mapped[str] = mapped_column(String(50), nullable=False)
    policy_term_years: Mapped[int] = mapped_column(Integer, nullable=False)

    eligibility_min_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    eligibility_max_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    status: Mapped[PlanStatus] = mapped_column(
        Enum(PlanStatus, name="plan_status_enum"),
        nullable=False,
        default=PlanStatus.DRAFT,
        index=True
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

    # Relationship to User (Insurer)
    insurer: Mapped["User"] = relationship("User")
