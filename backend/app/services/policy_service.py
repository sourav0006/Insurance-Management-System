import uuid
from datetime import datetime, date, timedelta, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.policy import Policy, PolicyStatus
from app.models.insurance_application import InsuranceApplication, ApplicationStatus
from app.models.insurance_plan import InsurancePlan
from app.models.insurer_profile import InsurerProfile
from app.models.user import User, UserRole
from app.schemas.policy import (
    PolicyCreateRequest,
    PolicyStatusUpdateRequest,
    PolicyResponse,
    PolicyListItemResponse,
    PolicyPlanInfo,
    PolicyFinancialInfo,
    PolicyCustomerInfo,
    PolicyInsurerInfo,
    PolicyApplicationInfo,
)


class PolicyService:

    @staticmethod
    def _check_and_update_auto_expiry(db: Session, policy: Policy) -> Policy:
        """
        Automatic Expiry Check (Part 15):
        If policy status == ACTIVE and end_date < current_date, update status to EXPIRED.
        """
        today = date.today()
        if policy.status == PolicyStatus.ACTIVE and policy.end_date < today:
            policy.status = PolicyStatus.EXPIRED
            db.commit()
            db.refresh(policy)
        return policy

    @staticmethod
    def _generate_policy_number(db: Session) -> str:
        """Generates a database-unique, human-readable policy number e.g. POL-2026-A1B2C3D4"""
        year = datetime.now().year
        while True:
            random_suffix = uuid.uuid4().hex[:8].upper()
            pol_num = f"POL-{year}-{random_suffix}"
            existing = db.scalar(
                select(Policy).where(Policy.policy_number == pol_num)
            )
            if not existing:
                return pol_num

    @staticmethod
    def _build_policy_response(db: Session, policy: Policy) -> PolicyResponse:
        """Helper to construct PolicyResponse with snapshots"""
        customer_user = db.get(User, policy.customer_id)
        plan_obj = db.get(InsurancePlan, policy.plan_id)
        app_obj = db.get(InsuranceApplication, policy.application_id)
        profile = db.scalar(
            select(InsurerProfile).where(InsurerProfile.user_id == policy.insurer_id)
        )

        company_name = profile.company_name if profile else "Verified Insurer"
        customer_name = customer_user.full_name if customer_user else "Customer"

        return PolicyResponse(
            id=policy.id,
            policy_number=policy.policy_number,
            status=policy.status,
            start_date=policy.start_date,
            end_date=policy.end_date,
            cancellation_reason=policy.cancellation_reason,
            created_at=policy.created_at,
            plan=PolicyPlanInfo(
                plan_id=plan_obj.id if plan_obj else policy.plan_id,
                plan_name=plan_obj.plan_name if plan_obj else "Insurance Plan",
                plan_code=plan_obj.plan_code if plan_obj else "PLN-CODE",
                category=plan_obj.category if plan_obj else "General",
            ),
            financial=PolicyFinancialInfo(
                coverage_amount=float(policy.coverage_amount),
                premium_amount=float(policy.premium_amount),
                premium_frequency=policy.premium_frequency,
                policy_term_years=policy.policy_term_years,
            ),
            customer=PolicyCustomerInfo(
                customer_id=policy.customer_id,
                customer_name=customer_name,
            ),
            insurer=PolicyInsurerInfo(
                insurer_id=policy.insurer_id,
                company_name=company_name,
            ),
            application=PolicyApplicationInfo(
                application_id=policy.application_id,
                application_number=app_obj.application_number if app_obj else f"APP-{policy.application_id}",
            ),
        )

    @classmethod
    def create_policy(
        cls,
        db: Session,
        insurer_user: User,
        request: PolicyCreateRequest
    ) -> PolicyResponse:
        # 1. Retrieve Application
        app_obj = db.get(InsuranceApplication, request.application_id)
        if not app_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance application not found"
            )

        # 2. Check Ownership (Part 6): Must belong to authenticated insurer
        if app_obj.insurer_id != insurer_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance application not found or unauthorized"
            )

        # 3. Check Application Status == APPROVED (Part 5)
        if app_obj.status != ApplicationStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Policy can only be issued for APPROVED applications (current status: {app_obj.status.value})"
            )

        # 4. Check Duplicate Policy Protection (Part 7)
        existing_policy = db.scalar(
            select(Policy).where(Policy.application_id == request.application_id)
        )
        if existing_policy:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This application already has a policy."
            )

        # 5. Verify Plan
        plan_obj = db.get(InsurancePlan, app_obj.plan_id)
        if not plan_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated insurance plan not found"
            )

        # 6. Process Start Date & End Date Calculation (Part 8)
        today = date.today()
        if request.start_date:
            try:
                start_d = datetime.strptime(request.start_date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid start_date format. Expected YYYY-MM-DD"
                )
            if start_d < today:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Policy start_date cannot be in the past"
                )
        else:
            start_d = today

        term_years = plan_obj.policy_term_years
        try:
            target_year = start_d.year + term_years
            end_d = start_d.replace(year=target_year) - timedelta(days=1)
        except ValueError:
            # Handle Feb 29 leap year edge cases
            end_d = start_d.replace(year=start_d.year + term_years, day=28) - timedelta(days=1)

        # 7. Snapshot Financial Terms & Generate Policy Number
        pol_num = cls._generate_policy_number(db)

        policy = Policy(
            policy_number=pol_num,
            application_id=app_obj.id,
            customer_id=app_obj.customer_id,
            insurer_id=app_obj.insurer_id,
            plan_id=plan_obj.id,
            start_date=start_d,
            end_date=end_d,
            coverage_amount=plan_obj.coverage_amount,
            premium_amount=plan_obj.premium_amount,
            premium_frequency=plan_obj.premium_frequency,
            policy_term_years=plan_obj.policy_term_years,
            status=PolicyStatus.ACTIVE,
        )

        db.add(policy)
        db.commit()
        db.refresh(policy)

        # Notify Customer
        from app.services.notification_service import create_notification
        create_notification(
            db=db,
            user_id=policy.customer_id,
            title="Policy Created",
            message="Your insurance policy has been created.",
            notification_type="POLICY_CREATED"
        )

        return cls._build_policy_response(db, policy)

    @classmethod
    def list_customer_policies(
        cls,
        db: Session,
        customer_id: int
    ) -> List[PolicyListItemResponse]:
        query = (
            select(Policy)
            .where(Policy.customer_id == customer_id)
            .order_by(Policy.created_at.desc())
        )
        policies = db.scalars(query).all()

        results: List[PolicyListItemResponse] = []
        for policy in policies:
            policy = cls._check_and_update_auto_expiry(db, policy)
            plan = db.get(InsurancePlan, policy.plan_id)
            customer = db.get(User, policy.customer_id)
            app_obj = db.get(InsuranceApplication, policy.application_id)
            profile = db.scalar(
                select(InsurerProfile).where(InsurerProfile.user_id == policy.insurer_id)
            )

            results.append(
                PolicyListItemResponse(
                    id=policy.id,
                    policy_number=policy.policy_number,
                    status=policy.status,
                    start_date=policy.start_date,
                    end_date=policy.end_date,
                    coverage_amount=float(policy.coverage_amount),
                    premium_amount=float(policy.premium_amount),
                    premium_frequency=policy.premium_frequency,
                    customer_name=customer.full_name if customer else "Customer",
                    company_name=profile.company_name if profile else "Verified Insurer",
                    plan_name=plan.plan_name if plan else "Insurance Plan",
                    application_number=app_obj.application_number if app_obj else f"APP-{policy.application_id}",
                )
            )
        return results

    @classmethod
    def get_customer_policy_detail(
        cls,
        db: Session,
        customer_id: int,
        policy_id: int
    ) -> PolicyResponse:
        policy = db.get(Policy, policy_id)
        if not policy or policy.customer_id != customer_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Policy not found"
            )
        policy = cls._check_and_update_auto_expiry(db, policy)
        return cls._build_policy_response(db, policy)

    @classmethod
    def list_insurer_policies(
        cls,
        db: Session,
        insurer_id: int,
        status_filter: Optional[PolicyStatus] = None
    ) -> List[PolicyListItemResponse]:
        query = select(Policy).where(Policy.insurer_id == insurer_id)
        if status_filter:
            query = query.where(Policy.status == status_filter)
        query = query.order_by(Policy.created_at.desc())

        policies = db.scalars(query).all()

        results: List[PolicyListItemResponse] = []
        for policy in policies:
            policy = cls._check_and_update_auto_expiry(db, policy)
            plan = db.get(InsurancePlan, policy.plan_id)
            customer = db.get(User, policy.customer_id)
            app_obj = db.get(InsuranceApplication, policy.application_id)
            profile = db.scalar(
                select(InsurerProfile).where(InsurerProfile.user_id == policy.insurer_id)
            )

            results.append(
                PolicyListItemResponse(
                    id=policy.id,
                    policy_number=policy.policy_number,
                    status=policy.status,
                    start_date=policy.start_date,
                    end_date=policy.end_date,
                    coverage_amount=float(policy.coverage_amount),
                    premium_amount=float(policy.premium_amount),
                    premium_frequency=policy.premium_frequency,
                    customer_name=customer.full_name if customer else "Customer",
                    company_name=profile.company_name if profile else "Verified Insurer",
                    plan_name=plan.plan_name if plan else "Insurance Plan",
                    application_number=app_obj.application_number if app_obj else f"APP-{policy.application_id}",
                )
            )
        return results

    @classmethod
    def get_insurer_policy_detail(
        cls,
        db: Session,
        insurer_id: int,
        policy_id: int
    ) -> PolicyResponse:
        policy = db.get(Policy, policy_id)
        if not policy or policy.insurer_id != insurer_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Policy not found"
            )
        policy = cls._check_and_update_auto_expiry(db, policy)
        return cls._build_policy_response(db, policy)

    @classmethod
    def get_policy_by_application_id(
        cls,
        db: Session,
        user: User,
        application_id: int
    ) -> Optional[PolicyResponse]:
        policy = db.scalar(
            select(Policy).where(Policy.application_id == application_id)
        )
        if not policy:
            return None

        # Verify caller has permission (either customer or insurer of the policy)
        if user.role == UserRole.CUSTOMER and policy.customer_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found")
        if user.role == UserRole.INSURER and policy.insurer_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found")

        policy = cls._check_and_update_auto_expiry(db, policy)
        return cls._build_policy_response(db, policy)

    @classmethod
    def update_policy_status(
        cls,
        db: Session,
        insurer_id: int,
        policy_id: int,
        update_req: PolicyStatusUpdateRequest
    ) -> PolicyResponse:
        policy = db.get(Policy, policy_id)
        if not policy or policy.insurer_id != insurer_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Policy not found"
            )

        policy = cls._check_and_update_auto_expiry(db, policy)

        curr_status = policy.status
        new_status = update_req.status

        # Transition Rules (Part 14)
        if curr_status != PolicyStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot modify status of a {curr_status.value} policy"
            )

        if new_status not in [PolicyStatus.CANCELLED, PolicyStatus.EXPIRED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid target policy status: {new_status.value}"
            )

        if new_status == PolicyStatus.CANCELLED:
            if not update_req.cancellation_reason or not update_req.cancellation_reason.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cancellation reason is required when cancelling a policy"
                )
            policy.cancellation_reason = update_req.cancellation_reason.strip()

        policy.status = new_status
        db.commit()
        db.refresh(policy)

        return cls._build_policy_response(db, policy)
