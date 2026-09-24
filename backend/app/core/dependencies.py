from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.core.security import decode_access_token
from app.models.user import User, UserRole
from app.models.insurer_profile import InsurerProfile, InsurerVerificationStatus

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_db() -> Generator:
    """Dependency to provide a database session for request lifecycle."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to extract, decode, and validate the JWT Bearer token.
    Verifies that the user exists in the database and that the account is active.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your account is currently inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_customer(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to restrict route access strictly to CUSTOMER role."""
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer privileges required to access this resource."
        )
    return current_user


def require_insurer(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to restrict route access strictly to INSURER role.
    Checks verification status: REJECTED or SUSPENDED insurers are denied access.
    """
    if current_user.role != UserRole.INSURER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insurer privileges required to access this resource."
        )

    profile = db.query(InsurerProfile).filter(InsurerProfile.user_id == current_user.id).first()
    if profile:
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

    return current_user


def require_approved_insurer(
    current_user: User = Depends(require_insurer),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to restrict route access strictly to APPROVED INSURER vendors.
    Pending insurers can authenticate to see their pending state, but cannot perform business operations.
    """
    profile = db.query(InsurerProfile).filter(InsurerProfile.user_id == current_user.id).first()
    if not profile or profile.verification_status != InsurerVerificationStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Approved insurer status required to perform this action."
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to restrict route access strictly to ADMIN role."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required to access this resource."
        )
    return current_user
