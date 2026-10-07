import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check if user has a valid username (not starting with our placeholder 'pending-')
  const hasValidUsername = user?.username && !user.username.startsWith('pending-');
  const isUsernameSetupRoute = location.pathname === '/onboarding/username';

  // If they don't have a valid username, force them to the setup screen unless they are already there
  if (!hasValidUsername && !isUsernameSetupRoute) {
    return <Navigate to="/onboarding/username" state={{ from: location }} replace />;
  }

  // If they HAVE a valid username but are trying to access the setup screen, send them home
  if (hasValidUsername && isUsernameSetupRoute) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;