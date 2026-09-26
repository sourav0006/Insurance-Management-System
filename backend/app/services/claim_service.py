import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.claim import Claim, ClaimStatus
from app.models.policy import Policy, PolicyStatus
from app.models.user import User
from app.models.insurer_profile import InsurerProfile
from app.schemas.claim import ClaimCreate, ClaimReview, ClaimResponse
from app.services.notification_service import create_notification


def _build_claim_response(claim: Claim) -> ClaimResponse:
    """Helper to convert Claim ORM model to rich ClaimResponse schema."""
    policy_number = claim.policy.policy_number if claim.policy else None
    plan_name = claim.policy.plan.plan_name if (claim.policy and claim.policy.plan) else None
    customer_name = claim.customer.full_name if claim.customer else None
    customer_email = claim.customer.email if claim.customer else None
    insurer_name = claim.insurer.full_name if claim.insurer else None

    company_name = None
    if claim.insurer and claim.insurer.insurer_profile:
        company_name = claim.insurer.insurer_profile.company_name

    return ClaimResponse(
        id=claim.id,
        claim_number=claim.claim_number,
        customer_id=claim.customer_id,
        insurer_id=claim.insurer_id,
        policy_id=claim.policy_id,
        claim_type=claim.claim_type,
        incident_date=claim.incident_date,
        claim_amount=float(claim.claim_amount),
        description=claim.description,
        status=claim.status,
        rejection_reason=claim.rejection_reason,
        insurer_response=claim.insurer_response,
        submitted_at=claim.submitted_at,
        reviewed_at=claim.reviewed_at,
        created_at=claim.created_at,
        updated_at=claim.updated_at,
        policy_number=policy_number,
        plan_name=plan_name,
        customer_name=customer_name,
        customer_email=customer_email,
        insurer_name=insurer_name,
        company_name=company_name,
    )


def create_claim(db: Session, customer_user: User, claim_in: ClaimCreate) -> ClaimResponse:
    """Submit a new insurance claim for an active policy owned by the customer."""
    policy = db.query(Policy).filter(Policy.id == claim_in.policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found."
        )

    # Ownership check
    if policy.customer_id != customer_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only file claims against your own policies."
        )

    # Active policy status check
    if policy.status != PolicyStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Claims can only be filed against active policies."
        )

    # Generate unique claim number: CLM-YYYYMMDD-XXXX
    date_prefix = datetime.now(timezone.utc).strftime("%Y%m%d")
    unique_suffix = uuid.uuid4().hex[:6].upper()
    claim_number = f"CLM-{date_prefix}-{unique_suffix}"

    claim = Claim(
        claim_number=claim_number,
        customer_id=customer_user.id,
        insurer_id=policy.insurer_id,
        policy_id=policy.id,
        claim_type=claim_in.claim_type,
        incident_date=claim_in.incident_date,
        claim_amount=claim_in.claim_amount,
        description=claim_in.description,
        status=ClaimStatus.SUBMITTED,
        submitted_at=datetime.now(timezone.utc),
    )

    db.add(claim)
    db.commit()
    db.refresh(claim)

    # Notify insurer
    create_notification(
        db=db,
        user_id=policy.insurer_id,
        title="New Insurance Claim Filed",
        message=f"Customer {customer_user.full_name} filed claim {claim.claim_number} for Policy {policy.policy_number}.",
        notification_type="CLAIM_SUBMITTED"
    )

    return _build_claim_response(claim)


def get_customer_claims(db: Session, customer_id: int) -> List[ClaimResponse]:
    """Retrieve all claims submitted by a customer."""
    claims = (
        db.query(Claim)
        .filter(Claim.customer_id == customer_id)
        .order_by(Claim.created_at.desc())
        .all()
    )
    return [_build_claim_response(c) for c in claims]


def get_customer_claim_by_id(db: Session, customer_id: int, claim_id: int) -> ClaimResponse:
    """Retrieve a single claim for a customer after validating ownership."""
    claim = (
        db.query(Claim)
        .filter(Claim.id == claim_id, Claim.customer_id == customer_id)
        .first()
    )
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found."
        )
    return _build_claim_response(claim)


