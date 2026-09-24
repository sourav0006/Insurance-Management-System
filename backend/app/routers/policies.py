from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user, require_customer, require_approved_insurer
from app.models.user import User
from app.models.policy import PolicyStatus
from app.schemas.policy import (
    PolicyCreateRequest,
    PolicyStatusUpdateRequest,
    PolicyResponse,
    PolicyListItemResponse,
)
from app.services.policy_service import PolicyService

router = APIRouter(tags=["Policies"])


# ==========================================
# INSURER POLICY MANAGEMENT ENDPOINTS
# ==========================================

@router.post(
    "/policies",
    response_model=PolicyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Issue a new policy from an APPROVED application (Approved Insurers only)"
)
def create_policy_endpoint(
    request: PolicyCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved_insurer)
):
    """
    Creates a new ACTIVE policy from an APPROVED application owned by current approved insurer.
    Snapshots plan financial terms, calculates end_date, and enforces duplicate check (409 Conflict).
    """
    return PolicyService.create_policy(db, current_user, request)


@router.get(
    "/insurer/policies",
    response_model=List[PolicyListItemResponse],
    summary="List all policies issued by logged-in approved insurer"
)
def list_insurer_policies_endpoint(
    status_filter: Optional[PolicyStatus] = Query(None, alias="status", description="Filter policies by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved_insurer)
):
    """
    Returns concise list of policies issued by current approved insurer.
    Supports optional status query filter.
    """
    return PolicyService.list_insurer_policies(db, current_user.id, status_filter)


@router.get(
    "/insurer/policies/{policy_id}",
    response_model=PolicyResponse,
    summary="Get details of a specific policy owned by logged-in approved insurer"
)
def get_insurer_policy_detail_endpoint(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved_insurer)
):
    """
    Returns full policy details for a policy owned by current approved insurer (404 otherwise).
    """
    return PolicyService.get_insurer_policy_detail(db, current_user.id, policy_id)


@router.patch(
    "/insurer/policies/{policy_id}/status",
    response_model=PolicyResponse,
    summary="Update policy status (e.g. CANCELLED) (Approved Insurers only)"
)
def update_policy_status_endpoint(
    policy_id: int,
    request: PolicyStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved_insurer)
):
    """
    Cancels an active policy. Requires a non-empty cancellation_reason.
    """
    return PolicyService.update_policy_status(db, current_user.id, policy_id, request)


# ==========================================
# CUSTOMER POLICY ENDPOINTS
# ==========================================

@router.get(
    "/policies/my",
    response_model=List[PolicyListItemResponse],
    summary="List all active/expired policies belonging to logged-in customer"
)
def list_my_policies_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """
    Returns list of policies issued to authenticated customer.
    """
    return PolicyService.list_customer_policies(db, current_user.id)


@router.get(
    "/policies/my/{policy_id}",
    response_model=PolicyResponse,
    summary="Get details of a specific policy owned by logged-in customer"
)
def get_my_policy_detail_endpoint(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """
    Returns full policy details for a policy owned by authenticated customer (404 otherwise).
    """
    return PolicyService.get_customer_policy_detail(db, current_user.id, policy_id)


# ==========================================
# COMMON HELPER ENDPOINT
# ==========================================

@router.get(
    "/policies/by-application/{application_id}",
    response_model=Optional[PolicyResponse],
    summary="Find policy associated with a specific application ID"
)
def get_policy_by_application_id_endpoint(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns policy associated with the specified application_id if owned by caller, or None if no policy exists.
    """
    return PolicyService.get_policy_by_application_id(db, current_user, application_id)
