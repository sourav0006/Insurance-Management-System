from enum import Enum as PyEnum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class QueryStatus(str, PyEnum):
    OPEN = "OPEN"
    RESPONDED = "RESPONDED"
    CLOSED = "CLOSED"


class CustomerQuery(Base):
    __tablename__ = "customer_queries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
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
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[QueryStatus] = mapped_column(
        Enum(QueryStatus, name="query_status_enum"),
        nullable=False,
        default=QueryStatus.OPEN,
        index=True
    )
    response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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
    responded_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    customer: Mapped["User"] = relationship("User", foreign_keys=[customer_id])
    insurer: Mapped["User"] = relationship("User", foreign_keys=[insurer_id])
