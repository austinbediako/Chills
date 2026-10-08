import React, { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../hooks/useAuth';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const isAuthPage = location.pathname.startsWith('/auth');
  const isProfileSetupPage = location.pathname === '/onboarding/username';

  // Strict profile completion guard: If authenticated and profile is not set, no authenticated pages should be accessible
  const hasIncompleteProfile = isAuthenticated && (!user?.username || user.username.startsWith('pending-'));
  if (hasIncompleteProfile && !isProfileSetupPage && !isAuthPage) {
    return <Navigate to="/onboarding/username" state={{ from: location }} replace />;
  }

  const isOnboardingPage = location.pathname.startsWith('/onboarding');
  const isWritePage = location.pathname.startsWith('/write');
  const isFeedPage = location.pathname.startsWith('/feed');
  const isExplorePage = location.pathname.startsWith('/explore');
  const isProfilePage = location.pathname.startsWith('/@') || location.pathname.startsWith('/authors/');
  const isFullPage = isAuthPage || isOnboardingPage || isWritePage;
  const isFullWidthPage = isFullPage || isFeedPage || isExplorePage || isProfilePage;
  // Hide top floating capsule navbar on dedicated timeline/explore/profile views to allow native top-0 sticky headers
  const isAppView = isFeedPage || isExplorePage || isProfilePage || isOnboardingPage || isWritePage;
  const showNavbar = !isAppView && (!isAuthenticated || location.pathname === '/');
  const needsTopPadding = showNavbar && !isAppView;

  return (
    <div className="flex min-h-screen flex-col bg-light-100 dark:bg-dark-100 transition-colors duration-300">
      {showNavbar && <Navbar toggleSidebar={toggleSidebar} />}
      
      <div className="flex flex-1">
        {isAuthenticated && !isFullPage && (
          <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} userRole={user?.role || 'user'} />
        )}
        
        <main className={`flex-1 flex flex-col min-w-0 ${needsTopPadding ? 'pt-20' : 'pt-0'}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`flex-1 flex flex-col min-w-0 ${isFullWidthPage ? 'w-full' : 'container-custom py-6'}`}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;