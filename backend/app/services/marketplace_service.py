import math
from typing import Optional, Tuple, List
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from app.models.insurance_plan import InsurancePlan, PlanStatus
from app.models.insurer_profile import InsurerProfile, InsurerVerificationStatus
from app.models.user import User, UserRole
from app.schemas.marketplace import MarketplacePlanResponse, MarketplacePaginatedResponse


class MarketplaceService:
    @staticmethod
    def get_base_marketplace_query():
        """
        Builds base query enforcing marketplace visibility rule:
        User.role == INSURER AND
        InsurerProfile.verification_status == APPROVED AND
        InsurancePlan.status == ACTIVE
        """
        return (
            select(InsurancePlan, InsurerProfile.company_name)
            .join(User, InsurancePlan.insurer_id == User.id)
            .join(InsurerProfile, InsurerProfile.user_id == User.id)
            .where(
                User.role == UserRole.INSURER,
                InsurerProfile.verification_status == InsurerVerificationStatus.APPROVED,
                InsurancePlan.status == PlanStatus.ACTIVE,
            )
        )

    @classmethod
    def list_plans(
        cls,
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        min_premium: Optional[float] = None,
        max_premium: Optional[float] = None,
        min_coverage: Optional[float] = None,
        max_coverage: Optional[float] = None,
        premium_frequency: Optional[str] = None,
        sort_by: str = "newest",
        page: int = 1,
        page_size: int = 12,
    ) -> MarketplacePaginatedResponse:
        query = cls.get_base_marketplace_query()

        # Apply search
        if search and search.strip():
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    InsurancePlan.plan_name.ilike(search_pattern),
                    InsurancePlan.plan_code.ilike(search_pattern),
                    InsurancePlan.category.ilike(search_pattern),
                    InsurerProfile.company_name.ilike(search_pattern),
                )
            )

        # Apply category filter
        if category and category.strip():
            query = query.where(InsurancePlan.category.ilike(category.strip()))

        # Apply premium filters
        if min_premium is not None:
            query = query.where(InsurancePlan.premium_amount >= min_premium)
        if max_premium is not None:
            query = query.where(InsurancePlan.premium_amount <= max_premium)

        # Apply coverage filters
        if min_coverage is not None:
            query = query.where(InsurancePlan.coverage_amount >= min_coverage)
        if max_coverage is not None:
            query = query.where(InsurancePlan.coverage_amount <= max_coverage)

        # Apply premium frequency filter
        if premium_frequency and premium_frequency.strip():
            query = query.where(InsurancePlan.premium_frequency.ilike(premium_frequency.strip()))

        # Apply sorting
        if sort_by == "premium_low":
            query = query.order_by(InsurancePlan.premium_amount.asc(), InsurancePlan.id.desc())
        elif sort_by == "premium_high":
            query = query.order_by(InsurancePlan.premium_amount.desc(), InsurancePlan.id.desc())
        elif sort_by == "coverage_low":
            query = query.order_by(InsurancePlan.coverage_amount.asc(), InsurancePlan.id.desc())
        elif sort_by == "coverage_high":
            query = query.order_by(InsurancePlan.coverage_amount.desc(), InsurancePlan.id.desc())
        else:
            # Default: newest
            query = query.order_by(InsurancePlan.created_at.desc(), InsurancePlan.id.desc())

        # Total count query
        count_query = select(func.count()).select_from(query.subquery())
        total = db.scalar(count_query) or 0

        # Pagination logic
        page = max(1, page)
        page_size = max(1, min(page_size, 50))
        total_pages = math.ceil(total / page_size) if total > 0 else 0

        offset = (page - 1) * page_size
        paginated_query = query.offset(offset).limit(page_size)

        results = db.execute(paginated_query).all()

        items: List[MarketplacePlanResponse] = []
        for plan, company_name in results:
            items.append(
                MarketplacePlanResponse(
                    id=plan.id,
                    plan_name=plan.plan_name,
                    plan_code=plan.plan_code,
                    category=plan.category,
                    description=plan.description,
                    coverage_amount=float(plan.coverage_amount),
                    premium_amount=float(plan.premium_amount),
                    premium_frequency=plan.premium_frequency,
                    policy_term_years=plan.policy_term_years,
                    eligibility_min_age=plan.eligibility_min_age,
                    eligibility_max_age=plan.eligibility_max_age,
                    insurer_id=plan.insurer_id,
                    company_name=company_name,
                )
            )

        return MarketplacePaginatedResponse(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    @classmethod
    def get_plan_detail(
        cls,
        db: Session,
        plan_id: int
    ) -> Optional[MarketplacePlanResponse]:
        query = cls.get_base_marketplace_query().where(InsurancePlan.id == plan_id)
        result = db.execute(query).first()
        if not result:
            return None

        plan, company_name = result
        return MarketplacePlanResponse(
            id=plan.id,
            plan_name=plan.plan_name,
            plan_code=plan.plan_code,
            category=plan.category,
            description=plan.description,
            coverage_amount=float(plan.coverage_amount),
            premium_amount=float(plan.premium_amount),
            premium_frequency=plan.premium_frequency,
            policy_term_years=plan.policy_term_years,
            eligibility_min_age=plan.eligibility_min_age,
            eligibility_max_age=plan.eligibility_max_age,
            insurer_id=plan.insurer_id,
            company_name=company_name,
        )
