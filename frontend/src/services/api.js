import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token when token exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('insurmanage_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle HTTP 401 Unauthorized (expired or invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('insurmanage_token');
      // If not already on /login page, redirect to login
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getMarketplacePlans = async (params = {}) => {
  const response = await api.get('/marketplace/plans', { params });
  return response.data;
};

export const getMarketplacePlanById = async (planId) => {
  const response = await api.get(`/marketplace/plans/${planId}`);
  return response.data;
};

// Customer Application APIs
export const createApplication = async (data) => {
  const response = await api.post('/applications', data);
  return response.data;
};

export const getMyApplications = async () => {
  const response = await api.get('/applications/my');
  return response.data;
};

export const getMyApplicationById = async (applicationId) => {
  const response = await api.get(`/applications/my/${applicationId}`);
  return response.data;
};

// Insurer Application Review APIs
export const getInsurerApplications = async (params = {}) => {
  const response = await api.get('/insurer/applications', { params });
  return response.data;
};

export const getInsurerApplicationById = async (applicationId) => {
  const response = await api.get(`/insurer/applications/${applicationId}`);
  return response.data;
};

export const updateApplicationStatus = async (applicationId, data) => {
  const response = await api.patch(`/insurer/applications/${applicationId}/status`, data);
  return response.data;
};

// Customer Policy APIs
export const getMyPolicies = async () => {
  const response = await api.get('/policies/my');
  return response.data;
};

export const getMyPolicyById = async (policyId) => {
  const response = await api.get(`/policies/my/${policyId}`);
  return response.data;
};

// Insurer Policy APIs
export const createPolicy = async (data) => {
  const response = await api.post('/policies', data);
  return response.data;
};

export const getInsurerPolicies = async (params = {}) => {
  const response = await api.get('/insurer/policies', { params });
  return response.data;
};

export const getInsurerPolicyById = async (policyId) => {
  const response = await api.get(`/insurer/policies/${policyId}`);
  return response.data;
};

export const updatePolicyStatus = async (policyId, data) => {
  const response = await api.patch(`/insurer/policies/${policyId}/status`, data);
  return response.data;
};

export const getPolicyByApplicationId = async (applicationId) => {
  try {
    const response = await api.get(`/policies/by-application/${applicationId}`);
    return response.data;
  } catch (err) {
    return null;
  }
};

// Customer Query APIs
export const getApprovedInsurersForQueries = async () => {
  const response = await api.get('/queries/insurers');
  return response.data;
};

export const createQuery = async (data) => {
  const response = await api.post('/queries', data);
  return response.data;
};

export const getMyQueries = async () => {
  const response = await api.get('/queries/my');
  return response.data;
};

export const getMyQueryById = async (queryId) => {
  const response = await api.get(`/queries/my/${queryId}`);
  return response.data;
};

export const closeMyQuery = async (queryId) => {
  const response = await api.patch(`/queries/my/${queryId}/close`);
  return response.data;
};

// Insurer Query APIs
export const getInsurerQueries = async () => {
  const response = await api.get('/insurer/queries');
  return response.data;
};

export const getInsurerQueryById = async (queryId) => {
  const response = await api.get(`/insurer/queries/${queryId}`);
  return response.data;
};

export const respondToQuery = async (queryId, responseText) => {
  const response = await api.patch(`/insurer/queries/${queryId}/respond`, { response: responseText });
  return response.data;
};

export const closeInsurerQuery = async (queryId) => {
  const response = await api.patch(`/insurer/queries/${queryId}/close`);
  return response.data;
};

// Notification APIs
export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

// Admin Dashboard Stats API
export const getAdminDashboardStats = async () => {
  const response = await api.get('/admin/dashboard/stats');
  return response.data;
};

// Admin Insurer Management APIs
export const getAdminInsurers = async (params = {}) => {
  const response = await api.get('/admin/insurers', { params });
  return response.data;
};

export const getAdminInsurerById = async (insurerId) => {
  const response = await api.get(`/admin/insurers/${insurerId}`);
  return response.data;
};

export const approveInsurer = async (insurerId) => {
  const response = await api.patch(`/admin/insurers/${insurerId}/approve`);
  return response.data;
};

export const rejectInsurer = async (insurerId, rejectionReason) => {
  const response = await api.patch(`/admin/insurers/${insurerId}/reject`, { rejection_reason: rejectionReason });
  return response.data;
};

export const suspendInsurer = async (insurerId, suspensionReason) => {
  const response = await api.patch(`/admin/insurers/${insurerId}/suspend`, { suspension_reason: suspensionReason });
  return response.data;
};

export const reinstateInsurer = async (insurerId) => {
  const response = await api.patch(`/admin/insurers/${insurerId}/reinstate`);
  return response.data;
};

// Customer Claims APIs
export const createClaim = async (data) => {
  const response = await api.post('/claims', data);
  return response.data;
};

export const getMyClaims = async () => {
  const response = await api.get('/claims/my');
  return response.data;
};

export const getMyClaimById = async (claimId) => {
  const response = await api.get(`/claims/my/${claimId}`);
  return response.data;
};

// Insurer Claims APIs
export const getInsurerClaims = async (params = {}) => {
  const response = await api.get('/insurer/claims', { params });
  return response.data;
};

export const getInsurerClaimById = async (claimId) => {
  const response = await api.get(`/insurer/claims/${claimId}`);
  return response.data;
};

export const reviewClaim = async (claimId, data) => {
  const response = await api.patch(`/insurer/claims/${claimId}/review`, data);
  return response.data;
};

// Admin Claims Visibility APIs
export const getAdminClaims = async (params = {}) => {
  const response = await api.get('/admin/claims', { params });
  return response.data;
};

export const getAdminClaimById = async (claimId) => {
  const response = await api.get(`/admin/claims/${claimId}`);
  return response.data;
};

// Admin Customer Management APIs
export const getAdminCustomers = async (params = {}) => {
  const response = await api.get('/admin/customers', { params });
  return response.data;
};

export const getAdminCustomerById = async (customerId) => {
  const response = await api.get(`/admin/customers/${customerId}`);
  return response.data;
};

export const suspendCustomer = async (customerId) => {
  const response = await api.patch(`/admin/customers/${customerId}/suspend`);
  return response.data;
};

export const unsuspendCustomer = async (customerId) => {
  const response = await api.patch(`/admin/customers/${customerId}/unsuspend`);
  return response.data;
};

export default api;




