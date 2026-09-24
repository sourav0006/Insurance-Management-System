import os
import sys
import unittest
import uuid
from datetime import date
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database.database import SessionLocal
from app.models.user import User, UserRole
from app.models.insurer_profile import InsurerProfile, InsurerVerificationStatus
from app.models.insurance_plan import InsurancePlan, PlanStatus
from app.models.insurance_application import InsuranceApplication, ApplicationStatus
from app.models.policy import Policy, PolicyStatus
from app.models.query import CustomerQuery, QueryStatus
from app.models.notification import Notification
from app.core.security import get_password_hash, create_access_token


class TestQueryNotificationIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        cls.prefix = f"qn_{uuid.uuid4().hex[:8]}"

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

        # Create Admin
        cls.admin, cls.admin_headers = create_user(UserRole.ADMIN, "admin")

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

        # Create Plan
        cls.plan_a = InsurancePlan(
            insurer_id=cls.insurer_a.id,
            plan_name=f"Plan A {cls.prefix}",
            plan_code=f"PLN-{cls.prefix}-A".upper(),
            category="Health Insurance",
            description="Test plan description",
            coverage_amount=500000,
            premium_amount=6000,
            premium_frequency="Yearly",
            policy_term_years=1,
            eligibility_min_age=18,
            eligibility_max_age=65,
            status=PlanStatus.ACTIVE
        )
        cls.db.add(cls.plan_a)
        cls.db.commit()
        cls.db.refresh(cls.plan_a)

    @classmethod
    def tearDownClass(cls):
        cls.db.query(CustomerQuery).filter((CustomerQuery.customer_id == cls.customer_1.id) | (CustomerQuery.customer_id == cls.customer_2.id)).delete(synchronize_session=False)
        cls.db.query(Notification).filter((Notification.user_id == cls.customer_1.id) | (Notification.user_id == cls.customer_2.id) | (Notification.user_id == cls.insurer_a.id) | (Notification.user_id == cls.insurer_b.id) | (Notification.user_id == cls.admin.id)).delete(synchronize_session=False)
        cls.db.query(Policy).filter(Policy.policy_number.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(InsuranceApplication).filter(InsuranceApplication.application_number.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(InsurancePlan).filter(InsurancePlan.plan_code.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(InsurerProfile).filter(InsurerProfile.license_number.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(User).filter(User.email.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.commit()
        cls.db.close()

    def test_01_unauthenticated_endpoints(self):
        """Unauthenticated requests to queries and notifications return 401"""
        self.assertEqual(self.client.get("/api/queries/insurers").status_code, 401)
        self.assertEqual(self.client.get("/api/queries/my").status_code, 401)
        self.assertEqual(self.client.get("/api/insurer/queries").status_code, 401)
        self.assertEqual(self.client.get("/api/notifications").status_code, 401)

    def test_02_customer_list_approved_insurers(self):
        """Customer can list approved insurers only"""
        res = self.client.get("/api/queries/insurers", headers=self.cust1_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        insurer_ids = [item["insurer_id"] for item in data]
        self.assertIn(self.insurer_a.id, insurer_ids)
        self.assertIn(self.insurer_b.id, insurer_ids)
        self.assertNotIn(self.insurer_c.id, insurer_ids)

    def test_03_customer_create_query_workflow(self):
        """Customer creates query -> gets OPEN status -> insurer gets notification"""
        res = self.client.post(
            "/api/queries",
            json={
                "insurer_id": self.insurer_a.id,
                "subject": "Coverage Clarification",
                "message": "Does this plan cover pre-existing conditions?"
            },
            headers=self.cust1_headers
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["subject"], "Coverage Clarification")
        self.assertEqual(data["status"], "OPEN")
        self.assertEqual(data["customer_id"], self.customer_1.id)
        self.assertEqual(data["insurer_id"], self.insurer_a.id)
        query_id = data["id"]

        # Check Insurer A notification received
        res_notif = self.client.get("/api/notifications", headers=self.ins_a_headers)
        self.assertEqual(res_notif.status_code, 200)
        notifs = res_notif.json()
        types = [n["notification_type"] for n in notifs]
        self.assertIn("QUERY_RECEIVED", types)

        # Customer 1 view own query
        res_detail = self.client.get(f"/api/queries/my/{query_id}", headers=self.cust1_headers)
        self.assertEqual(res_detail.status_code, 200)

        # Customer 2 view Customer 1 query -> 404
        res_cust2 = self.client.get(f"/api/queries/my/{query_id}", headers=self.cust2_headers)
        self.assertEqual(res_cust2.status_code, 404)

        # Customer cannot access insurer query endpoint -> 403
        self.assertEqual(self.client.get("/api/insurer/queries", headers=self.cust1_headers).status_code, 403)

    def test_04_insurer_response_workflow(self):
        """Insurer A views query, responds, status becomes RESPONDED, customer gets notification"""
        # Create a query from Customer 1 to Insurer A
        res_create = self.client.post(
            "/api/queries",
            json={
                "insurer_id": self.insurer_a.id,
                "subject": "Claim Settlement Time",
                "message": "What is the average claim turnaround time?"
            },
            headers=self.cust1_headers
        )
        query_id = res_create.json()["id"]

        # Insurer B tries to view Insurer A query -> 404
        self.assertEqual(self.client.get(f"/api/insurer/queries/{query_id}", headers=self.ins_b_headers).status_code, 404)

        # Pending insurer tries to access query endpoint -> 403
        self.assertEqual(self.client.get("/api/insurer/queries", headers=self.ins_c_headers).status_code, 403)

        # Empty response -> 400
        self.assertEqual(
            self.client.patch(f"/api/insurer/queries/{query_id}/respond", json={"response": "   "}, headers=self.ins_a_headers).status_code,
            400
        )

        # Insurer A responds to query
        res_resp = self.client.patch(
            f"/api/insurer/queries/{query_id}/respond",
            json={"response": "Claims are settled within 7 business days."},
            headers=self.ins_a_headers
        )
        self.assertEqual(res_resp.status_code, 200)
        resp_data = res_resp.json()
        self.assertEqual(resp_data["status"], "RESPONDED")
        self.assertEqual(resp_data["response"], "Claims are settled within 7 business days.")
        self.assertIsNotNone(resp_data["responded_at"])

        # Customer 1 notification for QUERY_RESPONDED
        res_notif = self.client.get("/api/notifications", headers=self.cust1_headers)
        types = [n["notification_type"] for n in res_notif.json()]
        self.assertIn("QUERY_RESPONDED", types)

    def test_05_query_close_workflow(self):
        """Customer/Insurer can close query; closed query cannot be responded to"""
        res_create = self.client.post(
            "/api/queries",
            json={
                "insurer_id": self.insurer_a.id,
                "subject": "Discount Enquiry",
                "message": "Are there family discounts available?"
            },
            headers=self.cust1_headers
        )
        query_id = res_create.json()["id"]

        # Customer closes query
        res_close = self.client.patch(f"/api/queries/my/{query_id}/close", headers=self.cust1_headers)
        self.assertEqual(res_close.status_code, 200)
        self.assertEqual(res_close.json()["status"], "CLOSED")

        # Insurer A attempts to respond to CLOSED query -> 400
        self.assertEqual(
            self.client.patch(f"/api/insurer/queries/{query_id}/respond", json={"response": "Yes, 10% off."}, headers=self.ins_a_headers).status_code,
            400
        )

    def test_06_business_events_trigger_notifications(self):
        """Verify notification generation for application submission/approval/rejection, policy creation, insurer verification, registration"""
        # 1. New insurer registration triggers admin notification
        reg_email = f"new_ins_{self.prefix}@test.com"
        reg_lic = f"LIC-NEW-{self.prefix}"
        res_reg = self.client.post(
            "/api/auth/register/insurer",
            json={
                "full_name": "New Insurer",
                "email": reg_email,
                "password": "Password@123",
                "confirm_password": "Password@123",
                "company_name": "New Insurer Co",
                "license_number": reg_lic,
                "contact_email": reg_email
            }
        )
        self.assertEqual(res_reg.status_code, 201)
        new_ins_user_id = res_reg.json()["user"]["id"]

        # Admin gets notification
        res_admin_notifs = self.client.get("/api/notifications", headers=self.admin_headers)
        self.assertEqual(res_admin_notifs.status_code, 200)
        admin_types = [n["notification_type"] for n in res_admin_notifs.json()]
        self.assertIn("INSURER_REGISTERED", admin_types)

        # 2. Admin approves insurer -> Insurer gets INSURER_APPROVED notification
        new_ins_headers = {"Authorization": f"Bearer {create_access_token(new_ins_user_id, role='INSURER')}"}
        res_appr = self.client.patch(f"/api/admin/insurers/{new_ins_user_id}/approve", headers=self.admin_headers)
        self.assertEqual(res_appr.status_code, 200)

        res_ins_notifs = self.client.get("/api/notifications", headers=new_ins_headers)
        self.assertEqual(res_ins_notifs.status_code, 200)
        self.assertIn("INSURER_APPROVED", [n["notification_type"] for n in res_ins_notifs.json()])

        # Admin rejects insurer -> INSURER_REJECTED
        res_rej_ins = self.client.patch(
            f"/api/admin/insurers/{new_ins_user_id}/reject",
            json={"rejection_reason": "Incomplete documentation"},
            headers=self.admin_headers
        )
        self.assertEqual(res_rej_ins.status_code, 200)
        res_ins_notifs2 = self.client.get("/api/notifications", headers=new_ins_headers)
        self.assertIn("INSURER_REJECTED", [n["notification_type"] for n in res_ins_notifs2.json()])

        # 3. Customer submits application -> Insurer gets APPLICATION_SUBMITTED
        res_app_sub = self.client.post(
            "/api/applications",
            json={
                "plan_id": self.plan_a.id,
                "date_of_birth": "1992-08-20",
                "gender": "Female",
                "address": "456 Test Ave",
                "city": "Pune",
                "state": "Maharashtra",
                "pincode": "411001",
                "nominee_name": "John Doe",
                "nominee_relationship": "Spouse",
                "nominee_phone": "+919876543210",
                "occupation": "Doctor",
                "annual_income": 1500000,
                "health_declaration": "No medical history"
            },
            headers=self.cust2_headers
        )
        self.assertEqual(res_app_sub.status_code, 201)
        app_id = res_app_sub.json()["id"]

        res_a_notif = self.client.get("/api/notifications", headers=self.ins_a_headers)
        self.assertIn("APPLICATION_SUBMITTED", [n["notification_type"] for n in res_a_notif.json()])

        # 4. Insurer A transitions application to UNDER_REVIEW then APPROVED -> Customer gets APPLICATION_APPROVED
        res_ur = self.client.patch(
            f"/api/insurer/applications/{app_id}/status",
            json={"status": "UNDER_REVIEW"},
            headers=self.ins_a_headers
        )
        self.assertEqual(res_ur.status_code, 200)

        res_app_approve = self.client.patch(
            f"/api/insurer/applications/{app_id}/status",
            json={"status": "APPROVED"},
            headers=self.ins_a_headers
        )
        self.assertEqual(res_app_approve.status_code, 200)

        res_c2_notif = self.client.get("/api/notifications", headers=self.cust2_headers)
        self.assertIn("APPLICATION_APPROVED", [n["notification_type"] for n in res_c2_notif.json()])

        # 5. Policy creation -> Customer gets POLICY_CREATED
        res_pol = self.client.post(
            "/api/policies",
            json={"application_id": app_id},
            headers=self.ins_a_headers
        )
        self.assertEqual(res_pol.status_code, 201)

        res_c2_notif2 = self.client.get("/api/notifications", headers=self.cust2_headers)
        self.assertIn("POLICY_CREATED", [n["notification_type"] for n in res_c2_notif2.json()])

    def test_07_notification_read_management(self):
        """User can list notifications, mark single notification read, mark all read, and unread count updates correctly"""
        res_list = self.client.get("/api/notifications", headers=self.cust2_headers)
        self.assertEqual(res_list.status_code, 200)
        notifs = res_list.json()
        self.assertTrue(len(notifs) >= 2)

        unread_before = sum(1 for n in notifs if not n["is_read"])
        self.assertTrue(unread_before > 0)

        single_notif_id = notifs[0]["id"]

        # Customer 1 attempts to mark Customer 2's notification read -> 404
        self.assertEqual(
            self.client.patch(f"/api/notifications/{single_notif_id}/read", headers=self.cust1_headers).status_code,
            404
        )

        # Customer 2 marks single notification read
        res_read_one = self.client.patch(f"/api/notifications/{single_notif_id}/read", headers=self.cust2_headers)
        self.assertEqual(res_read_one.status_code, 200)
        self.assertTrue(res_read_one.json()["is_read"])

        # Customer 2 marks all read
        res_read_all = self.client.patch("/api/notifications/read-all", headers=self.cust2_headers)
        self.assertEqual(res_read_all.status_code, 200)

        # Verify all are read now
        res_list_after = self.client.get("/api/notifications", headers=self.cust2_headers)
        unread_after = sum(1 for n in res_list_after.json() if not n["is_read"])
        self.assertEqual(unread_after, 0)


if __name__ == "__main__":
    unittest.main()
