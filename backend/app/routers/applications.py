from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_customer, require_approved_insurer
from app.models.user import User
from app.models.insurance_application import ApplicationStatus
from app.schemas.application import (
    ApplicationCreateRequest,
    ApplicationStatusUpdateRequest,
    ApplicationResponse,
    ApplicationListItemResponse,
)
from app.services.application_service import ApplicationService

router = APIRouter(tags=["Insurance Applications"])


# ==========================================
# CUSTOMER APPLICATION ENDPOINTS
# ==========================================

@router.post(
    "/applications",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new insurance application (Customers only)"
)
def create_application_endpoint(
    request: ApplicationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """
    Submits a new insurance application for an ACTIVE plan from an APPROVED insurer.
    Enforces duplicate check (409 Conflict if active application exists).
    """
    return ApplicationService.create_application(db, current_user, request)


@router.get(
    "/applications/my",
    response_model=List[ApplicationListItemResponse],
    summary="List all applications submitted by logged-in customer"
)
def list_my_applications_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """
    Returns concise list of all applications submitted by authenticated customer.
    """
    return ApplicationService.list_customer_applications(db, current_user.id)


@router.get(
    "/applications/my/{application_id}",
    response_model=ApplicationResponse,
    summary="Get details of a specific application owned by logged-in customer"
)
def get_my_application_detail_endpoint(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """
    Returns full details of an application owned by authenticated customer (404 otherwise).
    """
    return ApplicationService.get_customer_application_detail(db, current_user.id, application_id)


# ==========================================
# INSURER APPLICATION REVIEW ENDPOINTS
# ==========================================

@router.get(
    "/insurer/applications",
    response_model=List[ApplicationListItemResponse],
    summary="List applications for plans owned by logged-in approved insurer"
)
def list_insurer_applications_endpoint(
    status_filter: Optional[ApplicationStatus] = Query(None, alias="status", description="Filter applications by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved_insurer)
):
    """
    Returns applications submitted for plans owned by current approved insurer.
    Supports optional status query filter.
    """
    return ApplicationService.list_insurer_applications(db, current_user.id, status_filter)


@router.get(
    "/insurer/applications/{application_id}",
    response_model=ApplicationResponse,
    summary="Get detailed application for plan owned by logged-in approved insurer"
)
def get_insurer_application_detail_endpoint(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved_insurer)
):
    """
    Returns full application details if owned by current approved insurer (404 otherwise).
    """
    return ApplicationService.get_insurer_application_detail(db, current_user.id, application_id)


@router.patch(
    "/insurer/applications/{application_id}/status",
    response_model=ApplicationResponse,
    summary="Update application review status (Approved insurers only)"
)
def update_application_status_endpoint(
    application_id: int,
    request: ApplicationStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved_insurer)
):
    """
    Advances application status (SUBMITTED -> UNDER_REVIEW/REJECTED, UNDER_REVIEW -> APPROVED/REJECTED).
    Requires non-empty rejection_reason when status is REJECTED.
    """
    return ApplicationService.update_application_status(db, current_user.id, application_id, request)
