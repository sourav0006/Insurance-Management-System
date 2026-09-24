from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator, model_validator
from app.models.insurance_plan import PlanStatus


class PlanCreateRequest(BaseModel):
    plan_name: str = Field(..., min_length=1, max_length=255, description="Plan name")
    plan_code: str = Field(..., min_length=1, max_length=100, description="Plan unique code")
    category: str = Field(..., min_length=1, max_length=100, description="Plan category (Health, Life, Vehicle, etc.)")
    description: Optional[str] = None

    coverage_amount: float = Field(..., gt=0, description="Coverage amount must be greater than 0")
    premium_amount: float = Field(..., gt=0, description="Premium amount must be greater than 0")
    premium_frequency: str = Field(..., min_length=1, max_length=50, description="Frequency (e.g., Monthly, Yearly)")
    policy_term_years: int = Field(..., gt=0, description="Policy term years must be greater than 0")

    eligibility_min_age: Optional[int] = Field(None, ge=0, description="Minimum eligibility age")
    eligibility_max_age: Optional[int] = Field(None, ge=0, description="Maximum eligibility age")

    status: Optional[PlanStatus] = Field(PlanStatus.DRAFT, description="Initial plan status")

    @field_validator("plan_name", "category", "premium_frequency", mode="before")
    def strip_whitespace(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("Field cannot be empty")
        return v

    @field_validator("plan_code", mode="before")
    def normalize_plan_code(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @model_validator(mode="after")
    def validate_age_range(self) -> "PlanCreateRequest":
        if self.eligibility_min_age is not None and self.eligibility_max_age is not None:
            if self.eligibility_min_age > self.eligibility_max_age:
                raise ValueError("Minimum eligibility age cannot be greater than maximum eligibility age")
        return self


class PlanUpdateRequest(BaseModel):
    plan_name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None

    coverage_amount: Optional[float] = Field(None, gt=0)
    premium_amount: Optional[float] = Field(None, gt=0)
    premium_frequency: Optional[str] = Field(None, min_length=1, max_length=50)
    policy_term_years: Optional[int] = Field(None, gt=0)

    eligibility_min_age: Optional[int] = Field(None, ge=0)
    eligibility_max_age: Optional[int] = Field(None, ge=0)

    status: Optional[PlanStatus] = None

    @field_validator("plan_name", "category", "premium_frequency", mode="before")
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v

    @model_validator(mode="after")
    def validate_age_range(self) -> "PlanUpdateRequest":
        if self.eligibility_min_age is not None and self.eligibility_max_age is not None:
            if self.eligibility_min_age > self.eligibility_max_age:
                raise ValueError("Minimum eligibility age cannot be greater than maximum eligibility age")
        return self


class PlanResponse(BaseModel):
    id: int
    insurer_id: int
    plan_name: str
    plan_code: str
    category: str
    description: Optional[str] = None

    coverage_amount: float
    premium_amount: float
    premium_frequency: str
    policy_term_years: int

    eligibility_min_age: Optional[int] = None
    eligibility_max_age: Optional[int] = None

    status: PlanStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
