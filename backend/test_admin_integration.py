import os
import sys
import unittest
import uuid
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database.database import SessionLocal
from app.models.user import User, UserRole
from app.models.insurer_profile import InsurerProfile, InsurerVerificationStatus
from app.models.notification import Notification
from app.core.security import get_password_hash, create_access_token


class TestAdminIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()
        cls.prefix = f"adm_{uuid.uuid4().hex[:8]}"

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

        # Create Customer
        cls.customer, cls.cust_headers = create_user(UserRole.CUSTOMER, "cust")

        # Create Insurer A (Pending)
        cls.insurer_a, cls.ins_a_headers = create_user(UserRole.INSURER, "ins_a")
        cls.profile_a = InsurerProfile(
            user_id=cls.insurer_a.id,
            company_name=f"Company A {cls.prefix}",
            license_number=f"LIC-A-{cls.prefix}",
            verification_status=InsurerVerificationStatus.PENDING
        )
        cls.db.add(cls.profile_a)

        # Create Insurer B (Pending)
        cls.insurer_b, cls.ins_b_headers = create_user(UserRole.INSURER, "ins_b")
        cls.profile_b = InsurerProfile(
            user_id=cls.insurer_b.id,
            company_name=f"Company B {cls.prefix}",
            license_number=f"LIC-B-{cls.prefix}",
            verification_status=InsurerVerificationStatus.PENDING
        )
        cls.db.add(cls.profile_b)

        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.query(Notification).filter(
            (Notification.user_id == cls.admin.id) |
            (Notification.user_id == cls.insurer_a.id) |
            (Notification.user_id == cls.insurer_b.id)
        ).delete(synchronize_session=False)
        cls.db.query(InsurerProfile).filter(InsurerProfile.license_number.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.query(User).filter(User.email.like(f"%{cls.prefix}%")).delete(synchronize_session=False)
        cls.db.commit()
        cls.db.close()

    def test_01_admin_login_and_unauthenticated_security(self):
        """Admin login works; Unauthenticated access to admin endpoints returns 401"""
        res_login = self.client.post("/api/auth/login", json={"email": self.admin.email, "password": "Password@123"})
        self.assertEqual(res_login.status_code, 200)
        self.assertEqual(res_login.json()["user"]["role"], "ADMIN")

        # Unauthenticated endpoints -> 401
        self.assertEqual(self.client.get("/api/admin/dashboard/stats").status_code, 401)
        self.assertEqual(self.client.get("/api/admin/insurers").status_code, 401)

    def test_02_role_authorization_controls(self):
        """Customer and Insurer receive 403 on admin endpoints"""
        # Customer access -> 403
        self.assertEqual(self.client.get("/api/admin/dashboard/stats", headers=self.cust_headers).status_code, 403)
        self.assertEqual(self.client.get("/api/admin/insurers", headers=self.cust_headers).status_code, 403)
        self.assertEqual(self.client.patch(f"/api/admin/insurers/{self.insurer_a.id}/approve", headers=self.cust_headers).status_code, 403)

        # Insurer access -> 403
        self.assertEqual(self.client.get("/api/admin/dashboard/stats", headers=self.ins_a_headers).status_code, 403)
        self.assertEqual(self.client.patch(f"/api/admin/insurers/{self.insurer_b.id}/approve", headers=self.ins_a_headers).status_code, 403)

    def test_03_admin_get_dashboard_stats(self):
        """Admin can retrieve dashboard stats with valid numeric counts"""
        res = self.client.get("/api/admin/dashboard/stats", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total_users", data)
        self.assertIn("total_customers", data)
        self.assertIn("total_insurers", data)
        self.assertIn("pending_insurers", data)
        self.assertIn("approved_insurers", data)
        self.assertIn("active_plans", data)
        self.assertIn("total_applications", data)
        self.assertIn("active_policies", data)
        self.assertIn("open_queries", data)
        self.assertGreaterEqual(data["total_users"], 1)

    def test_04_admin_list_and_detail_insurers(self):
        """Admin can list insurers and view detail by ID"""
        res = self.client.get("/api/admin/insurers", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        insurers = res.json()
        ids = [i["user_id"] for i in insurers]
        self.assertIn(self.insurer_a.id, ids)

        # Detail view
        res_detail = self.client.get(f"/api/admin/insurers/{self.insurer_a.id}", headers=self.admin_headers)
        self.assertEqual(res_detail.status_code, 200)
        self.assertEqual(res_detail.json()["company_name"], self.profile_a.company_name)

    def test_05_admin_insurer_verification_lifecycle(self):
        """Admin approves, suspends, reinstates, and rejects insurers with reasons"""
        # 1. Approve Insurer A
        res_appr = self.client.patch(f"/api/admin/insurers/{self.insurer_a.id}/approve", headers=self.admin_headers)
        self.assertEqual(res_appr.status_code, 200)
        self.assertEqual(res_appr.json()["verification_status"], "APPROVED")

        # 2. Suspend Insurer A (missing reason fails -> 422/400)
        res_susp_fail = self.client.patch(f"/api/admin/insurers/{self.insurer_a.id}/suspend", json={"suspension_reason": "  "}, headers=self.admin_headers)
        self.assertEqual(res_susp_fail.status_code, 422)

        res_susp = self.client.patch(
            f"/api/admin/insurers/{self.insurer_a.id}/suspend",
            json={"suspension_reason": "Compliance review required"},
            headers=self.admin_headers
        )
        self.assertEqual(res_susp.status_code, 200)
        self.assertEqual(res_susp.json()["verification_status"], "SUSPENDED")

        # 3. Reinstate Insurer A
        res_reinst = self.client.patch(f"/api/admin/insurers/{self.insurer_a.id}/reinstate", headers=self.admin_headers)
        self.assertEqual(res_reinst.status_code, 200)
        self.assertEqual(res_reinst.json()["verification_status"], "APPROVED")

        # 4. Reject Insurer B (with reason)
        res_rej = self.client.patch(
            f"/api/admin/insurers/{self.insurer_b.id}/reject",
            json={"rejection_reason": "Invalid regulatory license"},
            headers=self.admin_headers
        )
        self.assertEqual(res_rej.status_code, 200)
        self.assertEqual(res_rej.json()["verification_status"], "REJECTED")
        self.assertEqual(res_rej.json()["rejection_reason"], "Invalid regulatory license")

    def test_06_admin_notification_trigger_and_isolation(self):
        """New insurer registration triggers INSURER_REGISTERED notification for Admin"""
        new_email = f"new_reg_{self.prefix}@test.com"
        new_lic = f"LIC-NEW-{self.prefix}"
        res_reg = self.client.post(
            "/api/auth/register/insurer",
            json={
                "full_name": "New Vendor",
                "email": new_email,
                "password": "Password@123",
                "confirm_password": "Password@123",
                "company_name": "New Vendor Co",
                "license_number": new_lic
            }
        )
        self.assertEqual(res_reg.status_code, 201)

        # Admin gets notification
        res_notif = self.client.get("/api/notifications", headers=self.admin_headers)
        self.assertEqual(res_notif.status_code, 200)
        types = [n["notification_type"] for n in res_notif.json()]
        self.assertIn("INSURER_REGISTERED", types)

        # Customer does not see Admin notifications
        res_cust_notif = self.client.get("/api/notifications", headers=self.cust_headers)
        cust_types = [n["notification_type"] for n in res_cust_notif.json()]
        self.assertNotIn("INSURER_REGISTERED", cust_types)


if __name__ == "__main__":
    unittest.main()
