from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_customer, require_insurer, require_approved_insurer, require_admin
from app.models.user import User
from app.models.claim import ClaimStatus
from app.schemas.claim import ClaimCreate, ClaimReview, ClaimResponse
from app.services.claim_service import (
    create_claim,
    get_customer_claims,
    get_customer_claim_by_id,
    get_insurer_claims,
    get_insurer_claim_by_id,
    review_claim,
    get_admin_claims,
    get_admin_claim_by_id,
)

router = APIRouter(prefix="", tags=["Claims"])


# Customer Claim Endpoints
@router.post(
    "/claims",
    response_model=ClaimResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new insurance claim against an active policy"
)
def create_claim_endpoint(
    claim_in: ClaimCreate,
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    return create_claim(db, customer_user, claim_in)


@router.get(
    "/claims/my",
    response_model=List[ClaimResponse],
    summary="List all claims submitted by current customer"
)
def get_customer_claims_endpoint(
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    return get_customer_claims(db, customer_user.id)


@router.get(
    "/claims/my/{claim_id}",
    response_model=ClaimResponse,
    summary="Get claim details for current customer"
)
def get_customer_claim_by_id_endpoint(
    claim_id: int,
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    return get_customer_claim_by_id(db, customer_user.id, claim_id)


# Insurer Claim Endpoints
@router.get(
    "/insurer/claims",
    response_model=List[ClaimResponse],
    summary="List all claims assigned to current insurer"
)
def get_insurer_claims_endpoint(
    status: Optional[ClaimStatus] = Query(None, description="Filter by claim status"),
    search: Optional[str] = Query(None, description="Search by claim number, customer name, policy number"),
    db: Session = Depends(get_db),
    insurer_user: User = Depends(require_insurer)
):
    return get_insurer_claims(db, insurer_user.id, status, search)


@router.get(
    "/insurer/claims/{claim_id}",
    response_model=ClaimResponse,
    summary="Get detailed claim information for current insurer"
)
def get_insurer_claim_by_id_endpoint(
    claim_id: int,
    db: Session = Depends(get_db),
    insurer_user: User = Depends(require_insurer)
):
    return get_insurer_claim_by_id(db, insurer_user.id, claim_id)


@router.patch(
    "/insurer/claims/{claim_id}/review",
    response_model=ClaimResponse,
    summary="Review claim and update status/remarks/rejection reason"
)
def review_claim_endpoint(
    claim_id: int,
    review_in: ClaimReview,
    db: Session = Depends(get_db),
    insurer_user: User = Depends(require_approved_insurer)
):
    return review_claim(db, insurer_user, claim_id, review_in)


# Admin Claim Endpoints
@router.get(
    "/admin/claims",
    response_model=List[ClaimResponse],
    summary="Platform-wide claims visibility for admin"
)
def get_admin_claims_endpoint(
    status: Optional[ClaimStatus] = Query(None, description="Filter by claim status"),
    search: Optional[str] = Query(None, description="Search by claim number, customer name, policy number"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return get_admin_claims(db, status, search)


@router.get(
    "/admin/claims/{claim_id}",
    response_model=ClaimResponse,
    summary="View platform-wide claim detail for admin"
)
def get_admin_claim_by_id_endpoint(
    claim_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return get_admin_claim_by_id(db, claim_id)
