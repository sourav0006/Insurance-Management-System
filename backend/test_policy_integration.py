import os
import sys
import unittest
import uuid
from datetime import date, timedelta
from fastapi.testclient import TestClient

# Ensure app is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database.database import SessionLocal
from app.models.user import User, UserRole
from app.models.insurer_profile import InsurerProfile, InsurerVerificationStatus
from app.models.insurance_plan import InsurancePlan, PlanStatus
from app.models.insurance_application import InsuranceApplication, ApplicationStatus
from app.models.policy import Policy, PolicyStatus
from app.core.security import get_password_hash, create_access_token


class TestPolicyIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        cls.prefix = f"poltest_{uuid.uuid4().hex[:8]}"

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

        # Create Customers
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
                coverage_amount=1000000,
                premium_amount=12000,
                premium_frequency="Yearly",
                policy_term_years=2,
                eligibility_min_age=18,
                eligibility_max_age=65,
                status=status
            )
            cls.db.add(plan)
            cls.db.commit()
            cls.db.refresh(plan)
            return plan

        cls.plan_a = create_plan(cls.insurer_a.id, "active_a", PlanStatus.ACTIVE)
        cls.plan_b = create_plan(cls.insurer_b.id, "active_b", PlanStatus.ACTIVE)

        # Helper to create application
        def create_application(customer_id, plan_id, insurer_id, status_val):
            app_obj = InsuranceApplication(
                customer_id=customer_id,
                plan_id=plan_id,
                insurer_id=insurer_id,
                application_number=f"APP-{cls.prefix}-{uuid.uuid4().hex[:6]}".upper(),
                date_of_birth="1995-05-15",
                gender="Male",
                address="123 Test St",
                city="Mumbai",
                state="Maharashtra",
                pincode="400001",
                nominee_name="Jane Doe",
                nominee_relationship="Spouse",
                nominee_phone="+919876543210",
                occupation="Engineer",
                annual_income=1200000,
                health_declaration="Good health",
                status=status_val
            )
            cls.db.add(app_obj)
            cls.db.commit()
            cls.db.refresh(app_obj)
            return app_obj

        cls.app_submitted = create_application(cls.customer_1.id, cls.plan_a.id, cls.insurer_a.id, ApplicationStatus.SUBMITTED)
        cls.app_review = create_application(cls.customer_1.id, cls.plan_a.id, cls.insurer_a.id, ApplicationStatus.UNDER_REVIEW)
        cls.app_rejected = create_application(cls.customer_1.id, cls.plan_a.id, cls.insurer_a.id, ApplicationStatus.REJECTED)
        cls.app_approved_1 = create_application(cls.customer_1.id, cls.plan_a.id, cls.insurer_a.id, ApplicationStatus.APPROVED)
        cls.app_approved_2 = create_application(cls.customer_2.id, cls.plan_b.id, cls.insurer_b.id, ApplicationStatus.APPROVED)

    @classmethod
    def tearDownClass(cls):
        cls.db.query(Policy).filter(Policy.policy_number.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(InsuranceApplication).filter(InsuranceApplication.application_number.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(InsurancePlan).filter(InsurancePlan.plan_code.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(InsurerProfile).filter(InsurerProfile.license_number.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(User).filter(User.email.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.commit()
        cls.db.close()

    def test_01_create_policy_from_approved_application_success(self):
        """Approved insurer can create policy from APPROVED application with correct date and financial snapshot"""
        today_str = date.today().isoformat()
        res = self.client.post(
            "/api/policies",
            json={"application_id": self.app_approved_1.id, "start_date": today_str},
            headers=self.ins_a_headers
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()

        self.assertIn("id", data)
        self.assertTrue(data["policy_number"].startswith("POL-"))
        self.assertEqual(data["status"], "ACTIVE")
        self.assertEqual(data["start_date"], today_str)

        # Check end date calculation (today + 2 years - 1 day)
        expected_end = (date.today().replace(year=date.today().year + 2) - timedelta(days=1)).isoformat()
        self.assertEqual(data["end_date"], expected_end)

        # Check financial snapshot
        self.assertEqual(data["financial"]["coverage_amount"], 1000000)
        self.assertEqual(data["financial"]["premium_amount"], 12000)
        self.assertEqual(data["financial"]["premium_frequency"], "Yearly")
        self.assertEqual(data["financial"]["policy_term_years"], 2)

        # Check ownership derivation
        self.assertEqual(data["customer"]["customer_id"], self.customer_1.id)
        self.assertEqual(data["insurer"]["insurer_id"], self.insurer_a.id)
        self.assertEqual(data["plan"]["plan_id"], self.plan_a.id)
        self.assertEqual(data["application"]["application_id"], self.app_approved_1.id)
        self.assertNotIn("password_hash", str(data))

    def test_02_duplicate_policy_creation_fails(self):
        """Creating a duplicate policy for the same approved application returns 409 Conflict"""
        res = self.client.post(
            "/api/policies",
            json={"application_id": self.app_approved_1.id},
            headers=self.ins_a_headers
        )
        self.assertEqual(res.status_code, 409)

    def test_03_invalid_application_status_policy_creation_fails(self):
        """Submitting, under review, or rejected application cannot issue policy (returns 400)"""
        # SUBMITTED
        res_sub = self.client.post("/api/policies", json={"application_id": self.app_submitted.id}, headers=self.ins_a_headers)
        self.assertEqual(res_sub.status_code, 400)

        # UNDER_REVIEW
        res_ur = self.client.post("/api/policies", json={"application_id": self.app_review.id}, headers=self.ins_a_headers)
        self.assertEqual(res_ur.status_code, 400)

        # REJECTED
        res_rej = self.client.post("/api/policies", json={"application_id": self.app_rejected.id}, headers=self.ins_a_headers)
        self.assertEqual(res_rej.status_code, 400)

        # Nonexistent
        res_none = self.client.post("/api/policies", json={"application_id": 999999}, headers=self.ins_a_headers)
        self.assertEqual(res_none.status_code, 404)

    def test_04_authorization_and_ownership_controls(self):
        """Customer cannot create policy; Pending insurer cannot create policy; Insurer B cannot create policy for Insurer A's app"""
        # Customer creating policy -> 403
        self.assertEqual(self.client.post("/api/policies", json={"application_id": self.app_approved_2.id}, headers=self.cust1_headers).status_code, 403)

        # Pending insurer creating policy -> 403
        self.assertEqual(self.client.post("/api/policies", json={"application_id": self.app_approved_2.id}, headers=self.ins_c_headers).status_code, 403)

        # Insurer B creating policy for Insurer A's application -> 404
        self.assertEqual(self.client.post("/api/policies", json={"application_id": self.app_approved_1.id}, headers=self.ins_b_headers).status_code, 404)

        # Unauthenticated -> 401
        self.assertEqual(self.client.get("/api/policies/my").status_code, 401)
        self.assertEqual(self.client.get("/api/insurer/policies").status_code, 401)

    def test_05_customer_and_insurer_policy_listing_and_details(self):
        """Customer 1 can list own policies and view details; Insurer A can list own policies and view details"""
        # Insurer B creates policy for app_approved_2
        res_b = self.client.post("/api/policies", json={"application_id": self.app_approved_2.id}, headers=self.ins_b_headers)
        self.assertEqual(res_b.status_code, 201)
        pol2_id = res_b.json()["id"]

        # Customer 1 lists policies
        res_cust1_list = self.client.get("/api/policies/my", headers=self.cust1_headers)
        self.assertEqual(res_cust1_list.status_code, 200)
        cust1_items = res_cust1_list.json()
        self.assertTrue(len(cust1_items) >= 1)
        pol1_id = cust1_items[0]["id"]

        # Customer 1 views own policy detail
        res_cust1_detail = self.client.get(f"/api/policies/my/{pol1_id}", headers=self.cust1_headers)
        self.assertEqual(res_cust1_detail.status_code, 200)
        self.assertEqual(res_cust1_detail.json()["id"], pol1_id)

        # Customer 2 cannot view Customer 1's policy
        self.assertEqual(self.client.get(f"/api/policies/my/{pol1_id}", headers=self.cust2_headers).status_code, 404)

        # Insurer A views own policy
        res_ins_a_detail = self.client.get(f"/api/insurer/policies/{pol1_id}", headers=self.ins_a_headers)
        self.assertEqual(res_ins_a_detail.status_code, 200)

        # Insurer A cannot view Insurer B's policy (pol2_id)
        self.assertEqual(self.client.get(f"/api/insurer/policies/{pol2_id}", headers=self.ins_a_headers).status_code, 404)

    def test_06_policy_cancellation_workflow(self):
        """Insurer can cancel active policy with reason; cancellation without reason fails; invalid transition fails"""
        res_cust1_list = self.client.get("/api/policies/my", headers=self.cust1_headers)
        pol1_id = res_cust1_list.json()[0]["id"]

        # Insurer A cancels without reason -> 400
        self.assertEqual(
            self.client.patch(f"/api/insurer/policies/{pol1_id}/status", json={"status": "CANCELLED"}, headers=self.ins_a_headers).status_code,
            400
        )

        # Insurer A cancels with reason -> 200
        res_cancel = self.client.patch(
            f"/api/insurer/policies/{pol1_id}/status",
            json={"status": "CANCELLED", "cancellation_reason": "Customer request for cancellation"},
            headers=self.ins_a_headers
        )
        self.assertEqual(res_cancel.status_code, 200)
        self.assertEqual(res_cancel.json()["status"], "CANCELLED")
        self.assertEqual(res_cancel.json()["cancellation_reason"], "Customer request for cancellation")

        # Attempt CANCELLED -> ACTIVE fails -> 400
        self.assertEqual(
            self.client.patch(f"/api/insurer/policies/{pol1_id}/status", json={"status": "ACTIVE"}, headers=self.ins_a_headers).status_code,
            400
        )

    def test_07_automatic_expiry_check(self):
        """Active policy whose end_date is in the past automatically transitions to EXPIRED on query"""
        # Create a real approved application for this test
        app_exp = InsuranceApplication(
            customer_id=self.customer_1.id,
            plan_id=self.plan_a.id,
            insurer_id=self.insurer_a.id,
            application_number=f"APP-EXP-{self.prefix}".upper(),
            date_of_birth="1995-05-15",
            gender="Male",
            address="123 Test St",
            city="Mumbai",
            state="Maharashtra",
            pincode="400001",
            nominee_name="Jane Doe",
            nominee_relationship="Spouse",
            nominee_phone="+919876543210",
            occupation="Engineer",
            annual_income=1200000,
            health_declaration="Good health",
            status=ApplicationStatus.APPROVED
        )
        self.db.add(app_exp)
        self.db.commit()
        self.db.refresh(app_exp)

        # Create an expired policy record with real application_id
        yesterday = date.today() - timedelta(days=1)
        start_past = date.today() - timedelta(days=365)
        pol_expired = Policy(
            policy_number=f"POL-EXP-{self.prefix}",
            application_id=app_exp.id,
            customer_id=self.customer_1.id,
            insurer_id=self.insurer_a.id,
            plan_id=self.plan_a.id,
            start_date=start_past,
            end_date=yesterday,
            coverage_amount=1000000,
            premium_amount=12000,
            premium_frequency="Yearly",
            policy_term_years=1,
            status=PolicyStatus.ACTIVE
        )
        self.db.add(pol_expired)
        self.db.commit()
        self.db.refresh(pol_expired)

        # Query detail endpoint -> should auto-update status to EXPIRED
        res = self.client.get(f"/api/insurer/policies/{pol_expired.id}", headers=self.ins_a_headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "EXPIRED")

        # Attempt EXPIRED -> ACTIVE fails -> 400
        self.assertEqual(
            self.client.patch(f"/api/insurer/policies/{pol_expired.id}/status", json={"status": "ACTIVE"}, headers=self.ins_a_headers).status_code,
            400
        )


if __name__ == "__main__":
    unittest.main()
