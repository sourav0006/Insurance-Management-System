from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.insurer_profile import InsurerProfile, InsurerVerificationStatus
from app.schemas.admin import InsurerAdminDetailResponse


def _build_insurer_detail_response(user: User, profile: InsurerProfile) -> InsurerAdminDetailResponse:
    return InsurerAdminDetailResponse(
        id=profile.id,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        company_name=profile.company_name,
        license_number=profile.license_number,
        description=profile.description,
        contact_email=profile.contact_email,
        contact_phone=profile.contact_phone,
        address=profile.address,
        city=profile.city,
        state=profile.state,
        pincode=profile.pincode,
        verification_status=profile.verification_status,
        rejection_reason=profile.rejection_reason,
        created_at=profile.created_at,
    )


def list_insurers(
    db: Session,
    status_filter: Optional[InsurerVerificationStatus] = None
) -> List[InsurerAdminDetailResponse]:
    """List all insurer accounts, optionally filtered by verification status."""
    query = db.query(User, InsurerProfile).join(
        InsurerProfile, User.id == InsurerProfile.user_id
    ).filter(User.role == UserRole.INSURER)

    if status_filter:
        query = query.filter(InsurerProfile.verification_status == status_filter)

    query = query.order_by(InsurerProfile.created_at.desc())
    results = query.all()

    return [_build_insurer_detail_response(user, profile) for user, profile in results]


def get_insurer_detail(db: Session, insurer_id: int) -> InsurerAdminDetailResponse:
    """Get detailed information for a single insurer by user ID or profile ID."""
    result = db.query(User, InsurerProfile).join(
        InsurerProfile, User.id == InsurerProfile.user_id
    ).filter(
        User.role == UserRole.INSURER,
        (User.id == insurer_id) | (InsurerProfile.id == insurer_id)
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insurer with ID {insurer_id} not found."
        )

    user, profile = result
    return _build_insurer_detail_response(user, profile)


def approve_insurer(db: Session, insurer_id: int) -> InsurerAdminDetailResponse:
    """Approve a PENDING or REJECTED/SUSPENDED insurer account."""
    result = db.query(User, InsurerProfile).join(
        InsurerProfile, User.id == InsurerProfile.user_id
    ).filter(
        User.role == UserRole.INSURER,
        (User.id == insurer_id) | (InsurerProfile.id == insurer_id)
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insurer with ID {insurer_id} not found."
        )

    user, profile = result
    profile.verification_status = InsurerVerificationStatus.APPROVED
    profile.rejection_reason = None
    db.commit()
    db.refresh(profile)

    # Notify insurer
    from app.services.notification_service import create_notification
    create_notification(
        db=db,
        user_id=user.id,
        title="Insurer Account Approved",
        message="Your insurer account has been approved.",
        notification_type="INSURER_APPROVED"
    )

    return _build_insurer_detail_response(user, profile)


def reject_insurer(db: Session, insurer_id: int, reason: str) -> InsurerAdminDetailResponse:
    """Reject a PENDING insurer account with a required rejection reason."""
    result = db.query(User, InsurerProfile).join(
        InsurerProfile, User.id == InsurerProfile.user_id
    ).filter(
        User.role == UserRole.INSURER,
        (User.id == insurer_id) | (InsurerProfile.id == insurer_id)
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insurer with ID {insurer_id} not found."
        )

    user, profile = result
    profile.verification_status = InsurerVerificationStatus.REJECTED
    profile.rejection_reason = reason
    db.commit()
    db.refresh(profile)

    # Notify insurer
    from app.services.notification_service import create_notification
    create_notification(
        db=db,
        user_id=user.id,
        title="Insurer Account Rejected",
        message=f"Your insurer account has been rejected. Reason: {reason}",
        notification_type="INSURER_REJECTED"
    )

    return _build_insurer_detail_response(user, profile)


def suspend_insurer(db: Session, insurer_id: int, reason: str) -> InsurerAdminDetailResponse:
    """Suspend an APPROVED insurer account with a required suspension reason."""
    result = db.query(User, InsurerProfile).join(
        InsurerProfile, User.id == InsurerProfile.user_id
    ).filter(
        User.role == UserRole.INSURER,
        (User.id == insurer_id) | (InsurerProfile.id == insurer_id)
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insurer with ID {insurer_id} not found."
        )

    user, profile = result
    profile.verification_status = InsurerVerificationStatus.SUSPENDED
    profile.rejection_reason = reason
    db.commit()
    db.refresh(profile)

    return _build_insurer_detail_response(user, profile)


def reinstate_insurer(db: Session, insurer_id: int) -> InsurerAdminDetailResponse:
    """Reinstate a REJECTED or SUSPENDED insurer back to APPROVED status."""
    return approve_insurer(db, insurer_id)


def get_dashboard_stats(db: Session):
    """Retrieve platform summary statistics using efficient DB count queries."""
    from sqlalchemy import func
    from app.models.insurance_plan import InsurancePlan, PlanStatus
    from app.models.insurance_application import InsuranceApplication
    from app.models.policy import Policy, PolicyStatus
    from app.models.query import CustomerQuery, QueryStatus
    from app.schemas.admin import AdminDashboardStatsResponse

    total_users = db.query(func.count(User.id)).scalar() or 0
    total_customers = db.query(func.count(User.id)).filter(User.role == UserRole.CUSTOMER).scalar() or 0
    total_insurers = db.query(func.count(User.id)).filter(User.role == UserRole.INSURER).scalar() or 0
    pending_insurers = db.query(func.count(InsurerProfile.id)).filter(
        InsurerProfile.verification_status == InsurerVerificationStatus.PENDING
    ).scalar() or 0
    approved_insurers = db.query(func.count(InsurerProfile.id)).filter(
        InsurerProfile.verification_status == InsurerVerificationStatus.APPROVED
    ).scalar() or 0
    active_plans = db.query(func.count(InsurancePlan.id)).filter(
        InsurancePlan.status == PlanStatus.ACTIVE
    ).scalar() or 0
    total_applications = db.query(func.count(InsuranceApplication.id)).scalar() or 0
    active_policies = db.query(func.count(Policy.id)).filter(
        Policy.status == PolicyStatus.ACTIVE
    ).scalar() or 0
    open_queries = db.query(func.count(CustomerQuery.id)).filter(
        CustomerQuery.status == QueryStatus.OPEN
    ).scalar() or 0

    return AdminDashboardStatsResponse(
        total_users=total_users,
        total_customers=total_customers,
        total_insurers=total_insurers,
        pending_insurers=pending_insurers,
        approved_insurers=approved_insurers,
        active_plans=active_plans,
        total_applications=total_applications,
        active_policies=active_policies,
        open_queries=open_queries,
    )

