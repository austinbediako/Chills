import React from 'react';
import { useAuth } from '../hooks/useAuth';
import PublicHomePage from './PublicHomePage';
import AuthenticatedHomePage from './AuthenticatedHomePage';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <AuthenticatedHomePage />;
  }
  
  return <PublicHomePage />;
};

export default HomePage;