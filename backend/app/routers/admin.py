from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_admin
from app.models.user import User
from app.models.insurer_profile import InsurerVerificationStatus
from app.schemas.admin import (
    InsurerAdminDetailResponse,
    CustomerAdminListItemResponse,
    CustomerAdminDetailResponse,
    InsurerRejectRequest,
    InsurerSuspendRequest,
    AdminDashboardStatsResponse,
)
from app.services.admin_service import (
    list_insurers,
    get_insurer_detail,
    approve_insurer,
    reject_insurer,
    suspend_insurer,
    reinstate_insurer,
    list_customers,
    get_customer_detail,
    suspend_customer,
    unsuspend_customer,
    get_dashboard_stats,
)

router = APIRouter(prefix="/admin", tags=["Admin Management"])


@router.get(
    "/dashboard/stats",
    response_model=AdminDashboardStatsResponse,
    summary="Get platform summary statistics for admin dashboard"
)
def get_dashboard_stats_endpoint(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return get_dashboard_stats(db)


# Insurer Management Endpoints
@router.get(
    "/insurers",
    response_model=List[InsurerAdminDetailResponse],
    summary="List all insurer vendors with optional verification status filter"
)
def list_insurers_endpoint(
    status: Optional[InsurerVerificationStatus] = Query(None, description="Filter by verification status"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return list_insurers(db, status)


@router.get(
    "/insurers/{insurer_id}",
    response_model=InsurerAdminDetailResponse,
    summary="Get detailed information for a single insurer"
)
def get_insurer_detail_endpoint(
    insurer_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return get_insurer_detail(db, insurer_id)


@router.patch(
    "/insurers/{insurer_id}/approve",
    response_model=InsurerAdminDetailResponse,
    summary="Approve a pending insurer account"
)
def approve_insurer_endpoint(
    insurer_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return approve_insurer(db, insurer_id)


@router.patch(
    "/insurers/{insurer_id}/reject",
    response_model=InsurerAdminDetailResponse,
    summary="Reject a pending insurer account with reason"
)
def reject_insurer_endpoint(
    insurer_id: int,
    request: InsurerRejectRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return reject_insurer(db, insurer_id, request.rejection_reason)


@router.patch(
    "/insurers/{insurer_id}/suspend",
    response_model=InsurerAdminDetailResponse,
    summary="Suspend an active approved insurer account with reason"
)
def suspend_insurer_endpoint(
    insurer_id: int,
    request: InsurerSuspendRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return suspend_insurer(db, insurer_id, request.suspension_reason)


@router.patch(
    "/insurers/{insurer_id}/reinstate",
    response_model=InsurerAdminDetailResponse,
    summary="Reinstate a rejected or suspended insurer account to approved status"
)
def reinstate_insurer_endpoint(
    insurer_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return reinstate_insurer(db, insurer_id)


# Customer Management Endpoints
@router.get(
    "/customers",
    response_model=List[CustomerAdminListItemResponse],
    summary="List all customer accounts with search capability"
)
def list_customers_endpoint(
    search: Optional[str] = Query(None, description="Search by customer name, email, or phone"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return list_customers(db, search)


@router.get(
    "/customers/{customer_id}",
    response_model=CustomerAdminDetailResponse,
    summary="Get full customer profile, applications, policies, claims, and queries"
)
def get_customer_detail_endpoint(
    customer_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return get_customer_detail(db, customer_id)


@router.patch(
    "/customers/{customer_id}/suspend",
    response_model=CustomerAdminListItemResponse,
    summary="Suspend a customer account"
)
def suspend_customer_endpoint(
    customer_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return suspend_customer(db, customer_id)


@router.patch(
    "/customers/{customer_id}/unsuspend",
    response_model=CustomerAdminListItemResponse,
    summary="Unsuspend / reinstate a customer account"
)
def unsuspend_customer_endpoint(
    customer_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return unsuspend_customer(db, customer_id)
