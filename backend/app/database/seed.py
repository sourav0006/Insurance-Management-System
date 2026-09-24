import os
import sys
import logging

# Ensure project root is in sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

ADMIN_EMAIL = "admin@insurmanage.com"
ADMIN_PASSWORD_PLAIN = "Admin@123"
ADMIN_FULL_NAME = "Platform Administrator"


def seed_admin(db: Session) -> User:
    """
    Seed exactly ONE Platform Admin account into the database.
    This operation is idempotent: if an Admin or account with admin@insurmanage.com exists,
    it returns the existing admin without creating duplicates.
    """
    # Check if admin email or admin role already exists
    existing_admin = db.query(User).filter(
        (User.email == ADMIN_EMAIL) | (User.role == UserRole.ADMIN)
    ).first()

    if existing_admin:
        logger.info(f"Platform Admin account already exists (ID: {existing_admin.id}, Email: {existing_admin.email}). Skipping seed.")
        return existing_admin

    # Create new Platform Admin user
    admin_user = User(
        full_name=ADMIN_FULL_NAME,
        email=ADMIN_EMAIL,
        password_hash=get_password_hash(ADMIN_PASSWORD_PLAIN),
        role=UserRole.ADMIN,
        is_active=True
    )

    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    logger.info(f"Successfully seeded Platform Admin account (ID: {admin_user.id}, Email: {admin_user.email}).")
    return admin_user


if __name__ == "__main__":
    from app.database.database import SessionLocal
    logging.basicConfig(level=logging.INFO)
    db = SessionLocal()
    try:
        seed_admin(db)
    finally:
        db.close()
