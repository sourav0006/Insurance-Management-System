from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class MarketplacePlanResponse(BaseModel):
    id: int
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
    insurer_id: int
    company_name: str

    model_config = ConfigDict(from_attributes=True)


class MarketplacePaginatedResponse(BaseModel):
    items: List[MarketplacePlanResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
