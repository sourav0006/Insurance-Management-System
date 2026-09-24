import os
import sys
import unittest
import uuid
from fastapi.testclient import TestClient

# Ensure app is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database.database import SessionLocal
from app.models.user import User, UserRole
from app.models.insurer_profile import InsurerProfile, InsurerVerificationStatus
from app.models.insurance_plan import InsurancePlan, PlanStatus
from app.core.security import get_password_hash


class TestMarketplaceIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        # Generate unique prefix for test records
        cls.prefix = f"mkttest_{uuid.uuid4().hex[:8]}"

        # Helper to create user & insurer profile
        def create_insurer(name_suffix, status):
            email = f"{cls.prefix}_{name_suffix}@insurer.com"
            user = User(
                full_name=f"Insurer {name_suffix}",
                email=email,
                phone=f"+1{uuid.uuid4().int % 1000000000:09d}",
                password_hash=get_password_hash("Password@123"),
                role=UserRole.INSURER,
                is_active=True
            )
            cls.db.add(user)
            cls.db.commit()
            cls.db.refresh(user)

            profile = InsurerProfile(
                user_id=user.id,
                company_name=f"Company {name_suffix} {cls.prefix}",
                license_number=f"LIC-{cls.prefix}-{name_suffix}",
                verification_status=status,
                license_document_path="/secret/license.pdf"
            )
            cls.db.add(profile)
            cls.db.commit()
            cls.db.refresh(profile)
            return user

        cls.approved_insurer = create_insurer("approved", InsurerVerificationStatus.APPROVED)
        cls.pending_insurer = create_insurer("pending", InsurerVerificationStatus.PENDING)
        cls.rejected_insurer = create_insurer("rejected", InsurerVerificationStatus.REJECTED)
        cls.suspended_insurer = create_insurer("suspended", InsurerVerificationStatus.SUSPENDED)

        # Helper to create plan
        def create_plan(insurer_id, name_suffix, status, category, premium, coverage, freq="Monthly"):
            code = f"PLN-{cls.prefix}-{name_suffix}".upper()
            plan = InsurancePlan(
                insurer_id=insurer_id,
                plan_name=f"Plan {name_suffix} {cls.prefix}",
                plan_code=code,
                category=category,
                description=f"Description for {name_suffix}",
                coverage_amount=coverage,
                premium_amount=premium,
                premium_frequency=freq,
                policy_term_years=10,
                eligibility_min_age=18,
                eligibility_max_age=65,
                status=status
            )
            cls.db.add(plan)
            cls.db.commit()
            cls.db.refresh(plan)
            return plan

        # 1. Approved + Active (Visible)
        cls.plan_active_approved_1 = create_plan(
            cls.approved_insurer.id, "act_app_1", PlanStatus.ACTIVE, "Health Insurance", 5000, 500000, "Monthly"
        )
        cls.plan_active_approved_2 = create_plan(
            cls.approved_insurer.id, "act_app_2", PlanStatus.ACTIVE, "Life Insurance", 15000, 2000000, "Yearly"
        )

        # 2. Approved + Draft (Hidden)
        cls.plan_draft_approved = create_plan(
            cls.approved_insurer.id, "draft_app", PlanStatus.DRAFT, "Health Insurance", 4000, 400000, "Monthly"
        )

        # 3. Approved + Inactive (Hidden)
        cls.plan_inactive_approved = create_plan(
            cls.approved_insurer.id, "inact_app", PlanStatus.INACTIVE, "Health Insurance", 3000, 300000, "Monthly"
        )

        # 4. Pending + Active (Hidden)
        cls.plan_active_pending = create_plan(
            cls.pending_insurer.id, "act_pend", PlanStatus.ACTIVE, "Health Insurance", 5000, 500000, "Monthly"
        )

        # 5. Rejected + Active (Hidden)
        cls.plan_active_rejected = create_plan(
            cls.rejected_insurer.id, "act_rej", PlanStatus.ACTIVE, "Health Insurance", 5000, 500000, "Monthly"
        )

        # 6. Suspended + Active (Hidden)
        cls.plan_active_suspended = create_plan(
            cls.suspended_insurer.id, "act_susp", PlanStatus.ACTIVE, "Health Insurance", 5000, 500000, "Monthly"
        )

    @classmethod
    def tearDownClass(cls):
        # Cleanup created records
        cls.db.query(InsurancePlan).filter(InsurancePlan.plan_code.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(InsurerProfile).filter(InsurerProfile.license_number.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(User).filter(User.email.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.commit()
        cls.db.close()

    def test_marketplace_visibility_rules(self):
        """Verify only ACTIVE plans from APPROVED insurers are visible"""
        res = self.client.get(f"/api/marketplace/plans?search={self.prefix}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        ids = [item["id"] for item in data["items"]]

        # Approved + Active should be present
        self.assertIn(self.plan_active_approved_1.id, ids)
        self.assertIn(self.plan_active_approved_2.id, ids)

        # Draft, Inactive, Pending, Rejected, Suspended must NOT be present
        self.assertNotIn(self.plan_draft_approved.id, ids)
        self.assertNotIn(self.plan_inactive_approved.id, ids)
        self.assertNotIn(self.plan_active_pending.id, ids)
        self.assertNotIn(self.plan_active_rejected.id, ids)
        self.assertNotIn(self.plan_active_suspended.id, ids)

    def test_plan_details_visibility_and_404(self):
        """Visible plan detail returns 200, invisible or nonexistent returns 404"""
        # Visible plan
        res = self.client.get(f"/api/marketplace/plans/{self.plan_active_approved_1.id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], self.plan_active_approved_1.id)
        self.assertEqual(data["company_name"], f"Company approved {self.prefix}")

        # Non-visible plans return 404
        for hidden_plan_id in [
            self.plan_draft_approved.id,
            self.plan_inactive_approved.id,
            self.plan_active_pending.id,
            self.plan_active_rejected.id,
            self.plan_active_suspended.id,
            999999
        ]:
            res_hidden = self.client.get(f"/api/marketplace/plans/{hidden_plan_id}")
            self.assertEqual(res_hidden.status_code, 404, f"Plan ID {hidden_plan_id} should be 404")

    def test_search_functionality(self):
        """Test search by plan_name, plan_code, category, company_name"""
        # Search by plan name part
        res1 = self.client.get(f"/api/marketplace/plans?search=act_app_1")
        self.assertEqual(res1.status_code, 200)
        items1 = res1.json()["items"]
        self.assertTrue(any(i["id"] == self.plan_active_approved_1.id for i in items1))

        # Search by insurer company name part
        res2 = self.client.get(f"/api/marketplace/plans?search=Company%20approved")
        self.assertEqual(res2.status_code, 200)
        items2 = res2.json()["items"]
        self.assertTrue(any(i["id"] == self.plan_active_approved_1.id for i in items2))

    def test_category_filter(self):
        """Test category filtering"""
        res = self.client.get(f"/api/marketplace/plans?search={self.prefix}&category=Life%20Insurance")
        self.assertEqual(res.status_code, 200)
        items = res.json()["items"]
        self.assertTrue(all(i["category"] == "Life Insurance" for i in items))
        self.assertTrue(any(i["id"] == self.plan_active_approved_2.id for i in items))
        self.assertFalse(any(i["id"] == self.plan_active_approved_1.id for i in items))

    def test_premium_filter(self):
        """Test min_premium and max_premium filtering and validation"""
        # Valid range
        res = self.client.get(f"/api/marketplace/plans?search={self.prefix}&min_premium=4000&max_premium=6000")
        self.assertEqual(res.status_code, 200)
        items = res.json()["items"]
        self.assertTrue(any(i["id"] == self.plan_active_approved_1.id for i in items))
        self.assertFalse(any(i["id"] == self.plan_active_approved_2.id for i in items))

        # Invalid range min > max
        res_err = self.client.get(f"/api/marketplace/plans?min_premium=10000&max_premium=5000")
        self.assertEqual(res_err.status_code, 400)

    def test_coverage_filter(self):
        """Test min_coverage and max_coverage filtering and validation"""
        res = self.client.get(f"/api/marketplace/plans?search={self.prefix}&min_coverage=1000000&max_coverage=3000000")
        self.assertEqual(res.status_code, 200)
        items = res.json()["items"]
        self.assertTrue(any(i["id"] == self.plan_active_approved_2.id for i in items))
        self.assertFalse(any(i["id"] == self.plan_active_approved_1.id for i in items))

    def test_premium_frequency_filter(self):
        """Test premium_frequency filter"""
        res = self.client.get(f"/api/marketplace/plans?search={self.prefix}&premium_frequency=Yearly")
        self.assertEqual(res.status_code, 200)
        items = res.json()["items"]
        self.assertTrue(all(i["premium_frequency"] == "Yearly" for i in items))

    def test_sorting(self):
        """Test sorting modes"""
        res_low = self.client.get(f"/api/marketplace/plans?search={self.prefix}&sort_by=premium_low")
        self.assertEqual(res_low.status_code, 200)
        items_low = res_low.json()["items"]
        if len(items_low) >= 2:
            self.assertLessEqual(items_low[0]["premium_amount"], items_low[1]["premium_amount"])

        res_high = self.client.get(f"/api/marketplace/plans?search={self.prefix}&sort_by=premium_high")
        self.assertEqual(res_high.status_code, 200)
        items_high = res_high.json()["items"]
        if len(items_high) >= 2:
            self.assertGreaterEqual(items_high[0]["premium_amount"], items_high[1]["premium_amount"])

    def test_pagination(self):
        """Test pagination response structure"""
        res = self.client.get(f"/api/marketplace/plans?page=1&page_size=1")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["page_size"], 1)
        self.assertIn("items", data)
        self.assertIn("total", data)
        self.assertIn("total_pages", data)
        self.assertLessEqual(len(data["items"]), 1)

    def test_data_safety(self):
        """Ensure sensitive insurer fields are NOT returned"""
        res = self.client.get(f"/api/marketplace/plans/{self.plan_active_approved_1.id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        forbidden_keys = ["password_hash", "license_document_path", "rejection_reason", "license_number"]
        for key in forbidden_keys:
            self.assertNotIn(key, data)

    def test_read_only_marketplace_endpoints(self):
        """Ensure POST, PATCH, DELETE are NOT allowed on /api/marketplace/plans"""
        self.assertEqual(self.client.post("/api/marketplace/plans", json={}).status_code, 405)
        self.assertEqual(self.client.patch(f"/api/marketplace/plans/{self.plan_active_approved_1.id}", json={}).status_code, 405)
        self.assertEqual(self.client.delete(f"/api/marketplace/plans/{self.plan_active_approved_1.id}").status_code, 405)


if __name__ == "__main__":
    unittest.main()
