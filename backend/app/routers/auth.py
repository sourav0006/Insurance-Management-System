from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import (
    CustomerRegisterRequest,
    CustomerRegisterResponse,
    InsurerRegisterRequest,
    InsurerRegisterResponse,
    LoginRequest,
    TokenResponse,
    UserAuthResponse,
)
from app.services.auth_service import (
    register_customer,
    register_insurer,
    login_user,
    get_current_user_profile,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and issue JWT token"
)
def login_endpoint(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user using email and password.
    Determines role from database and returns JWT access_token.
    """
    return login_user(db, request)


@router.get(
    "/me",
    response_model=UserAuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Fetch current authenticated user profile"
)
def get_me_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns authenticated user profile verified from PostgreSQL.
    """
    return get_current_user_profile(current_user, db)


@router.post(
    "/register/customer",
    response_model=CustomerRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new Customer account"
)
def register_customer_endpoint(
    request: CustomerRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Public registration endpoint for Customers.
    """
    return register_customer(db, request)


@router.post(
    "/register/insurer",
    response_model=InsurerRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new Insurer Vendor account"
)
def register_insurer_endpoint(
    request: InsurerRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Public registration endpoint for Insurer Vendors.
    """
    return register_insurer(db, request)
