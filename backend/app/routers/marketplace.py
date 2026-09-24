from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.marketplace import MarketplacePlanResponse, MarketplacePaginatedResponse
from app.services.marketplace_service import MarketplaceService

router = APIRouter(prefix="/marketplace", tags=["Customer Marketplace"])


@router.get(
    "/plans",
    response_model=MarketplacePaginatedResponse,
    summary="Browse visible ACTIVE insurance plans from APPROVED insurers"
)
def list_marketplace_plans(
    search: Optional[str] = Query(None, description="Search term for plan name, code, category, or insurer company name"),
    category: Optional[str] = Query(None, description="Filter by plan category"),
    min_premium: Optional[float] = Query(None, ge=0, description="Minimum premium amount"),
    max_premium: Optional[float] = Query(None, ge=0, description="Maximum premium amount"),
    min_coverage: Optional[float] = Query(None, ge=0, description="Minimum coverage amount"),
    max_coverage: Optional[float] = Query(None, ge=0, description="Maximum coverage amount"),
    premium_frequency: Optional[str] = Query(None, description="Filter by premium frequency (e.g. Monthly, Yearly)"),
    sort_by: str = Query("newest", description="Sort order: newest, premium_low, premium_high, coverage_low, coverage_high"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(12, ge=1, le=50, description="Page size (max 50)"),
    db: Session = Depends(get_db)
):
    """
    Publicly accessible endpoint returning only ACTIVE plans from APPROVED insurers.
    Enforces premium and coverage filter validations.
    """
    # Validation checks
    if min_premium is not None and max_premium is not None:
        if min_premium > max_premium:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="min_premium cannot be greater than max_premium"
            )

    if min_coverage is not None and max_coverage is not None:
        if min_coverage > max_coverage:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="min_coverage cannot be greater than max_coverage"
            )

    allowed_sort_by = {"newest", "premium_low", "premium_high", "coverage_low", "coverage_high"}
    if sort_by not in allowed_sort_by:
        sort_by = "newest"

    return MarketplaceService.list_plans(
        db=db,
        search=search,
        category=category,
        min_premium=min_premium,
        max_premium=max_premium,
        min_coverage=min_coverage,
        max_coverage=max_coverage,
        premium_frequency=premium_frequency,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/plans/{plan_id}",
    response_model=MarketplacePlanResponse,
    summary="Get details of a publicly visible insurance plan"
)
def get_marketplace_plan_details(
    plan_id: int,
    db: Session = Depends(get_db)
):
    """
    Publicly accessible endpoint returning single visible plan detail.
    Returns HTTP 404 if plan is not found, draft, inactive, or belongs to a non-approved insurer.
    """
    plan = MarketplaceService.get_plan_detail(db=db, plan_id=plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance plan not found or not available"
        )
    return plan
