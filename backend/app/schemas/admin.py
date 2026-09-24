from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.models.insurer_profile import InsurerVerificationStatus


class InsurerAdminDetailResponse(BaseModel):
    id: int  # Insurer Profile ID
    user_id: int
    full_name: str
    email: str
    phone: Optional[str] = None

    company_name: str
    license_number: str
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    verification_status: InsurerVerificationStatus
    rejection_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InsurerRejectRequest(BaseModel):
    rejection_reason: str = Field(..., min_length=1, description="Reason for rejection")

    @field_validator("rejection_reason", mode="before")
    def strip_whitespace(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("Rejection reason cannot be empty")
        return v


class InsurerSuspendRequest(BaseModel):
    suspension_reason: str = Field(..., min_length=1, description="Reason for suspension")

    @field_validator("suspension_reason", mode="before")
    def strip_whitespace(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("Suspension reason cannot be empty")
        return v


class AdminDashboardStatsResponse(BaseModel):
    total_users: int
    total_customers: int
    total_insurers: int
    pending_insurers: int
    approved_insurers: int
    active_plans: int
    total_applications: int
    active_policies: int
    open_queries: int

