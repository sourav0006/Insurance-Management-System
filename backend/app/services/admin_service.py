from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.models.user import User, UserRole
from app.models.insurer_profile import InsurerProfile, InsurerVerificationStatus
from app.models.customer_profile import CustomerProfile
from app.models.insurance_plan import InsurancePlan
from app.models.insurance_application import InsuranceApplication
from app.models.policy import Policy
from app.models.query import CustomerQuery
from app.models.claim import Claim
from app.schemas.admin import (
    InsurerAdminDetailResponse,
    CustomerAdminListItemResponse,
    CustomerAdminDetailResponse,
    AdminDashboardStatsResponse,
)


def _build_insurer_detail_response(db: Session, user: User, profile: InsurerProfile) -> InsurerAdminDetailResponse:
    # Gather plans
    plans = db.query(InsurancePlan).filter(InsurancePlan.insurer_id == user.id).all()
    plans_data = [
        {
            "id": p.id,
            "plan_name": p.plan_name,
            "plan_code": p.plan_code,
            "category": p.category,
            "status": p.status,
            "coverage_amount": float(p.coverage_amount),
            "premium_amount": float(p.premium_amount),
            "created_at": p.created_at
        }
        for p in plans
    ]

    # Gather policies
    policies = db.query(Policy).filter(Policy.insurer_id == user.id).all()
    policies_data = [
        {
            "id": pol.id,
            "policy_number": pol.policy_number,
            "customer_name": pol.customer.full_name if pol.customer else None,
            "customer_email": pol.customer.email if pol.customer else None,
            "plan_name": pol.plan.plan_name if pol.plan else None,
            "status": pol.status,
            "start_date": pol.start_date,
            "end_date": pol.end_date,
            "coverage_amount": float(pol.coverage_amount),
            "premium_amount": float(pol.premium_amount),
        }
        for pol in policies
    ]

    # Gather claims
    claims = db.query(Claim).filter(Claim.insurer_id == user.id).all()
    claims_data = [
        {
            "id": cl.id,
            "claim_number": cl.claim_number,
            "customer_name": cl.customer.full_name if cl.customer else None,
            "policy_number": cl.policy.policy_number if cl.policy else None,
            "claim_type": cl.claim_type,
            "claim_amount": float(cl.claim_amount),
            "status": cl.status,
            "incident_date": cl.incident_date,
            "submitted_at": cl.submitted_at,
        }
        for cl in claims
    ]

    # Unique covered customers count
    covered_customers_count = db.query(func.count(func.distinct(Policy.customer_id))).filter(
        Policy.insurer_id == user.id
    ).scalar() or 0

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
        plans=plans_data,
        policies=policies_data,
        claims=claims_data,
        covered_customers_count=covered_customers_count,
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

    return [_build_insurer_detail_response(db, user, profile) for user, profile in results]


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
    return _build_insurer_detail_response(db, user, profile)


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

    return _build_insurer_detail_response(db, user, profile)


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

    return _build_insurer_detail_response(db, user, profile)


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

    return _build_insurer_detail_response(db, user, profile)


def reinstate_insurer(db: Session, insurer_id: int) -> InsurerAdminDetailResponse:
    """Reinstate a REJECTED or SUSPENDED insurer back to APPROVED status."""
    return approve_insurer(db, insurer_id)


# Admin Customer Management Functions
def list_customers(db: Session, search: Optional[str] = None) -> List[CustomerAdminListItemResponse]:
    """List all customer accounts with search capability and summary policy/claim counts."""
    query = db.query(User).filter(User.role == UserRole.CUSTOMER)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term),
                User.phone.ilike(search_term)
            )
        )

    customers = query.order_by(User.created_at.desc()).all()
    results = []

    for user in customers:
        profile = user.customer_profile
        policies_count = db.query(func.count(Policy.id)).filter(Policy.customer_id == user.id).scalar() or 0
        claims_count = db.query(func.count(Claim.id)).filter(Claim.customer_id == user.id).scalar() or 0

        results.append(
            CustomerAdminListItemResponse(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                phone=user.phone,
                is_active=user.is_active,
                created_at=user.created_at,
                address=profile.address if profile else None,
                city=profile.city if profile else None,
                state=profile.state if profile else None,
                pincode=profile.pincode if profile else None,
                policies_count=policies_count,
                claims_count=claims_count,
            )
        )

    return results


