from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.insurer_profile import InsurerVerificationStatus


class InsurerProfileResponse(BaseModel):
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
    updated_at: datetime

    class Config:
        from_attributes = True


class InsurerProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, max_length=20)

    @field_validator("full_name", "phone", "company_name", "contact_phone", "address", "city", "state", "pincode", mode="before")
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v
