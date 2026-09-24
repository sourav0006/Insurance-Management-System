import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.insurance_application import InsuranceApplication, ApplicationStatus
from app.models.insurance_plan import InsurancePlan, PlanStatus
from app.models.insurer_profile import InsurerProfile, InsurerVerificationStatus
from app.models.user import User, UserRole
from app.schemas.application import (
    ApplicationCreateRequest,
    ApplicationStatusUpdateRequest,
    ApplicationResponse,
    ApplicationListItemResponse,
    ApplicationPlanInfo,
    ApplicationInsurerInfo,
    ApplicationCustomerInfo,
)


class ApplicationService:

    @staticmethod
    def _generate_application_number(db: Session) -> str:
        """Generates a database-unique, human-readable application number e.g. APP-2026-A1B2C3D4"""
        year = datetime.now().year
        while True:
            random_suffix = uuid.uuid4().hex[:8].upper()
            app_num = f"APP-{year}-{random_suffix}"
            existing = db.scalar(
                select(InsuranceApplication).where(InsuranceApplication.application_number == app_num)
            )
            if not existing:
                return app_num

    @staticmethod
    def _build_application_response(db: Session, app_obj: InsuranceApplication) -> ApplicationResponse:
        """Helper to construct ApplicationResponse cleanly from InsuranceApplication"""
        # Load associated objects if needed
        customer_user = db.get(User, app_obj.customer_id)
        plan_obj = db.get(InsurancePlan, app_obj.plan_id)
        insurer_profile = db.scalar(
            select(InsurerProfile).where(InsurerProfile.user_id == app_obj.insurer_id)
        )

        company_name = insurer_profile.company_name if insurer_profile else "Verified Insurer"

        return ApplicationResponse(
            id=app_obj.id,
            application_number=app_obj.application_number,
            status=app_obj.status,
            submitted_at=app_obj.submitted_at,
            reviewed_at=app_obj.reviewed_at,
            rejection_reason=app_obj.rejection_reason,
            plan=ApplicationPlanInfo(
                plan_id=plan_obj.id,
                plan_name=plan_obj.plan_name,
                plan_code=plan_obj.plan_code,
                category=plan_obj.category,
                premium_amount=float(plan_obj.premium_amount),
                premium_frequency=plan_obj.premium_frequency,
                coverage_amount=float(plan_obj.coverage_amount),
            ),
            insurer=ApplicationInsurerInfo(
                insurer_id=app_obj.insurer_id,
                company_name=company_name,
            ),
            customer=ApplicationCustomerInfo(
                customer_id=customer_user.id,
                full_name=customer_user.full_name,
                email=customer_user.email,
                phone=customer_user.phone,
            ),
            date_of_birth=app_obj.date_of_birth,
            gender=app_obj.gender,
            address=app_obj.address,
            city=app_obj.city,
            state=app_obj.state,
            pincode=app_obj.pincode,
            nominee_name=app_obj.nominee_name,
            nominee_relationship=app_obj.nominee_relationship,
            nominee_phone=app_obj.nominee_phone,
            occupation=app_obj.occupation,
            annual_income=float(app_obj.annual_income),
            health_declaration=app_obj.health_declaration,
        )

    @classmethod
    def create_application(
        cls,
        db: Session,
        customer_user: User,
        request: ApplicationCreateRequest
    ) -> ApplicationResponse:
        # 1. Verify User Role
        if customer_user.role != UserRole.CUSTOMER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only registered customers can apply for insurance plans"
            )

        # 2. Verify Plan Exists
        plan = db.get(InsurancePlan, request.plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance plan not found"
            )

        # 3. Verify Plan Status == ACTIVE
        if plan.status != PlanStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance plan is not active or available for applications"
            )

        # 4. Verify Insurer Status == APPROVED
        insurer_user = db.get(User, plan.insurer_id)
        insurer_profile = db.scalar(
            select(InsurerProfile).where(InsurerProfile.user_id == plan.insurer_id)
        )
        if not insurer_user or insurer_user.role != UserRole.INSURER or not insurer_profile or insurer_profile.verification_status != InsurerVerificationStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance plan belongs to an unapproved insurer"
            )

        # 5. Check Duplicate Active Application (Part 9)
        active_statuses = [
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.UNDER_REVIEW,
            ApplicationStatus.APPROVED
        ]
        existing_active = db.scalar(
            select(InsuranceApplication).where(
                InsuranceApplication.customer_id == customer_user.id,
                InsuranceApplication.plan_id == request.plan_id,
                InsuranceApplication.status.in_(active_statuses)
            )
        )
        if existing_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"You already have an active or approved application ({existing_active.application_number}) for this plan."
            )

        # 6. Generate unique application_number & derive insurer_id
        app_number = cls._generate_application_number(db)
        derived_insurer_id = plan.insurer_id

        # 7. Create Application
        app_obj = InsuranceApplication(
            customer_id=customer_user.id,
            plan_id=plan.id,
            insurer_id=derived_insurer_id,
            application_number=app_number,
            date_of_birth=request.date_of_birth,
            gender=request.gender,
            address=request.address,
            city=request.city,
            state=request.state,
            pincode=request.pincode,
            nominee_name=request.nominee_name,
            nominee_relationship=request.nominee_relationship,
            nominee_phone=request.nominee_phone,
            occupation=request.occupation,
            annual_income=request.annual_income,
            health_declaration=request.health_declaration,
            status=ApplicationStatus.SUBMITTED,
        )

        db.add(app_obj)
        db.commit()
        db.refresh(app_obj)

        # Notify Insurer
        from app.services.notification_service import create_notification
        create_notification(
            db=db,
            user_id=derived_insurer_id,
            title="New Application Received",
            message="New insurance application received",
            notification_type="APPLICATION_SUBMITTED"
        )

        return cls._build_application_response(db, app_obj)

    @classmethod
    def list_customer_applications(
        cls,
        db: Session,
        customer_id: int
    ) -> List[ApplicationListItemResponse]:
        query = (
            select(InsuranceApplication)
            .where(InsuranceApplication.customer_id == customer_id)
            .order_by(InsuranceApplication.created_at.desc())
        )
        apps = db.scalars(query).all()

        results: List[ApplicationListItemResponse] = []
        for app_obj in apps:
            plan = db.get(InsurancePlan, app_obj.plan_id)
            profile = db.scalar(
                select(InsurerProfile).where(InsurerProfile.user_id == app_obj.insurer_id)
            )
            customer = db.get(User, app_obj.customer_id)

            results.append(
                ApplicationListItemResponse(
                    id=app_obj.id,
                    application_number=app_obj.application_number,
                    plan_id=app_obj.plan_id,
                    plan_name=plan.plan_name if plan else "Unknown Plan",
                    category=plan.category if plan else "General",
                    insurer_id=app_obj.insurer_id,
                    company_name=profile.company_name if profile else "Verified Insurer",
                    customer_name=customer.full_name if customer else "Customer",
                    submitted_at=app_obj.submitted_at,
                    reviewed_at=app_obj.reviewed_at,
                    status=app_obj.status,
                    rejection_reason=app_obj.rejection_reason,
                )
            )
        return results

    @classmethod
    def get_customer_application_detail(
        cls,
        db: Session,
        customer_id: int,
        application_id: int
    ) -> ApplicationResponse:
        app_obj = db.get(InsuranceApplication, application_id)
        if not app_obj or app_obj.customer_id != customer_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance application not found"
            )
        return cls._build_application_response(db, app_obj)

    @classmethod
    def list_insurer_applications(
        cls,
        db: Session,
        insurer_id: int,
        status_filter: Optional[ApplicationStatus] = None
    ) -> List[ApplicationListItemResponse]:
        query = select(InsuranceApplication).where(InsuranceApplication.insurer_id == insurer_id)
        if status_filter:
            query = query.where(InsuranceApplication.status == status_filter)
        query = query.order_by(InsuranceApplication.created_at.desc())

        apps = db.scalars(query).all()

        results: List[ApplicationListItemResponse] = []
        for app_obj in apps:
            plan = db.get(InsurancePlan, app_obj.plan_id)
            profile = db.scalar(
                select(InsurerProfile).where(InsurerProfile.user_id == app_obj.insurer_id)
            )
            customer = db.get(User, app_obj.customer_id)

            results.append(
                ApplicationListItemResponse(
                    id=app_obj.id,
                    application_number=app_obj.application_number,
                    plan_id=app_obj.plan_id,
                    plan_name=plan.plan_name if plan else "Unknown Plan",
                    category=plan.category if plan else "General",
                    insurer_id=app_obj.insurer_id,
                    company_name=profile.company_name if profile else "Verified Insurer",
                    customer_name=customer.full_name if customer else "Customer",
                    submitted_at=app_obj.submitted_at,
                    reviewed_at=app_obj.reviewed_at,
                    status=app_obj.status,
                    rejection_reason=app_obj.rejection_reason,
                )
            )
        return results

    @classmethod
    def get_insurer_application_detail(
        cls,
        db: Session,
        insurer_id: int,
        application_id: int
    ) -> ApplicationResponse:
        app_obj = db.get(InsuranceApplication, application_id)
        if not app_obj or app_obj.insurer_id != insurer_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance application not found"
            )
        return cls._build_application_response(db, app_obj)

    @classmethod
    def update_application_status(
        cls,
        db: Session,
        insurer_id: int,
        application_id: int,
        update_req: ApplicationStatusUpdateRequest
    ) -> ApplicationResponse:
        app_obj = db.get(InsuranceApplication, application_id)
        if not app_obj or app_obj.insurer_id != insurer_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance application not found"
            )

        curr_status = app_obj.status
        new_status = update_req.status

        # Transition Rules (Part 15)
        allowed_transitions = {
            ApplicationStatus.SUBMITTED: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.REJECTED],
            ApplicationStatus.UNDER_REVIEW: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],
        }

        if curr_status not in allowed_transitions or new_status not in allowed_transitions[curr_status]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from {curr_status.value} to {new_status.value}"
            )

        # Handle Rejection Reason Requirements (Part 16 & 17)
        if new_status == ApplicationStatus.REJECTED:
            if not update_req.rejection_reason or not update_req.rejection_reason.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Rejection reason is required when rejecting an application"
                )
            app_obj.rejection_reason = update_req.rejection_reason.strip()
            app_obj.reviewed_at = datetime.now(timezone.utc)
        elif new_status == ApplicationStatus.APPROVED:
            app_obj.rejection_reason = None
            app_obj.reviewed_at = datetime.now(timezone.utc)
        elif new_status == ApplicationStatus.UNDER_REVIEW:
            app_obj.rejection_reason = None

        app_obj.status = new_status
        db.commit()
        db.refresh(app_obj)

        # Notify Customer on approval / rejection
        from app.services.notification_service import create_notification
        if new_status == ApplicationStatus.APPROVED:
            create_notification(
                db=db,
                user_id=app_obj.customer_id,
                title="Application Approved",
                message="Your insurance application has been approved.",
                notification_type="APPLICATION_APPROVED"
            )
        elif new_status == ApplicationStatus.REJECTED:
            rej_msg = "Your insurance application has been rejected."
            if app_obj.rejection_reason:
                rej_msg += f" Reason: {app_obj.rejection_reason}"
            create_notification(
                db=db,
                user_id=app_obj.customer_id,
                title="Application Rejected",
                message=rej_msg,
                notification_type="APPLICATION_REJECTED"
            )

        return cls._build_application_response(db, app_obj)