def get_customer_detail(db: Session, customer_id: int) -> CustomerAdminDetailResponse:
    """Retrieve full detail for a customer including applications, policies, claims, and queries."""
    user = db.query(User).filter(User.id == customer_id, User.role == UserRole.CUSTOMER).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )

    # Customer profile
    prof = user.customer_profile
    profile_data = None
    if prof:
        profile_data = {
            "date_of_birth": str(prof.date_of_birth) if prof.date_of_birth else None,
            "gender": prof.gender,
            "address": prof.address,
            "city": prof.city,
            "state": prof.state,
            "pincode": prof.pincode,
            "nominee_name": prof.nominee_name,
            "nominee_relationship": prof.nominee_relationship,
            "nominee_phone": prof.nominee_phone,
        }

    # Applications
    apps = db.query(InsuranceApplication).filter(InsuranceApplication.customer_id == user.id).all()
    applications_data = [
        {
            "id": a.id,
            "application_number": a.application_number,
            "plan_name": a.plan.plan_name if a.plan else None,
            "insurer_company": a.plan.insurer.insurer_profile.company_name if (a.plan and a.plan.insurer and a.plan.insurer.insurer_profile) else None,
            "status": a.status,
            "created_at": a.created_at
        }
        for a in apps
    ]

    # Policies
    pols = db.query(Policy).filter(Policy.customer_id == user.id).all()
    policies_data = [
        {
            "id": p.id,
            "policy_number": p.policy_number,
            "plan_name": p.plan.plan_name if p.plan else None,
            "insurer_company": p.insurer.insurer_profile.company_name if (p.insurer and p.insurer.insurer_profile) else None,
            "insurer_name": p.insurer.full_name if p.insurer else None,
            "status": p.status,
            "start_date": str(p.start_date),
            "end_date": str(p.end_date),
            "coverage_amount": float(p.coverage_amount),
            "premium_amount": float(p.premium_amount),
        }
        for p in pols
    ]

    # Claims
    cls = db.query(Claim).filter(Claim.customer_id == user.id).all()
    claims_data = [
        {
            "id": c.id,
            "claim_number": c.claim_number,
            "policy_number": c.policy.policy_number if c.policy else None,
            "insurer_company": c.insurer.insurer_profile.company_name if (c.insurer and c.insurer.insurer_profile) else None,
            "claim_type": c.claim_type,
            "claim_amount": float(c.claim_amount),
            "status": c.status,
            "incident_date": str(c.incident_date),
            "submitted_at": c.submitted_at
        }
        for c in cls
    ]

    # Queries
    qrs = db.query(CustomerQuery).filter(CustomerQuery.customer_id == user.id).all()
    queries_data = [
        {
            "id": q.id,
            "subject": q.subject,
            "status": q.status,
            "created_at": q.created_at,
            "insurer_company": q.insurer.insurer_profile.company_name if (q.insurer and q.insurer.insurer_profile) else None,
        }
        for q in qrs
    ]

    return CustomerAdminDetailResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        is_active=user.is_active,
        created_at=user.created_at,
        profile=profile_data,
        applications=applications_data,
        policies=policies_data,
        claims=claims_data,
        queries=queries_data,
    )


def suspend_customer(db: Session, customer_id: int) -> CustomerAdminListItemResponse:
    """Suspend customer account by setting is_active = False."""
    user = db.query(User).filter(User.id == customer_id, User.role == UserRole.CUSTOMER).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )

    user.is_active = False
    db.commit()
    db.refresh(user)

    profile = user.customer_profile
    policies_count = db.query(func.count(Policy.id)).filter(Policy.customer_id == user.id).scalar() or 0
    claims_count = db.query(func.count(Claim.id)).filter(Claim.customer_id == user.id).scalar() or 0

    return CustomerAdminListItemResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        is_active=user.is_active,
        created_at=user.created_at,
        address=profile.address if profile else None,
        city=profile.city if profile else None,
        state=profile.state if profile else None,
        pincode=profile.pincode if profile else None,
        policies_count=policies_count,
        claims_count=claims_count,
    )


def unsuspend_customer(db: Session, customer_id: int) -> CustomerAdminListItemResponse:
    """Reinstate customer account by setting is_active = True."""
    user = db.query(User).filter(User.id == customer_id, User.role == UserRole.CUSTOMER).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )

    user.is_active = True
    db.commit()
    db.refresh(user)

    profile = user.customer_profile
    policies_count = db.query(func.count(Policy.id)).filter(Policy.customer_id == user.id).scalar() or 0
    claims_count = db.query(func.count(Claim.id)).filter(Claim.customer_id == user.id).scalar() or 0

    return CustomerAdminListItemResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        is_active=user.is_active,
        created_at=user.created_at,
        address=profile.address if profile else None,
        city=profile.city if profile else None,
        state=profile.state if profile else None,
        pincode=profile.pincode if profile else None,
        policies_count=policies_count,
        claims_count=claims_count,
    )


def get_dashboard_stats(db: Session):
    """Retrieve platform summary statistics using efficient DB count queries."""
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
        InsurancePlan.status == "ACTIVE"
    ).scalar() or 0
    total_applications = db.query(func.count(InsuranceApplication.id)).scalar() or 0
    active_policies = db.query(func.count(Policy.id)).filter(
        Policy.status == "ACTIVE"
    ).scalar() or 0
    open_queries = db.query(func.count(CustomerQuery.id)).filter(
        CustomerQuery.status == "OPEN"
    ).scalar() or 0
    total_claims = db.query(func.count(Claim.id)).scalar() or 0

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
        total_claims=total_claims,
    )
