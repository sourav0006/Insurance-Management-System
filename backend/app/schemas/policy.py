from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models.policy import PolicyStatus


class PolicyCreateRequest(BaseModel):
    application_id: int = Field(..., description="ID of the approved insurance application")
    start_date: Optional[str] = Field(None, description="Optional start date (YYYY-MM-DD), defaults to today")

    @field_validator("start_date", mode="before")
    def strip_start_date(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v


class PolicyStatusUpdateRequest(BaseModel):
    status: PolicyStatus = Field(..., description="Target status: CANCELLED or EXPIRED")
    cancellation_reason: Optional[str] = Field(None, description="Reason required if status is CANCELLED")

    @field_validator("cancellation_reason", mode="before")
    def strip_cancellation_reason(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v


class PolicyPlanInfo(BaseModel):
    plan_id: int
    plan_name: str
    plan_code: str
    category: str

    model_config = ConfigDict(from_attributes=True)


class PolicyFinancialInfo(BaseModel):
    coverage_amount: float
    premium_amount: float
    premium_frequency: str
    policy_term_years: int

    model_config = ConfigDict(from_attributes=True)


class PolicyCustomerInfo(BaseModel):
    customer_id: int
    customer_name: str

    model_config = ConfigDict(from_attributes=True)


class PolicyInsurerInfo(BaseModel):
    insurer_id: int
    company_name: str

    model_config = ConfigDict(from_attributes=True)


class PolicyApplicationInfo(BaseModel):
    application_id: int
    application_number: str

    model_config = ConfigDict(from_attributes=True)


class PolicyResponse(BaseModel):
    id: int
    policy_number: str
    status: PolicyStatus
    start_date: date
    end_date: date
    cancellation_reason: Optional[str] = None
    created_at: datetime

    plan: PolicyPlanInfo
    financial: PolicyFinancialInfo
    customer: PolicyCustomerInfo
    insurer: PolicyInsurerInfo
    application: PolicyApplicationInfo

    model_config = ConfigDict(from_attributes=True)


class PolicyListItemResponse(BaseModel):
    id: int
    policy_number: str
    status: PolicyStatus
    start_date: date
    end_date: date
    coverage_amount: float
    premium_amount: float
    premium_frequency: str
    customer_name: str
    company_name: str
    plan_name: str
    application_number: str

    model_config = ConfigDict(from_attributes=True)
