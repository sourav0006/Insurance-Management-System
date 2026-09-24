from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_insurer, require_approved_insurer
from app.models.user import User
from app.schemas.plan import PlanCreateRequest, PlanUpdateRequest, PlanResponse
from app.services.plan_service import (
    create_plan,
    list_my_plans,
    get_my_plan,
    update_my_plan,
    delete_my_plan,
)

router = APIRouter(prefix="/plans", tags=["Insurance Plans (Insurer CRUD)"])


@router.post(
    "",
    response_model=PlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new insurance plan (Approved Insurers Only)"
)
def create_plan_endpoint(
    request: PlanCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved_insurer)
):
    """
    Creates a new insurance product plan.
    Requires APPROVED insurer verification status.
    `insurer_id` is automatically bound from authenticated user token.
    """
    return create_plan(db, current_user.id, request)


@router.get(
    "/my",
    response_model=List[PlanResponse],
    summary="List all insurance plans created by current insurer"
)
def list_my_plans_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_insurer)
):
    """
    Returns plans belonging strictly to the authenticated insurer.
    """
    return list_my_plans(db, current_user.id)


@router.get(
    "/my/{plan_id}",
    response_model=PlanResponse,
    summary="Get details of a specific plan owned by current insurer"
)
def get_my_plan_endpoint(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_insurer)
):
    """
    Returns single plan details if owned by current insurer (returns 404 otherwise).
    """
    return get_my_plan(db, current_user.id, plan_id)


@router.patch(
    "/my/{plan_id}",
    response_model=PlanResponse,
    summary="Update an existing insurance plan owned by current insurer"
)
def update_my_plan_endpoint(
    plan_id: int,
    request: PlanUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved_insurer)
):
    """
    Updates plan details or status. Approved insurers only.
    """
    return update_my_plan(db, current_user.id, plan_id, request)


@router.delete(
    "/my/{plan_id}",
    summary="Delete an insurance plan owned by current insurer"
)
def delete_my_plan_endpoint(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved_insurer)
):
    """
    Deletes an insurance plan owned by the authenticated approved insurer.
    """
    return delete_my_plan(db, current_user.id, plan_id)
