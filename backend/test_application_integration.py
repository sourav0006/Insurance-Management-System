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
from app.models.customer_profile import CustomerProfile
from app.models.insurance_plan import InsurancePlan, PlanStatus
from app.models.insurance_application import InsuranceApplication, ApplicationStatus
from app.core.security import get_password_hash, create_access_token


class TestApplicationIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        cls.prefix = f"apptest_{uuid.uuid4().hex[:8]}"

        # Helper to create user & return auth token header
        def create_user(role, email_prefix):
            email = f"{cls.prefix}_{email_prefix}@test.com"
            user = User(
                full_name=f"User {email_prefix}",
                email=email,
                phone=f"+1{uuid.uuid4().int % 1000000000:09d}",
                password_hash=get_password_hash("Password@123"),
                role=role,
                is_active=True
            )
            cls.db.add(user)
            cls.db.commit()
            cls.db.refresh(user)

            token = create_access_token(user.id, role=user.role.value)
            headers = {"Authorization": f"Bearer {token}"}
            return user, headers

        # Create 2 Customers
        cls.customer_1, cls.cust1_headers = create_user(UserRole.CUSTOMER, "cust1")
        cls.customer_2, cls.cust2_headers = create_user(UserRole.CUSTOMER, "cust2")

        # Create Insurer A (Approved)
        cls.insurer_a, cls.ins_a_headers = create_user(UserRole.INSURER, "ins_a")
        cls.profile_a = InsurerProfile(
            user_id=cls.insurer_a.id,
            company_name=f"Company A {cls.prefix}",
            license_number=f"LIC-A-{cls.prefix}",
            verification_status=InsurerVerificationStatus.APPROVED
        )
        cls.db.add(cls.profile_a)

        # Create Insurer B (Approved)
        cls.insurer_b, cls.ins_b_headers = create_user(UserRole.INSURER, "ins_b")
        cls.profile_b = InsurerProfile(
            user_id=cls.insurer_b.id,
            company_name=f"Company B {cls.prefix}",
            license_number=f"LIC-B-{cls.prefix}",
            verification_status=InsurerVerificationStatus.APPROVED
        )
        cls.db.add(cls.profile_b)

        # Create Insurer C (Pending)
        cls.insurer_c, cls.ins_c_headers = create_user(UserRole.INSURER, "ins_c")
        cls.profile_c = InsurerProfile(
            user_id=cls.insurer_c.id,
            company_name=f"Company C {cls.prefix}",
            license_number=f"LIC-C-{cls.prefix}",
            verification_status=InsurerVerificationStatus.PENDING
        )
        cls.db.add(cls.profile_c)

        cls.db.commit()

        # Helper to create plan
        def create_plan(insurer_id, code_suffix, status):
            plan = InsurancePlan(
                insurer_id=insurer_id,
                plan_name=f"Plan {code_suffix} {cls.prefix}",
                plan_code=f"PLN-{cls.prefix}-{code_suffix}".upper(),
                category="Health Insurance",
                description="Test plan description",
                coverage_amount=500000,
                premium_amount=5000,
                premium_frequency="Monthly",
                policy_term_years=5,
                eligibility_min_age=18,
                eligibility_max_age=65,
                status=status
            )
            cls.db.add(plan)
            cls.db.commit()
            cls.db.refresh(plan)
            return plan

        # Active Plan owned by Insurer A
        cls.plan_active_a = create_plan(cls.insurer_a.id, "active_a", PlanStatus.ACTIVE)
        # Draft Plan owned by Insurer A
        cls.plan_draft_a = create_plan(cls.insurer_a.id, "draft_a", PlanStatus.DRAFT)
        # Inactive Plan owned by Insurer A
        cls.plan_inactive_a = create_plan(cls.insurer_a.id, "inact_a", PlanStatus.INACTIVE)

        # Active Plan owned by Insurer B
        cls.plan_active_b = create_plan(cls.insurer_b.id, "active_b", PlanStatus.ACTIVE)

        # Active Plan owned by Pending Insurer C
        cls.plan_active_c = create_plan(cls.insurer_c.id, "active_c", PlanStatus.ACTIVE)

        cls.valid_app_payload = {
            "plan_id": cls.plan_active_a.id,
            "date_of_birth": "1995-05-15",
            "gender": "Male",
            "address": "123 Test Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "nominee_name": "Jane Doe",
            "nominee_relationship": "Spouse",
            "nominee_phone": "+919876543210",
            "occupation": "Software Engineer",
            "annual_income": 1200000,
            "health_declaration": "I declare that I am in good health with no pre-existing conditions."
        }

    @classmethod
    def tearDownClass(cls):
        cls.db.query(InsuranceApplication).filter(InsuranceApplication.application_number.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(InsurancePlan).filter(InsurancePlan.plan_code.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(InsurerProfile).filter(InsurerProfile.license_number.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(User).filter(User.email.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.commit()
        cls.db.close()

    def test_01_customer_submit_application_success(self):
        """Customer 1 submits application for Insurer A's active plan"""
        res = self.client.post("/api/applications", json=self.valid_app_payload, headers=self.cust1_headers)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("id", data)
        self.assertTrue(data["application_number"].startswith("APP-"))
        self.assertEqual(data["status"], "SUBMITTED")
        self.assertEqual(data["plan"]["plan_id"], self.plan_active_a.id)
        self.assertEqual(data["insurer"]["insurer_id"], self.insurer_a.id)
        self.assertEqual(data["customer"]["customer_id"], self.customer_1.id)
        self.assertNotIn("password_hash", str(data))

    def test_02_duplicate_active_application_rejected(self):
        """Customer 1 submitting duplicate active application for same plan returns 409 Conflict"""
        res = self.client.post("/api/applications", json=self.valid_app_payload, headers=self.cust1_headers)
        self.assertEqual(res.status_code, 409)

    def test_03_application_against_draft_inactive_unapproved_plans(self):
        """Submitting application against DRAFT, INACTIVE, non-existent, or Pending insurer plan returns 404"""
        # Draft plan
        p_draft = {**self.valid_app_payload, "plan_id": self.plan_draft_a.id}
        self.assertEqual(self.client.post("/api/applications", json=p_draft, headers=self.cust1_headers).status_code, 404)

        # Inactive plan
        p_inact = {**self.valid_app_payload, "plan_id": self.plan_inactive_a.id}
        self.assertEqual(self.client.post("/api/applications", json=p_inact, headers=self.cust1_headers).status_code, 404)

        # Pending insurer plan
        p_pend = {**self.valid_app_payload, "plan_id": self.plan_active_c.id}
        self.assertEqual(self.client.post("/api/applications", json=p_pend, headers=self.cust1_headers).status_code, 404)

        # Nonexistent plan
        p_none = {**self.valid_app_payload, "plan_id": 999999}
        self.assertEqual(self.client.post("/api/applications", json=p_none, headers=self.cust1_headers).status_code, 404)

    def test_04_customer_list_and_get_own_applications(self):
        """Customer can list own applications and get details"""
        # List
        res_list = self.client.get("/api/applications/my", headers=self.cust1_headers)
        self.assertEqual(res_list.status_code, 200)
        items = res_list.json()
        self.assertTrue(len(items) >= 1)
        app_id = items[0]["id"]

        # Detail
        res_detail = self.client.get(f"/api/applications/my/{app_id}", headers=self.cust1_headers)
        self.assertEqual(res_detail.status_code, 200)
        self.assertEqual(res_detail.json()["id"], app_id)

    def test_05_customer_cannot_view_other_customer_application(self):
        """Customer 2 cannot view Customer 1's application"""
        res_list = self.client.get("/api/applications/my", headers=self.cust1_headers)
        app_id = res_list.json()[0]["id"]

        res_other = self.client.get(f"/api/applications/my/{app_id}", headers=self.cust2_headers)
        self.assertEqual(res_other.status_code, 404)

    def test_06_unauthenticated_and_customer_access_to_insurer_endpoints(self):
        """Unauthenticated returns 401, Customer accessing insurer endpoints returns 403"""
        # Unauthenticated
        self.assertEqual(self.client.get("/api/applications/my").status_code, 401)
        self.assertEqual(self.client.get("/api/insurer/applications").status_code, 401)

        # Customer calling insurer endpoints
        self.assertEqual(self.client.get("/api/insurer/applications", headers=self.cust1_headers).status_code, 403)

    def test_07_insurer_list_and_view_own_applications(self):
        """Approved Insurer A can view applications for their plans"""
        res = self.client.get("/api/insurer/applications", headers=self.ins_a_headers)
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertTrue(len(items) >= 1)
        app_id = items[0]["id"]

        res_detail = self.client.get(f"/api/insurer/applications/{app_id}", headers=self.ins_a_headers)
        self.assertEqual(res_detail.status_code, 200)
        self.assertEqual(res_detail.json()["id"], app_id)

    def test_08_insurer_isolation(self):
        """Insurer B cannot access Insurer A's application"""
        res_a = self.client.get("/api/insurer/applications", headers=self.ins_a_headers)
        app_id = res_a.json()[0]["id"]

        res_b = self.client.get(f"/api/insurer/applications/{app_id}", headers=self.ins_b_headers)
        self.assertEqual(res_b.status_code, 404)

        res_mod_b = self.client.patch(
            f"/api/insurer/applications/{app_id}/status",
            json={"status": "UNDER_REVIEW"},
            headers=self.ins_b_headers
        )
        self.assertEqual(res_mod_b.status_code, 404)

    def test_09_pending_insurer_blocked(self):
        """Pending Insurer C cannot access application endpoints"""
        self.assertEqual(self.client.get("/api/insurer/applications", headers=self.ins_c_headers).status_code, 403)

    def test_10_application_status_workflow_transitions(self):
        """Test valid status transitions: SUBMITTED -> UNDER_REVIEW -> APPROVED / REJECTED"""
        # Customer 2 submits application to Insurer A
        p_c2 = {**self.valid_app_payload, "plan_id": self.plan_active_a.id}
        res_sub = self.client.post("/api/applications", json=p_c2, headers=self.cust2_headers)
        self.assertEqual(res_sub.status_code, 201)
        app2_id = res_sub.json()["id"]

        # Insurer A moves SUBMITTED -> UNDER_REVIEW
        res_ur = self.client.patch(
            f"/api/insurer/applications/{app2_id}/status",
            json={"status": "UNDER_REVIEW"},
            headers=self.ins_a_headers
        )
        self.assertEqual(res_ur.status_code, 200)
        self.assertEqual(res_ur.json()["status"], "UNDER_REVIEW")

        # Insurer A moves UNDER_REVIEW -> APPROVED
        res_appr = self.client.patch(
            f"/api/insurer/applications/{app2_id}/status",
            json={"status": "APPROVED"},
            headers=self.ins_a_headers
        )
        self.assertEqual(res_appr.status_code, 200)
        self.assertEqual(res_appr.json()["status"], "APPROVED")

        # Invalid transition: APPROVED -> REJECTED must return 400
        res_invalid = self.client.patch(
            f"/api/insurer/applications/{app2_id}/status",
            json={"status": "REJECTED", "rejection_reason": "Too late"},
            headers=self.ins_a_headers
        )
        self.assertEqual(res_invalid.status_code, 400)

    def test_11_rejection_flow_requires_reason(self):
        """Rejection without reason fails; with reason succeeds"""
        # Customer 2 submits application to Insurer B
        p_b = {**self.valid_app_payload, "plan_id": self.plan_active_b.id}
        res_sub = self.client.post("/api/applications", json=p_b, headers=self.cust2_headers)
        self.assertEqual(res_sub.status_code, 201)
        app_b_id = res_sub.json()["id"]

        # Reject without reason -> 400
        res_no_reason = self.client.patch(
            f"/api/insurer/applications/{app_b_id}/status",
            json={"status": "REJECTED"},
            headers=self.ins_b_headers
        )
        self.assertEqual(res_no_reason.status_code, 400)

        # Reject with reason -> 200
        res_rejected = self.client.patch(
            f"/api/insurer/applications/{app_b_id}/status",
            json={"status": "REJECTED", "rejection_reason": "Incomplete health history"},
            headers=self.ins_b_headers
        )
        self.assertEqual(res_rejected.status_code, 200)
        self.assertEqual(res_rejected.json()["status"], "REJECTED")
        self.assertEqual(res_rejected.json()["rejection_reason"], "Incomplete health history")

    def test_12_reapply_after_rejection_allowed(self):
        """Customer 2 can re-apply for plan B after previous application was REJECTED"""
        p_b = {**self.valid_app_payload, "plan_id": self.plan_active_b.id}
        res_reapply = self.client.post("/api/applications", json=p_b, headers=self.cust2_headers)
        self.assertEqual(res_reapply.status_code, 201)


if __name__ == "__main__":
    unittest.main()
