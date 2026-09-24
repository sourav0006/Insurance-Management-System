from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_insurer
from app.models.user import User
from app.schemas.insurer import InsurerProfileResponse, InsurerProfileUpdateRequest
from app.services.insurer_service import get_my_insurer_profile, update_my_insurer_profile

router = APIRouter(prefix="/insurers", tags=["Insurers"])


@router.get(
    "/me",
    response_model=InsurerProfileResponse,
    summary="Get authenticated insurer profile"
)
def get_insurer_profile_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_insurer)
):
    return get_my_insurer_profile(db, current_user.id)


@router.patch(
    "/me",
    response_model=InsurerProfileResponse,
    summary="Update authenticated insurer profile allowed fields"
)
def update_insurer_profile_endpoint(
    request: InsurerProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_insurer)
):
    return update_my_insurer_profile(db, current_user.id, request)
