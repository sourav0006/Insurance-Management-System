from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.customer_profile import CustomerProfile
from app.models.insurer_profile import InsurerProfile, InsurerVerificationStatus
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.auth import (
    CustomerRegisterRequest,
    CustomerRegisterResponse,
    InsurerRegisterRequest,
    InsurerRegisterResponse,
    LoginRequest,
    TokenResponse,
    UserAuthResponse,
    UserResponse,
)


def login_user(db: Session, request: LoginRequest) -> TokenResponse:
    """
    Authenticate a user by email and password, check account status,
    handle insurer verification status, create a JWT token, and return TokenResponse.
    """
    email_norm = request.email.strip().lower()
    user = db.query(User).filter(User.email == email_norm).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your account is currently inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    verification_status = None
    if user.role == UserRole.INSURER:
        profile = db.query(InsurerProfile).filter(InsurerProfile.user_id == user.id).first()
        if profile:
            verification_status = profile.verification_status
            if profile.verification_status == InsurerVerificationStatus.REJECTED:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your insurer registration has been rejected."
                )
            elif profile.verification_status == InsurerVerificationStatus.SUSPENDED:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your insurer account is currently suspended."
                )

    access_token = create_access_token(subject=user.id, role=user.role.value)

    user_auth = UserAuthResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        verification_status=verification_status
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_auth
    )


def get_current_user_profile(user: User, db: Session) -> UserAuthResponse:
    """
    Build the UserAuthResponse for the currently authenticated user.
    Includes verification_status if the user is an INSURER.
    """
    verification_status = None
    if user.role == UserRole.INSURER:
        profile = db.query(InsurerProfile).filter(InsurerProfile.user_id == user.id).first()
        if profile:
            verification_status = profile.verification_status

    return UserAuthResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        verification_status=verification_status
    )


def register_customer(db: Session, request: CustomerRegisterRequest) -> CustomerRegisterResponse:
    """
    Transactionally register a new Customer user and CustomerProfile.
    """
    existing_user_email = db.query(User).filter(User.email == request.email).first()
    if existing_user_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    if request.phone:
        existing_user_phone = db.query(User).filter(User.phone == request.phone).first()
        if existing_user_phone:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this phone number already exists."
            )

    try:
        user = User(
            full_name=request.full_name,
            email=request.email,
            phone=request.phone,
            password_hash=get_password_hash(request.password),
            role=UserRole.CUSTOMER,
            is_active=True,
        )
        db.add(user)
        db.flush()

        profile = CustomerProfile(
            user_id=user.id,
            date_of_birth=request.date_of_birth,
            gender=request.gender,
            address=request.address,
            city=request.city,
            state=request.state,
            pincode=request.pincode,
            nominee_name=request.nominee_name,
            nominee_relationship=request.nominee_relationship,
            nominee_phone=request.nominee_phone,
        )
        db.add(profile)
        db.commit()
        db.refresh(user)

        return CustomerRegisterResponse(
            message="Customer account created successfully.",
            user=UserResponse.model_validate(user),
        )
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during customer registration."
        )


def register_insurer(
    db: Session,
    request: InsurerRegisterRequest,
    license_document_path: Optional[str] = None
) -> InsurerRegisterResponse:
    """
    Transactionally register a new Insurer vendor user and InsurerProfile.
    """
    existing_user_email = db.query(User).filter(User.email == request.email).first()
    if existing_user_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    existing_license = db.query(InsurerProfile).filter(
        InsurerProfile.license_number == request.license_number
    ).first()
    if existing_license:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An insurer with this license number already exists."
        )

    if request.phone:
        existing_user_phone = db.query(User).filter(User.phone == request.phone).first()
        if existing_user_phone:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this phone number already exists."
            )

    try:
        user = User(
            full_name=request.full_name,
            email=request.email,
            phone=request.phone,
            password_hash=get_password_hash(request.password),
            role=UserRole.INSURER,
            is_active=True,
        )
        db.add(user)
        db.flush()

        profile = InsurerProfile(
            user_id=user.id,
            company_name=request.company_name,
            license_number=request.license_number,
            description=request.description,
            contact_email=request.contact_email,
            contact_phone=request.contact_phone,
            address=request.address,
            city=request.city,
            state=request.state,
            pincode=request.pincode,
            verification_status=InsurerVerificationStatus.PENDING,
            license_document_path=license_document_path,
        )
        db.add(profile)
        db.commit()
        db.refresh(user)

        # Notify Platform Admins
        admin_users = db.query(User).filter(User.role == UserRole.ADMIN).all()
        for admin_user in admin_users:
            from app.services.notification_service import create_notification
            create_notification(
                db=db,
                user_id=admin_user.id,
                title="New Insurer Registration",
                message="New insurer registration requires verification.",
                notification_type="INSURER_REGISTERED"
            )

        return InsurerRegisterResponse(
            message="Insurer registration submitted successfully and is pending admin verification.",
            user=UserResponse.model_validate(user),
            verification_status=profile.verification_status,
        )
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during insurer registration."
        )
