from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.insurance_plan import InsurancePlan, PlanStatus
from app.schemas.plan import PlanCreateRequest, PlanUpdateRequest, PlanResponse


def create_plan(db: Session, insurer_id: int, request: PlanCreateRequest) -> PlanResponse:
    """Create a new insurance plan for the authenticated approved insurer."""
    # Check duplicate plan_code
    existing_plan = db.query(InsurancePlan).filter(
        InsurancePlan.plan_code == request.plan_code
    ).first()

    if existing_plan:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An insurance plan with code '{request.plan_code}' already exists."
        )

    plan = InsurancePlan(
        insurer_id=insurer_id,
        plan_name=request.plan_name,
        plan_code=request.plan_code,
        category=request.category,
        description=request.description,
        coverage_amount=request.coverage_amount,
        premium_amount=request.premium_amount,
        premium_frequency=request.premium_frequency,
        policy_term_years=request.policy_term_years,
        eligibility_min_age=request.eligibility_min_age,
        eligibility_max_age=request.eligibility_max_age,
        status=request.status or PlanStatus.DRAFT,
    )

    db.add(plan)
    db.commit()
    db.refresh(plan)

    return PlanResponse.model_validate(plan)


def list_my_plans(db: Session, insurer_id: int) -> List[PlanResponse]:
    """List all insurance plans created by the authenticated insurer."""
    plans = db.query(InsurancePlan).filter(
        InsurancePlan.insurer_id == insurer_id
    ).order_by(InsurancePlan.created_at.desc()).all()

    return [PlanResponse.model_validate(p) for p in plans]


def get_my_plan(db: Session, insurer_id: int, plan_id: int) -> PlanResponse:
    """Fetch details of a single plan owned by the authenticated insurer."""
    plan = db.query(InsurancePlan).filter(
        InsurancePlan.id == plan_id,
        InsurancePlan.insurer_id == insurer_id
    ).first()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insurance plan with ID {plan_id} not found."
        )

    return PlanResponse.model_validate(plan)


def update_my_plan(
    db: Session,
    insurer_id: int,
    plan_id: int,
    request: PlanUpdateRequest
) -> PlanResponse:
    """Update fields/status of a plan owned by the authenticated insurer."""
    plan = db.query(InsurancePlan).filter(
        InsurancePlan.id == plan_id,
        InsurancePlan.insurer_id == insurer_id
    ).first()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insurance plan with ID {plan_id} not found."
        )

    if request.plan_name is not None:
        plan.plan_name = request.plan_name
    if request.category is not None:
        plan.category = request.category
    if request.description is not None:
        plan.description = request.description
    if request.coverage_amount is not None:
        plan.coverage_amount = request.coverage_amount
    if request.premium_amount is not None:
        plan.premium_amount = request.premium_amount
    if request.premium_frequency is not None:
        plan.premium_frequency = request.premium_frequency
    if request.policy_term_years is not None:
        plan.policy_term_years = request.policy_term_years
    if request.eligibility_min_age is not None:
        plan.eligibility_min_age = request.eligibility_min_age
    if request.eligibility_max_age is not None:
        plan.eligibility_max_age = request.eligibility_max_age
    if request.status is not None:
        plan.status = request.status

    db.commit()
    db.refresh(plan)

    return PlanResponse.model_validate(plan)


def delete_my_plan(db: Session, insurer_id: int, plan_id: int) -> dict:
    """Delete a plan owned by the authenticated insurer."""
    plan = db.query(InsurancePlan).filter(
        InsurancePlan.id == plan_id,
        InsurancePlan.insurer_id == insurer_id
    ).first()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insurance plan with ID {plan_id} not found."
        )

    db.delete(plan)
    db.commit()

    return {"message": f"Insurance plan '{plan.plan_name}' ({plan.plan_code}) deleted successfully."}