def get_insurer_claims(
    db: Session,
    insurer_id: int,
    status_filter: Optional[ClaimStatus] = None,
    search: Optional[str] = None
) -> List[ClaimResponse]:
    """Retrieve all claims submitted against policies issued by the insurer."""
    query = db.query(Claim).filter(Claim.insurer_id == insurer_id)

    if status_filter:
        query = query.filter(Claim.status == status_filter)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.join(User, Claim.customer_id == User.id).join(Policy, Claim.policy_id == Policy.id).filter(
            or_(
                Claim.claim_number.ilike(search_term),
                User.full_name.ilike(search_term),
                Policy.policy_number.ilike(search_term)
            )
        )

    claims = query.order_by(Claim.created_at.desc()).all()
    return [_build_claim_response(c) for c in claims]


def get_insurer_claim_by_id(db: Session, insurer_id: int, claim_id: int) -> ClaimResponse:
    """Retrieve a single claim for an insurer after validating vendor association."""
    claim = (
        db.query(Claim)
        .filter(Claim.id == claim_id, Claim.insurer_id == insurer_id)
        .first()
    )
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found."
        )
    return _build_claim_response(claim)


def review_claim(db: Session, insurer_user: User, claim_id: int, review_in: ClaimReview) -> ClaimResponse:
    """Review and transition claim status with validation and notifications."""
    claim = (
        db.query(Claim)
        .filter(Claim.id == claim_id, Claim.insurer_id == insurer_user.id)
        .first()
    )
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found."
        )

    current_status = claim.status
    target_status = review_in.status

    # Validate allowed status transitions
    allowed_transitions = {
        ClaimStatus.SUBMITTED: [ClaimStatus.UNDER_REVIEW],
        ClaimStatus.UNDER_REVIEW: [ClaimStatus.APPROVED, ClaimStatus.REJECTED],
        ClaimStatus.APPROVED: [ClaimStatus.SETTLED],
        ClaimStatus.SETTLED: [ClaimStatus.CLOSED],
    }

    if target_status != current_status:
        valid_next_statuses = allowed_transitions.get(current_status, [])
        if target_status not in valid_next_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from {current_status.value} to {target_status.value}."
            )

    # Rejection reason requirement
    if target_status == ClaimStatus.REJECTED:
        if not review_in.rejection_reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rejection reason is required when rejecting a claim."
            )
        claim.rejection_reason = review_in.rejection_reason

    if review_in.insurer_response is not None:
        claim.insurer_response = review_in.insurer_response

    claim.status = target_status
    claim.reviewed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(claim)

    # In-app notification for customer
    create_notification(
        db=db,
        user_id=claim.customer_id,
        title=f"Claim {claim.claim_number} Updated",
        message=f"Your claim {claim.claim_number} status has been updated to {target_status.value}.",
        notification_type=f"CLAIM_{target_status.value}"
    )

    return _build_claim_response(claim)


def get_admin_claims(
    db: Session,
    status_filter: Optional[ClaimStatus] = None,
    search: Optional[str] = None
) -> List[ClaimResponse]:
    """Retrieve all claims across the platform for admin visibility."""
    query = db.query(Claim)

    if status_filter:
        query = query.filter(Claim.status == status_filter)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.join(User, Claim.customer_id == User.id).join(Policy, Claim.policy_id == Policy.id).filter(
            or_(
                Claim.claim_number.ilike(search_term),
                User.full_name.ilike(search_term),
                Policy.policy_number.ilike(search_term)
            )
        )

    claims = query.order_by(Claim.created_at.desc()).all()
    return [_build_claim_response(c) for c in claims]


def get_admin_claim_by_id(db: Session, claim_id: int) -> ClaimResponse:
    """Retrieve single claim detail for admin."""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found."
        )
    return _build_claim_response(claim)
