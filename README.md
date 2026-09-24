# InsurManage — Multi-Vendor Insurance Management System

InsurManage is a multi-vendor Insurance Management System built for an academic Software Engineering project. It provides a complete workflow for Customers, Insurer Vendors, and Platform Administrators.

---

## 🌟 Key Roles & Features

### 1. Customer
- **Authentication**: Public registration & JWT-based login.
- **Marketplace**: Browse active insurance plans from verified insurers with search, filtering, and sorting.
- **Insurance Applications**: Submit detailed applications for selected plans, with automated status tracking (`SUBMITTED` &rarr; `UNDER_REVIEW` &rarr; `APPROVED` / `REJECTED`).
- **Policy Management**: View issued active/expired policies with historical financial snapshots.
- **Customer Support**: Raise inquiries to approved insurers and view responses.
- **In-App Notifications**: Real-time database-backed notifications for application status updates, policy issuance, and query responses.

### 2. Insurer Vendor
- **Vendor Registration**: Registration places vendor in `PENDING` verification status.
- **Company Profile**: Manage company information, description, and contact metadata.
- **Plan Management**: Create, update, and toggle status (`DRAFT`, `ACTIVE`, `INACTIVE`) for insurance plans.
- **Application Review**: Review customer applications, transition status, and provide mandatory rejection reasons.
- **Policy Issuance**: Issue unique policies (`POL-YYYY-XXXXXX`) for approved applications with automatic date and financial calculations.
- **Customer Inquiry Response**: Answer customer support queries and manage ticket lifecycles.
- **In-App Notifications**: Real-time alerts for new applications, queries, and verification approvals.

### 3. Platform Administrator
- **Platform Control & Statistics**: Live dashboard metrics (`total_users`, `total_customers`, `total_insurers`, `pending_insurers`, `approved_insurers`, `active_plans`, `total_applications`, `active_policies`, `open_queries`).
- **Insurer Verification**: Review vendor applications and control state transitions (`PENDING` &rarr; `APPROVED` / `REJECTED`, `APPROVED` &rarr; `SUSPENDED`, `REJECTED`/`SUSPENDED` &rarr; `APPROVED`).
- **In-App Notifications**: Real-time notifications for new insurer vendor registrations.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.9+, FastAPI, SQLAlchemy 2.x, PostgreSQL, Alembic, Pydantic v2, `python-jose[cryptography]`, `passlib[bcrypt]`, `bcrypt==3.2.2`.
- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, React Hook Form, Zod, Lucide React icons.

---

## 🚀 Getting Started

### Prerequisites
- PostgreSQL database server running on `localhost:5432` with database `insurmanage`.
- Python 3.9+ and Node.js 18+.

### 1. Backend Setup & Database Migration
```bash
cd backend

# Create & activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed Initial Platform Admin (Runs automatically on server start or via seed script)
# Default Admin Credentials:
# Email: admin@insurmanage.com
# Password: Admin@123

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

### 3. Running Integration Tests
```bash
cd backend
source venv/bin/activate

# Execute all backend integration test suites
python test_application_integration.py
python test_marketplace_integration.py
python test_policy_integration.py
python test_query_notification_integration.py
python test_admin_integration.py
```

### 4. Production Build
```bash
cd frontend
npm run build
```

---

## 🔒 Seeded Credentials

| Role | Email | Password |
|---|---|---|
| Platform Admin | `admin@insurmanage.com` | `Admin@123` |

---

## 📌 Scope & Architecture Constraints

This is an academic software engineering project focused on clean, simple, and maintainable architecture.
- **In-App Notifications**: Strictly database-backed in-app notifications.
- **Out of Scope**: External payment gateways, claims management, email/SMS gateways, push notifications, WebSockets, Celery, Redis, microservices, or external APIs.
