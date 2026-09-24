from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.insurer_profile import InsurerProfile
from app.schemas.insurer import InsurerProfileResponse, InsurerProfileUpdateRequest


def get_my_insurer_profile(db: Session, user_id: int) -> InsurerProfileResponse:
    """Fetch the authenticated insurer's profile."""
    result = db.query(User, InsurerProfile).join(
        InsurerProfile, User.id == InsurerProfile.user_id
    ).filter(User.id == user_id).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurer profile not found"
        )

    user, profile = result

    return InsurerProfileResponse(
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
        updated_at=profile.updated_at,
    )


def update_my_insurer_profile(
    db: Session,
    user_id: int,
    request: InsurerProfileUpdateRequest
) -> InsurerProfileResponse:
    """Update allowed fields of the authenticated insurer's profile."""
    user = db.query(User).filter(User.id == user_id).first()
    profile = db.query(InsurerProfile).filter(InsurerProfile.user_id == user_id).first()

    if not user or not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurer profile not found"
        )

    # Update User fields if provided
    if request.full_name is not None:
        user.full_name = request.full_name
    if request.phone is not None:
        user.phone = request.phone

    # Update Profile fields if provided (Excludes license_number & verification_status)
    if request.company_name is not None:
        profile.company_name = request.company_name
    if request.description is not None:
        profile.description = request.description
    if request.contact_email is not None:
        profile.contact_email = request.contact_email
    if request.contact_phone is not None:
        profile.contact_phone = request.contact_phone
    if request.address is not None:
        profile.address = request.address
    if request.city is not None:
        profile.city = request.city
    if request.state is not None:
        profile.state = request.state
    if request.pincode is not None:
        profile.pincode = request.pincode

    db.commit()
    db.refresh(user)
    db.refresh(profile)

    return get_my_insurer_profile(db, user_id)
