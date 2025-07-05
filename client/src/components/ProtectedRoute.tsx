import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to={isAdminRoute ? "/admin/signin" : "/signin"} state={{ from: location }} replace />;
  }

  if (requireAdmin && !currentUser.is_admin) {
    return <Navigate to="/admin/signin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
