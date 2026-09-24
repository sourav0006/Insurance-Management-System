from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str
) -> Notification:
    """Create an in-app notification for a specified user."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def get_user_notifications(db: Session, user_id: int) -> List[Notification]:
    """Retrieve all notifications for a user, newest first."""
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )


def mark_notification_read(db: Session, user_id: int, notification_id: int) -> Notification:
    """Mark a specific notification as read after validating ownership."""
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        )
        .first()
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found."
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_notifications_read(db: Session, user_id: int) -> int:
    """Mark all unread notifications for a user as read."""
    updated_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        )
        .update({"is_read": True}, synchronize_session=False)
    )
    db.commit()
    return updated_count
