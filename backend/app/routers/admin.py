from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_admin
from app.models.user import User
from app.models.insurer_profile import InsurerVerificationStatus
from app.schemas.admin import (
    InsurerAdminDetailResponse,
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
    get_dashboard_stats,
)

router = APIRouter(prefix="/admin", tags=["Admin Insurer Verification"])


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
