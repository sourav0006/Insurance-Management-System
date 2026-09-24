from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.services.notification_service import (
    get_user_notifications,
    mark_notification_read,
    mark_all_notifications_read,
)

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])


@router.get(
    "",
    response_model=List[NotificationResponse],
    summary="Fetch all in-app notifications for the authenticated user"
)
def get_my_notifications_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_notifications(db, current_user.id)


@router.patch(
    "/read-all",
    summary="Mark all in-app notifications as read for the authenticated user"
)
def mark_all_notifications_read_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = mark_all_notifications_read(db, current_user.id)
    return {"message": "All notifications marked as read.", "count": count}


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark a specific notification as read"
)
def mark_notification_read_endpoint(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return mark_notification_read(db, current_user.id, notification_id)
