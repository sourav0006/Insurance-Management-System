from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.query import CustomerQuery, QueryStatus
from app.models.insurer_profile import InsurerProfile, InsurerVerificationStatus
from app.models.customer_profile import CustomerProfile
from app.models.user import User
from app.schemas.query import QueryCreate, QueryResponse, ApprovedInsurerResponse
from app.services.notification_service import create_notification


def get_approved_insurers(db: Session) -> List[ApprovedInsurerResponse]:
    """Return all verified/approved insurers for query target selection."""
    approved_profiles = (
        db.query(InsurerProfile)
        .filter(InsurerProfile.verification_status == InsurerVerificationStatus.APPROVED)
        .all()
    )
    return [
        ApprovedInsurerResponse(
            insurer_id=profile.user_id,
            company_name=profile.company_name
        )
        for profile in approved_profiles
    ]


def _build_query_response(query: CustomerQuery, db: Session) -> QueryResponse:
    """Helper to convert CustomerQuery ORM model into QueryResponse schema."""
    # Retrieve customer name from related User object
    customer_user = query.customer or db.query(User).filter(User.id == query.customer_id).first()
    customer_name = customer_user.full_name if (customer_user and customer_user.full_name) else (customer_user.email if customer_user else "Customer")

    # Retrieve company name from InsurerProfile or User fallback
    insurer_profile = db.query(InsurerProfile).filter(InsurerProfile.user_id == query.insurer_id).first()
    if insurer_profile and insurer_profile.company_name:
        company_name = insurer_profile.company_name
    elif query.insurer and query.insurer.email:
        company_name = query.insurer.email
    else:
        insurer_user = db.query(User).filter(User.id == query.insurer_id).first()
        company_name = insurer_user.email if insurer_user else "Insurer"

    return QueryResponse(
        id=query.id,
        customer_id=query.customer_id,
        customer_name=customer_name,
        insurer_id=query.insurer_id,
        company_name=company_name,
        subject=query.subject,
        message=query.message,
        status=query.status,
        response=query.response,
        created_at=query.created_at,
        updated_at=query.updated_at,
        responded_at=query.responded_at
    )


def create_query(db: Session, customer_id: int, data: QueryCreate) -> QueryResponse:
    """Customer submits a query to an approved insurer."""
    # Verify insurer exists and is APPROVED
    insurer_profile = (
        db.query(InsurerProfile)
        .filter(
            InsurerProfile.user_id == data.insurer_id,
            InsurerProfile.verification_status == InsurerVerificationStatus.APPROVED
        )
        .first()
    )
    if not insurer_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected insurer is not approved or does not exist."
        )

    new_query = CustomerQuery(
        customer_id=customer_id,
        insurer_id=data.insurer_id,
        subject=data.subject.strip(),
        message=data.message.strip(),
        status=QueryStatus.OPEN
    )
    db.add(new_query)
    db.commit()
    db.refresh(new_query)

    # Trigger notification for insurer
    create_notification(
        db=db,
        user_id=data.insurer_id,
        title="New Customer Query",
        message="New customer query received.",
        notification_type="QUERY_RECEIVED"
    )

    return _build_query_response(new_query, db)


def get_customer_queries(db: Session, customer_id: int) -> List[QueryResponse]:
    """List all queries created by the current customer."""
    queries = (
        db.query(CustomerQuery)
        .filter(CustomerQuery.customer_id == customer_id)
        .order_by(CustomerQuery.created_at.desc())
        .all()
    )
    return [_build_query_response(q, db) for q in queries]


def get_customer_query_by_id(db: Session, customer_id: int, query_id: int) -> QueryResponse:
    """Retrieve a specific query owned by the current customer."""
    query = (
        db.query(CustomerQuery)
        .filter(
            CustomerQuery.id == query_id,
            CustomerQuery.customer_id == customer_id
        )
        .first()
    )
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query not found."
        )
    return _build_query_response(query, db)


def close_customer_query(db: Session, customer_id: int, query_id: int) -> QueryResponse:
    """Allow customer to close an OPEN or RESPONDED query."""
    query = (
        db.query(CustomerQuery)
        .filter(
            CustomerQuery.id == query_id,
            CustomerQuery.customer_id == customer_id
        )
        .first()
    )
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query not found."
        )

    if query.status == QueryStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query is already closed."
        )

    query.status = QueryStatus.CLOSED
    db.commit()
    db.refresh(query)
    return _build_query_response(query, db)


def get_insurer_queries(db: Session, insurer_id: int) -> List[QueryResponse]:
    """List all queries received by the approved insurer."""
    queries = (
        db.query(CustomerQuery)
        .filter(CustomerQuery.insurer_id == insurer_id)
        .order_by(CustomerQuery.created_at.desc())
        .all()
    )
    return [_build_query_response(q, db) for q in queries]


def get_insurer_query_by_id(db: Session, insurer_id: int, query_id: int) -> QueryResponse:
    """Retrieve a specific query received by the approved insurer."""
    query = (
        db.query(CustomerQuery)
        .filter(
            CustomerQuery.id == query_id,
            CustomerQuery.insurer_id == insurer_id
        )
        .first()
    )
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query not found."
        )
    return _build_query_response(query, db)


def respond_to_query(db: Session, insurer_id: int, query_id: int, response_text: str) -> QueryResponse:
    """Insurer submits a response to an active customer query."""
    query = (
        db.query(CustomerQuery)
        .filter(
            CustomerQuery.id == query_id,
            CustomerQuery.insurer_id == insurer_id
        )
        .first()
    )
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query not found."
        )

    if query.status == QueryStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot respond to a closed query."
        )

    if not response_text or not response_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Response text cannot be empty."
        )

    query.response = response_text.strip()
    query.status = QueryStatus.RESPONDED
    query.responded_at = datetime.utcnow()

    db.commit()
    db.refresh(query)

    # Trigger notification for customer
    create_notification(
        db=db,
        user_id=query.customer_id,
        title="Query Responded",
        message="Your insurer has responded to your query.",
        notification_type="QUERY_RESPONDED"
    )

    return _build_query_response(query, db)


def close_insurer_query(db: Session, insurer_id: int, query_id: int) -> QueryResponse:
    """Allow insurer to close a query."""
    query = (
        db.query(CustomerQuery)
        .filter(
            CustomerQuery.id == query_id,
            CustomerQuery.insurer_id == insurer_id
        )
        .first()
    )
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query not found."
        )

    if query.status == QueryStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query is already closed."
        )

    query.status = QueryStatus.CLOSED
    db.commit()
    db.refresh(query)
    return _build_query_response(query, db)
