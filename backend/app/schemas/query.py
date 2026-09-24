from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.query import QueryStatus


class ApprovedInsurerResponse(BaseModel):
    insurer_id: int
    company_name: str

    model_config = ConfigDict(from_attributes=True)


class QueryCreate(BaseModel):
    insurer_id: int
    subject: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)


class QueryResponseText(BaseModel):
    response: str = Field(..., min_length=1)


class QueryResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    insurer_id: int
    company_name: str
    subject: str
    message: str
    status: QueryStatus
    response: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    responded_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
