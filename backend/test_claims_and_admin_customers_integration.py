import os
import sys
import unittest
import uuid
from datetime import date, timedelta
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database.database import SessionLocal
from app.models.user import User, UserRole
from app.models.insurer_profile import InsurerProfile, InsurerVerificationStatus
from app.models.customer_profile import CustomerProfile
from app.models.insurance_plan import InsurancePlan, PlanStatus
from app.models.insurance_application import InsuranceApplication, ApplicationStatus
from app.models.policy import Policy, PolicyStatus
from app.models.claim import Claim, ClaimStatus
from app.models.notification import Notification
from app.core.security import get_password_hash, create_access_token


class TestClaimsAndAdminCustomersIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()
        cls.prefix = f"clm_{uuid.uuid4().hex[:8]}"

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

        # Admin
        cls.admin, cls.admin_headers = create_user(UserRole.ADMIN, "admin")

        # Insurer 1 (Approved)
        cls.insurer1, cls.ins1_headers = create_user(UserRole.INSURER, "ins1")
        cls.profile1 = InsurerProfile(
            user_id=cls.insurer1.id,
            company_name=f"Insurer One {cls.prefix}",
            license_number=f"LIC1-{cls.prefix}",
            verification_status=InsurerVerificationStatus.APPROVED
        )
        cls.db.add(cls.profile1)

        # Insurer 2 (Approved)
        cls.insurer2, cls.ins2_headers = create_user(UserRole.INSURER, "ins2")
        cls.profile2 = InsurerProfile(
            user_id=cls.insurer2.id,
            company_name=f"Insurer Two {cls.prefix}",
            license_number=f"LIC2-{cls.prefix}",
            verification_status=InsurerVerificationStatus.APPROVED
        )
        cls.db.add(cls.profile2)

        # Customer 1
        cls.cust1, cls.cust1_headers = create_user(UserRole.CUSTOMER, "cust1")
        cls.cust1_prof = CustomerProfile(
            user_id=cls.cust1.id,
            address="123 Main St",
            city="Metropolis",
            state="NY",
            pincode="10001"
        )
        cls.db.add(cls.cust1_prof)

        # Customer 2
        cls.cust2, cls.cust2_headers = create_user(UserRole.CUSTOMER, "cust2")
        cls.cust2_prof = CustomerProfile(
            user_id=cls.cust2.id,
            address="456 Oak Ave",
            city="Gotham",
            state="NJ",
            pincode="07001"
        )
        cls.db.add(cls.cust2_prof)

        cls.db.commit()

        # Plan for Insurer 1
        cls.plan1 = InsurancePlan(
            insurer_id=cls.insurer1.id,
            plan_name=f"Health Shield {cls.prefix}",
            plan_code=f"PLAN-{cls.prefix}",
            category="Health",
            description="Comprehensive health coverage",
            coverage_amount=100000.00,
            premium_amount=500.00,
            premium_frequency="Monthly",
            policy_term_years=1,
            status=PlanStatus.ACTIVE
        )
        cls.db.add(cls.plan1)
        cls.db.commit()
        cls.db.refresh(cls.plan1)

        # App 1 & Policy 1 (Active) for Customer 1 with Insurer 1
        cls.app1 = InsuranceApplication(
            application_number=f"APP1-{cls.prefix}",
            customer_id=cls.cust1.id,
            plan_id=cls.plan1.id,
            insurer_id=cls.insurer1.id,
            date_of_birth=date(1995, 5, 15),
            gender="Male",
            address="123 Test St",
            city="Metropolis",
            state="NY",
            pincode="10001",
            nominee_name="Jane Doe",
            nominee_relationship="Spouse",
            nominee_phone="+19876543210",
            occupation="Engineer",
            annual_income=100000.00,
            health_declaration="Good health",
            status=ApplicationStatus.APPROVED
        )
        cls.db.add(cls.app1)
        cls.db.commit()
        cls.db.refresh(cls.app1)

        cls.policy1 = Policy(
            policy_number=f"POL1-{cls.prefix}",
            application_id=cls.app1.id,
            customer_id=cls.cust1.id,
            insurer_id=cls.insurer1.id,
            plan_id=cls.plan1.id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            coverage_amount=100000.00,
            premium_amount=500.00,
            premium_frequency="Monthly",
            policy_term_years=1,
            status=PolicyStatus.ACTIVE
        )
        cls.db.add(cls.policy1)

        # Policy 2 (Cancelled) for Customer 1 with Insurer 1
        cls.app2 = InsuranceApplication(
            application_number=f"APP2-{cls.prefix}",
            customer_id=cls.cust1.id,
            plan_id=cls.plan1.id,
            insurer_id=cls.insurer1.id,
            date_of_birth=date(1995, 5, 15),
            gender="Male",
            address="123 Test St",
            city="Metropolis",
            state="NY",
            pincode="10001",
            nominee_name="Jane Doe",
            nominee_relationship="Spouse",
            nominee_phone="+19876543210",
            occupation="Engineer",
            annual_income=100000.00,
            health_declaration="Good health",
            status=ApplicationStatus.APPROVED
        )
        cls.db.add(cls.app2)
        cls.db.commit()
        cls.db.refresh(cls.app2)

        cls.policy_cancelled = Policy(
            policy_number=f"POL2-CANCEL-{cls.prefix}",
            application_id=cls.app2.id,
            customer_id=cls.cust1.id,
            insurer_id=cls.insurer1.id,
            plan_id=cls.plan1.id,
            start_date=date.today() - timedelta(days=400),
            end_date=date.today() - timedelta(days=35),
            coverage_amount=50000.00,
            premium_amount=300.00,
            premium_frequency="Monthly",
            policy_term_years=1,
            status=PolicyStatus.CANCELLED
        )
        cls.db.add(cls.policy_cancelled)

        # Policy 3 (Active) for Customer 2 with Insurer 2
        cls.app3 = InsuranceApplication(
            application_number=f"APP3-{cls.prefix}",
            customer_id=cls.cust2.id,
            plan_id=cls.plan1.id,
            insurer_id=cls.insurer2.id,
            date_of_birth=date(1990, 8, 20),
            gender="Female",
            address="456 Oak Ave",
            city="Gotham",
            state="NJ",
            pincode="07001",
            nominee_name="John Smith",
            nominee_relationship="Sibling",
            nominee_phone="+19876543211",
            occupation="Architect",
            annual_income=120000.00,
            health_declaration="Good health",
            status=ApplicationStatus.APPROVED
        )
        cls.db.add(cls.app3)
        cls.db.commit()
        cls.db.refresh(cls.app3)

        cls.policy_cust2 = Policy(
            policy_number=f"POL3-CUST2-{cls.prefix}",
            application_id=cls.app3.id,
            customer_id=cls.cust2.id,
            insurer_id=cls.insurer2.id,
            plan_id=cls.plan1.id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            coverage_amount=75000.00,
            premium_amount=400.00,
            premium_frequency="Monthly",
            policy_term_years=1,
            status=PolicyStatus.ACTIVE
        )
        cls.db.add(cls.policy_cust2)
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.query(Claim).filter(Claim.claim_number.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(Policy).filter(Policy.policy_number.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(InsuranceApplication).filter(InsuranceApplication.application_number.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(InsurancePlan).filter(InsurancePlan.plan_name.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(CustomerProfile).filter(CustomerProfile.user_id.in_([cls.cust1.id, cls.cust2.id])).delete(synchronize_session=False)
        cls.db.query(InsurerProfile).filter(InsurerProfile.license_number.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(Notification).filter(
            Notification.user_id.in_([cls.admin.id, cls.insurer1.id, cls.insurer2.id, cls.cust1.id, cls.cust2.id])
        ).delete(synchronize_session=False)
        cls.db.query(User).filter(User.email.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.commit()
        cls.db.close()

    def test_01_customer_file_claim_valid_and_invalid(self):
        """Customer can file claim against own active policy, but not cancelled policy or another customer's policy"""
        # 1. Successful claim creation for active policy
        res = self.client.post(
            "/api/claims",
            json={
                "policy_id": self.policy1.id,
                "claim_type": "Medical Hospitalization",
                "incident_date": str(date.today() - timedelta(days=5)),
                "claim_amount": 1250.00,
                "description": "Emergency hospitalization expense coverage claim."
            },
            headers=self.cust1_headers
        )
        self.assertEqual(res.status_code, 201)
        claim_data = res.json()
        self.assertEqual(claim_data["status"], "SUBMITTED")
        self.assertEqual(claim_data["customer_id"], self.cust1.id)
        self.assertEqual(claim_data["insurer_id"], self.insurer1.id)
        self.assertTrue(claim_data["claim_number"].startswith("CLM-"))
        self.created_claim_id = claim_data["id"]
        TestClaimsAndAdminCustomersIntegration.created_claim_id = claim_data["id"]

        # 2. Cannot file claim against cancelled policy -> 400
        res_cancelled = self.client.post(
            "/api/claims",
            json={
                "policy_id": self.policy_cancelled.id,
                "claim_type": "Accident",
                "incident_date": str(date.today() - timedelta(days=5)),
                "claim_amount": 500.00,
                "description": "Accident damage claim"
            },
            headers=self.cust1_headers
        )
        self.assertEqual(res_cancelled.status_code, 400)
        self.assertIn("active policies", res_cancelled.json()["detail"])

        # 3. Cannot file claim against another customer's policy -> 403
        res_other = self.client.post(
            "/api/claims",
            json={
                "policy_id": self.policy_cust2.id,
                "claim_type": "Medical",
                "incident_date": str(date.today() - timedelta(days=2)),
                "claim_amount": 1000.00,
                "description": "Unauthorized claim attempt"
            },
            headers=self.cust1_headers
        )
        self.assertEqual(res_other.status_code, 403)

    def test_02_customer_view_claims_and_isolation(self):
        """Customer can view own claims, cannot view another customer's claim"""
        claim_id = TestClaimsAndAdminCustomersIntegration.created_claim_id

        # Customer 1 list
        res_list = self.client.get("/api/claims/my", headers=self.cust1_headers)
        self.assertEqual(res_list.status_code, 200)
        c_ids = [c["id"] for c in res_list.json()]
        self.assertIn(claim_id, c_ids)

        # Customer 1 detail
        res_det = self.client.get(f"/api/claims/my/{claim_id}", headers=self.cust1_headers)
        self.assertEqual(res_det.status_code, 200)

        # Customer 2 detail attempt -> 404
        res_cust2_det = self.client.get(f"/api/claims/my/{claim_id}", headers=self.cust2_headers)
        self.assertEqual(res_cust2_det.status_code, 404)

    def test_03_insurer_view_claims_and_lifecycle_transitions(self):
        """Insurer 1 views claim, handles valid status transitions, enforces rejection reason, blocks invalid jumps"""
        claim_id = TestClaimsAndAdminCustomersIntegration.created_claim_id

        # Insurer 1 list
        res_ins1_list = self.client.get("/api/insurer/claims", headers=self.ins1_headers)
        self.assertEqual(res_ins1_list.status_code, 200)
        self.assertIn(claim_id, [c["id"] for c in res_ins1_list.json()])

        # Insurer 2 list (should NOT see Customer 1's claim against Insurer 1)
        res_ins2_list = self.client.get("/api/insurer/claims", headers=self.ins2_headers)
        self.assertEqual(res_ins2_list.status_code, 200)
        self.assertNotIn(claim_id, [c["id"] for c in res_ins2_list.json()])

        # Insurer 2 detail attempt -> 404
        res_ins2_det = self.client.get(f"/api/insurer/claims/{claim_id}", headers=self.ins2_headers)
        self.assertEqual(res_ins2_det.status_code, 404)

        # Invalid jump: SUBMITTED -> SETTLED directly -> 400
        res_invalid_jump = self.client.patch(
            f"/api/insurer/claims/{claim_id}/review",
            json={"status": "SETTLED"},
            headers=self.ins1_headers
        )
        self.assertEqual(res_invalid_jump.status_code, 400)

        # 1. SUBMITTED -> UNDER_REVIEW
        res_rev = self.client.patch(
            f"/api/insurer/claims/{claim_id}/review",
            json={"status": "UNDER_REVIEW", "insurer_response": "Reviewing medical bills and proof"},
            headers=self.ins1_headers
        )
        self.assertEqual(res_rev.status_code, 200)
        self.assertEqual(res_rev.json()["status"], "UNDER_REVIEW")

        # 2. UNDER_REVIEW -> REJECTED without reason -> 400
        res_rej_no_reason = self.client.patch(
            f"/api/insurer/claims/{claim_id}/review",
            json={"status": "REJECTED"},
            headers=self.ins1_headers
        )
        self.assertEqual(res_rej_no_reason.status_code, 400)

        # 3. UNDER_REVIEW -> APPROVED
        res_appr = self.client.patch(
            f"/api/insurer/claims/{claim_id}/review",
            json={"status": "APPROVED", "insurer_response": "Claim approved for full reimbursement"},
            headers=self.ins1_headers
        )
        self.assertEqual(res_appr.status_code, 200)
        self.assertEqual(res_appr.json()["status"], "APPROVED")

        # 4. APPROVED -> SETTLED
        res_sett = self.client.patch(
            f"/api/insurer/claims/{claim_id}/review",
            json={"status": "SETTLED", "insurer_response": "Disbursed $1,250 to customer bank account"},
            headers=self.ins1_headers
        )
        self.assertEqual(res_sett.status_code, 200)
        self.assertEqual(res_sett.json()["status"], "SETTLED")

        # 5. SETTLED -> CLOSED
        res_close = self.client.patch(
            f"/api/insurer/claims/{claim_id}/review",
            json={"status": "CLOSED"},
            headers=self.ins1_headers
        )
        self.assertEqual(res_close.status_code, 200)
        self.assertEqual(res_close.json()["status"], "CLOSED")

    def test_04_admin_claim_and_customer_management(self):
        """Admin views platform claims, lists customers, views customer details, suspends and unsuspends customer"""
        claim_id = TestClaimsAndAdminCustomersIntegration.created_claim_id

        # 1. Admin views platform-wide claims
        res_adm_claims = self.client.get("/api/admin/claims", headers=self.admin_headers)
        self.assertEqual(res_adm_claims.status_code, 200)
        self.assertIn(claim_id, [c["id"] for c in res_adm_claims.json()])

        res_adm_claim_det = self.client.get(f"/api/admin/claims/{claim_id}", headers=self.admin_headers)
        self.assertEqual(res_adm_claim_det.status_code, 200)

        # 2. Admin lists customers
        res_custs = self.client.get("/api/admin/customers", headers=self.admin_headers)
        self.assertEqual(res_custs.status_code, 200)
        cust_ids = [c["id"] for c in res_custs.json()]
        self.assertIn(self.cust1.id, cust_ids)

        # 3. Admin views customer detail
        res_cust_det = self.client.get(f"/api/admin/customers/{self.cust1.id}", headers=self.admin_headers)
        self.assertEqual(res_cust_det.status_code, 200)
        det = res_cust_det.json()
        self.assertEqual(det["full_name"], self.cust1.full_name)
        self.assertGreaterEqual(len(det["policies"]), 1)
        self.assertGreaterEqual(len(det["claims"]), 1)

        # 4. Admin suspends Customer 1
        res_susp = self.client.patch(f"/api/admin/customers/{self.cust1.id}/suspend", headers=self.admin_headers)
        self.assertEqual(res_susp.status_code, 200)
        self.assertFalse(res_susp.json()["is_active"])

        # 5. Suspended Customer 1 fails authentication -> 401
        res_cust_blocked = self.client.get("/api/claims/my", headers=self.cust1_headers)
        self.assertEqual(res_cust_blocked.status_code, 401)

        # 6. Admin unsuspends Customer 1
        res_unsusp = self.client.patch(f"/api/admin/customers/{self.cust1.id}/unsuspend", headers=self.admin_headers)
        self.assertEqual(res_unsusp.status_code, 200)
        self.assertTrue(res_unsusp.json()["is_active"])

        # 7. Restored Customer 1 works again
        res_cust_restored = self.client.get("/api/claims/my", headers=self.cust1_headers)
        self.assertEqual(res_cust_restored.status_code, 200)


if __name__ == "__main__":
    unittest.main()
