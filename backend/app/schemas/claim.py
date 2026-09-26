from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.models.claim import ClaimStatus


class ClaimCreate(BaseModel):
    policy_id: int
    claim_type: str = Field(..., min_length=2, max_length=100, description="Type of claim (e.g., Medical, Accident, Damage)")
    incident_date: date
    claim_amount: float = Field(..., gt=0, description="Requested claim amount")
    description: str = Field(..., min_length=5, description="Detailed description of the claim incident")

    @field_validator("claim_type", "description", mode="before")
    def strip_whitespace(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("String fields cannot be blank.")
        return v


class ClaimReview(BaseModel):
    status: ClaimStatus
    insurer_response: Optional[str] = Field(None, description="Insurer comments/remarks")
    rejection_reason: Optional[str] = Field(None, description="Required when status is REJECTED")

    @field_validator("insurer_response", "rejection_reason", mode="before")
    def strip_string(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v


class ClaimResponse(BaseModel):
    id: int
    claim_number: str
    customer_id: int
    insurer_id: int
    policy_id: int
    claim_type: str
    incident_date: date
    claim_amount: float
    description: str
    status: ClaimStatus
    rejection_reason: Optional[str] = None
    insurer_response: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Convenient relational fields for frontend display
    policy_number: Optional[str] = None
    plan_name: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    insurer_name: Optional[str] = None
    company_name: Optional[str] = None

    class Config:
        from_attributes = True
