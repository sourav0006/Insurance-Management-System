import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import CustomerLayout from './layouts/CustomerLayout';
import InsurerLayout from './layouts/InsurerLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import CustomerDashboardPage from './pages/customer/CustomerDashboardPage';
import MarketplacePage from './pages/customer/MarketplacePage';
import PlanDetailsPage from './pages/customer/PlanDetailsPage';
import ApplyForPlanPage from './pages/customer/ApplyForPlanPage';
import MyApplicationsPage from './pages/customer/MyApplicationsPage';
import ApplicationDetailsPage from './pages/customer/ApplicationDetailsPage';
import MyPoliciesPage from './pages/customer/MyPoliciesPage';
import PolicyDetailsPage from './pages/customer/PolicyDetailsPage';
import CustomerClaimsPage from './pages/customer/CustomerClaimsPage';
import FileClaimPage from './pages/customer/FileClaimPage';
import CustomerClaimDetailPage from './pages/customer/CustomerClaimDetailPage';
import MyQueriesPage from './pages/customer/MyQueriesPage';
import CreateQueryPage from './pages/customer/CreateQueryPage';
import QueryDetailsPage from './pages/customer/QueryDetailsPage';

import InsurerDashboardPage from './pages/insurer/InsurerDashboardPage';
import InsurerProfilePage from './pages/insurer/InsurerProfilePage';
import InsurerPlansPage from './pages/insurer/InsurerPlansPage';
import InsurerApplicationsPage from './pages/insurer/InsurerApplicationsPage';
import InsurerApplicationDetailsPage from './pages/insurer/InsurerApplicationDetailsPage';
import InsurerPoliciesPage from './pages/insurer/InsurerPoliciesPage';
import InsurerPolicyDetailsPage from './pages/insurer/InsurerPolicyDetailsPage';
import InsurerClaimsPage from './pages/insurer/InsurerClaimsPage';
import InsurerClaimDetailPage from './pages/insurer/InsurerClaimDetailPage';
import InsurerQueriesPage from './pages/insurer/InsurerQueriesPage';
import InsurerQueryDetailsPage from './pages/insurer/InsurerQueryDetailsPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminInsurersPage from './pages/admin/AdminInsurersPage';
import AdminInsurerDetailsPage from './pages/admin/AdminInsurerDetailsPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminCustomerDetailPage from './pages/admin/AdminCustomerDetailPage';
import AdminClaimsPage from './pages/admin/AdminClaimsPage';

// Context Provider & Route Guards
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="marketplace" element={<MarketplacePage />} />
            <Route path="marketplace/plans/:planId" element={<PlanDetailsPage />} />
          </Route>

          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
            <Route path="/customer" element={<CustomerLayout />}>
              <Route path="dashboard" element={<CustomerDashboardPage />} />
              <Route path="marketplace" element={<MarketplacePage />} />
              <Route path="marketplace/plans/:planId" element={<PlanDetailsPage />} />
              <Route path="marketplace/plans/:planId/apply" element={<ApplyForPlanPage />} />
              <Route path="applications" element={<MyApplicationsPage />} />
              <Route path="applications/:applicationId" element={<ApplicationDetailsPage />} />
              <Route path="policies" element={<MyPoliciesPage />} />
              <Route path="policies/:policyId" element={<PolicyDetailsPage />} />
              <Route path="claims" element={<CustomerClaimsPage />} />
              <Route path="claims/new" element={<FileClaimPage />} />
              <Route path="claims/:claimId" element={<CustomerClaimDetailPage />} />
              <Route path="queries" element={<MyQueriesPage />} />
              <Route path="queries/new" element={<CreateQueryPage />} />
              <Route path="queries/:queryId" element={<QueryDetailsPage />} />
            </Route>
          </Route>

          {/* Protected Insurer Routes */}
          <Route element={<ProtectedRoute allowedRoles={['INSURER']} />}>
            <Route path="/insurer" element={<InsurerLayout />}>
              <Route path="dashboard" element={<InsurerDashboardPage />} />
              <Route path="profile" element={<InsurerProfilePage />} />
              <Route path="plans" element={<InsurerPlansPage />} />
              <Route path="applications" element={<InsurerApplicationsPage />} />
              <Route path="applications/:applicationId" element={<InsurerApplicationDetailsPage />} />
              <Route path="policies" element={<InsurerPoliciesPage />} />
              <Route path="policies/:policyId" element={<InsurerPolicyDetailsPage />} />
              <Route path="claims" element={<InsurerClaimsPage />} />
              <Route path="claims/:claimId" element={<InsurerClaimDetailPage />} />
              <Route path="queries" element={<InsurerQueriesPage />} />
              <Route path="queries/:queryId" element={<InsurerQueryDetailsPage />} />
            </Route>
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="insurers" element={<AdminInsurersPage />} />
              <Route path="insurers/:insurerId" element={<AdminInsurerDetailsPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="customers/:customerId" element={<AdminCustomerDetailPage />} />
              <Route path="claims" element={<AdminClaimsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
