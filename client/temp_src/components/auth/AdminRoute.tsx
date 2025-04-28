import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
// Error monitoring removed

type AdminRouteProps = {
  children: React.ReactNode;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    // Log unauthorized access attempt
    console.warn('Unauthorized admin access attempt', {
      userId: user?.id,
      userRole: user?.role || 'unauthenticated',
      path: window.location.pathname
    });
    
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;