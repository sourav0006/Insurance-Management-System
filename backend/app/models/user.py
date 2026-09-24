from enum import Enum as PyEnum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

if TYPE_CHECKING:
    from app.models.customer_profile import CustomerProfile
    from app.models.insurer_profile import InsurerProfile


class UserRole(str, PyEnum):
    CUSTOMER = "CUSTOMER"
    INSURER = "INSURER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role_enum"),
        nullable=False,
        index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
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

    # 1-to-1 relationships
    customer_profile: Mapped[Optional["CustomerProfile"]] = relationship(
        "CustomerProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    insurer_profile: Mapped[Optional["InsurerProfile"]] = relationship(
        "InsurerProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
