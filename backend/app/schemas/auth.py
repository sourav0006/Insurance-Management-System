import re
from datetime import date
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from app.models.user import UserRole
from app.models.insurer_profile import InsurerVerificationStatus


def validate_password_complexity(password: str) -> str:
    """Validate password strength: min 8 chars, 1 uppercase, 1 lowercase, 1 number."""
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"[0-9]", password):
        raise ValueError("Password must contain at least one number")
    return password


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole

    class Config:
        from_attributes = True


class UserAuthResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole
    is_active: bool
    verification_status: Optional[InsurerVerificationStatus] = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")

    @field_validator("email", mode="before")
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserAuthResponse


class CustomerRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Full Name")
    email: EmailStr = Field(..., description="Email address")
    phone: Optional[str] = Field(None, max_length=50)
    password: str = Field(..., description="Password")
    confirm_password: str = Field(..., description="Confirm Password")

    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, max_length=20)

    nominee_name: Optional[str] = Field(None, max_length=255)
    nominee_relationship: Optional[str] = Field(None, max_length=100)
    nominee_phone: Optional[str] = Field(None, max_length=50)

    @field_validator("full_name", "phone", "gender", "address", "city", "state", "pincode", "nominee_name", "nominee_relationship", "nominee_phone", mode="before")
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v

    @field_validator("email", mode="before")
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("password")
    def validate_password(cls, v: str) -> str:
        return validate_password_complexity(v)

    @field_validator("date_of_birth")
    def validate_dob(cls, v: Optional[date]) -> Optional[date]:
        if v and v > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return v

    @model_validator(mode="after")
    def check_passwords_match(self) -> "CustomerRegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class CustomerRegisterResponse(BaseModel):
    message: str
    user: UserResponse


class InsurerRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    password: str
    confirm_password: str

    company_name: str = Field(..., min_length=1, max_length=255)
    license_number: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=50)

    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, max_length=20)

    @field_validator("full_name", "company_name", "phone", "contact_phone", "address", "city", "state", "pincode", mode="before")
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v

    @field_validator("license_number", mode="before")
    def normalize_license(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("email", "contact_email", mode="before")
    def normalize_email(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str) and v.strip():
            return v.strip().lower()
        return None

    @field_validator("password")
    def validate_password(cls, v: str) -> str:
        return validate_password_complexity(v)

    @model_validator(mode="after")
    def check_passwords_match(self) -> "InsurerRegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class InsurerRegisterResponse(BaseModel):
    message: str
    user: UserResponse
    verification_status: InsurerVerificationStatus
