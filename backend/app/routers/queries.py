from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_customer, require_approved_insurer
from app.models.user import User
from app.schemas.query import (
    QueryCreate,
    QueryResponseText,
    QueryResponse,
    ApprovedInsurerResponse,
)
from app.services.query_service import (
    get_approved_insurers,
    create_query,
    get_customer_queries,
    get_customer_query_by_id,
    close_customer_query,
    get_insurer_queries,
    get_insurer_query_by_id,
    respond_to_query,
    close_insurer_query,
)

router = APIRouter(tags=["Customer & Insurer Queries"])


# ==================== CUSTOMER ENDPOINTS ====================

@router.get(
    "/queries/insurers",
    response_model=List[ApprovedInsurerResponse],
    summary="List approved insurers for customer query target selection"
)
def list_approved_insurers_endpoint(
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    return get_approved_insurers(db)


@router.post(
    "/queries",
    response_model=QueryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Customer submits a new query to an approved insurer"
)
def create_query_endpoint(
    request: QueryCreate,
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    return create_query(db, customer_user.id, request)


@router.get(
    "/queries/my",
    response_model=List[QueryResponse],
    summary="Customer lists all own submitted queries"
)
def list_customer_queries_endpoint(
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    return get_customer_queries(db, customer_user.id)


@router.get(
    "/queries/my/{query_id}",
    response_model=QueryResponse,
    summary="Customer fetches details of a specific query"
)
def get_customer_query_detail_endpoint(
    query_id: int,
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    return get_customer_query_by_id(db, customer_user.id, query_id)


@router.patch(
    "/queries/my/{query_id}/close",
    response_model=QueryResponse,
    summary="Customer closes an active query"
)
def close_customer_query_endpoint(
    query_id: int,
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    return close_customer_query(db, customer_user.id, query_id)


# ==================== INSURER ENDPOINTS ====================

@router.get(
    "/insurer/queries",
    response_model=List[QueryResponse],
    summary="Approved insurer lists all received customer queries"
)
def list_insurer_queries_endpoint(
    db: Session = Depends(get_db),
    insurer_user: User = Depends(require_approved_insurer)
):
    return get_insurer_queries(db, insurer_user.id)


@router.get(
    "/insurer/queries/{query_id}",
    response_model=QueryResponse,
    summary="Approved insurer fetches details of a specific query"
)
def get_insurer_query_detail_endpoint(
    query_id: int,
    db: Session = Depends(get_db),
    insurer_user: User = Depends(require_approved_insurer)
):
    return get_insurer_query_by_id(db, insurer_user.id, query_id)


@router.patch(
    "/insurer/queries/{query_id}/respond",
    response_model=QueryResponse,
    summary="Approved insurer responds to a customer query"
)
def respond_insurer_query_endpoint(
    query_id: int,
    request: QueryResponseText,
    db: Session = Depends(get_db),
    insurer_user: User = Depends(require_approved_insurer)
):
    return respond_to_query(db, insurer_user.id, query_id, request.response)


@router.patch(
    "/insurer/queries/{query_id}/close",
    response_model=QueryResponse,
    summary="Approved insurer closes a query"
)
def close_insurer_query_endpoint(
    query_id: int,
    db: Session = Depends(get_db),
    insurer_user: User = Depends(require_approved_insurer)
):
    return close_insurer_query(db, insurer_user.id, query_id)
