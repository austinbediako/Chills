import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PublicHomePage from './PublicHomePage';
import AuthenticatedHomePage from './AuthenticatedHomePage';

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated) {
    if (!user?.username || user.username.startsWith('pending-')) {
      return <Navigate to="/onboarding/username" replace />;
    }
    return <AuthenticatedHomePage />;
  }
  
  return <PublicHomePage />;
};

export default HomePage;