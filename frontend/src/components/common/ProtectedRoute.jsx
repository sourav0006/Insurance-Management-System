import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization if specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized user to their own role dashboard
    if (user.role === 'CUSTOMER') {
      return <Navigate to="/customer/dashboard" replace />;
    } else if (user.role === 'INSURER') {
      return <Navigate to="/insurer/dashboard" replace />;
    } else if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
