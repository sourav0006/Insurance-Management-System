from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models.insurance_application import ApplicationStatus


class ApplicationCreateRequest(BaseModel):
    plan_id: int = Field(..., description="ID of the selected insurance plan")
    date_of_birth: str = Field(..., min_length=1, max_length=50, description="Date of birth")
    gender: str = Field(..., min_length=1, max_length=20, description="Gender")
    address: str = Field(..., min_length=1, max_length=255, description="Residential address")
    city: str = Field(..., min_length=1, max_length=100, description="City")
    state: str = Field(..., min_length=1, max_length=100, description="State")
    pincode: str = Field(..., min_length=1, max_length=20, description="Pincode")

    nominee_name: str = Field(..., min_length=1, max_length=255, description="Nominee full name")
    nominee_relationship: str = Field(..., min_length=1, max_length=100, description="Relationship to nominee")
    nominee_phone: str = Field(..., min_length=1, max_length=50, description="Nominee phone number")

    occupation: str = Field(..., min_length=1, max_length=100, description="Customer occupation")
    annual_income: float = Field(..., ge=0, description="Annual income (must be >= 0)")
    health_declaration: str = Field(..., min_length=1, description="Health declaration statement")

    @field_validator(
        "date_of_birth", "gender", "address", "city", "state", "pincode",
        "nominee_name", "nominee_relationship", "nominee_phone",
        "occupation", "health_declaration", mode="before"
    )
    def strip_and_validate_non_empty(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("Field cannot be empty or blank")
        return v


class ApplicationStatusUpdateRequest(BaseModel):
    status: ApplicationStatus = Field(..., description="New application status")
    rejection_reason: Optional[str] = Field(None, description="Reason for rejection if status is REJECTED")

    @field_validator("rejection_reason", mode="before")
    def strip_rejection_reason(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v


class ApplicationPlanInfo(BaseModel):
    plan_id: int
    plan_name: str
    plan_code: str
    category: str
    premium_amount: float
    premium_frequency: str
    coverage_amount: float

    model_config = ConfigDict(from_attributes=True)


class ApplicationInsurerInfo(BaseModel):
    insurer_id: int
    company_name: str

    model_config = ConfigDict(from_attributes=True)


class ApplicationCustomerInfo(BaseModel):
    customer_id: int
    full_name: str
    email: str
    phone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ApplicationResponse(BaseModel):
    id: int
    application_number: str
    status: ApplicationStatus
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    plan: ApplicationPlanInfo
    insurer: ApplicationInsurerInfo
    customer: ApplicationCustomerInfo

    date_of_birth: str
    gender: str
    address: str
    city: str
    state: str
    pincode: str
    nominee_name: str
    nominee_relationship: str
    nominee_phone: str
    occupation: str
    annual_income: float
    health_declaration: str

    model_config = ConfigDict(from_attributes=True)


class ApplicationListItemResponse(BaseModel):
    id: int
    application_number: str
    plan_id: int
    plan_name: str
    category: str
    insurer_id: int
    company_name: str
    customer_name: str
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    status: ApplicationStatus
    rejection_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
