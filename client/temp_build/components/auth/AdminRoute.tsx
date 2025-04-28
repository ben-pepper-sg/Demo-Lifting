import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as Sentry from '@sentry/react';

type AdminRouteProps = {
  children: React.ReactNode;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    // Log unauthorized access attempt to Sentry
    Sentry.captureMessage('Unauthorized admin access attempt', {
      level: 'warning',
      tags: {
        component: 'AdminRoute',
        action: 'accessAttempt'
      },
      extra: {
        userId: user?.id,
        userRole: user?.role || 'unauthenticated',
        path: window.location.pathname
      }
    });
    
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;