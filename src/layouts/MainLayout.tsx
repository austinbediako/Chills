import React, { useEffect, useCallback } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { toggleSidebar as toggleSidebarAction, closeSidebar as closeSidebarAction } from '../redux/slices/uiSlice';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import { useAuth } from '../hooks/useAuth';

const MainLayout: React.FC = () => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const toggleSidebar = useCallback(() => {
    dispatch(toggleSidebarAction());
  }, [dispatch]);

  const closeSidebar = useCallback(() => {
    dispatch(closeSidebarAction());
  }, [dispatch]);

  // Close mobile sidebar immediately whenever route or query changes
  useEffect(() => {
    dispatch(closeSidebarAction());
  }, [location.pathname, location.search, dispatch]);

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
  const isProfilePage = 
    location.pathname.startsWith('/@') || 
    location.pathname.startsWith('/authors') || 
    location.pathname.startsWith('/author') || 
    location.pathname === '/profile';
  const isFullPage = isAuthPage || isOnboardingPage || isWritePage;
  const isFullWidthPage = isFullPage || isFeedPage || isExplorePage || isProfilePage;

  // Dedicated app views have custom native sticky headers (Feed timeline, Explore search, Author banner, Profile)
  const isAppView = isFeedPage || isExplorePage || isProfilePage || isOnboardingPage || isWritePage;
  
  // Desktop navbar: only shown on public unauthenticated views. When logged in, the fixed desktop sidebar is always used.
  const showDesktopNavbar = !isAppView && !isAuthenticated;
  // Mobile navbar: shown on all non-appview pages so mobile users can always access menu, theme, and logo
  const showMobileNavbar = !isAppView;

  const mainTopPaddingClass = !isAppView
    ? (showDesktopNavbar ? 'pt-16 sm:pt-20' : 'pt-16 sm:pt-20 lg:pt-0')
    : 'pt-0';

  return (
    <div className="flex min-h-screen flex-col bg-light-100 dark:bg-dark-100 transition-colors duration-300">
      {showMobileNavbar && (
        <div className={showDesktopNavbar ? 'block' : 'lg:hidden'}>
          <Navbar toggleSidebar={toggleSidebar} />
        </div>
      )}
      
      <div className="flex flex-1">
        {isAuthenticated && !isFullPage && (
          <Sidebar 
            isOpen={sidebarOpen} 
            toggleSidebar={toggleSidebar} 
            closeSidebar={closeSidebar} 
            userRole={user?.role || 'user'} 
          />
        )}
        
        <main className={`flex-1 flex flex-col min-w-0 ${mainTopPaddingClass} ${!isFullPage ? 'pb-16 lg:pb-0' : ''}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`flex-1 flex flex-col min-w-0 ${isFullWidthPage ? 'w-full' : 'container-custom py-6'}`}
          >
            <Outlet context={{ toggleSidebar, closeSidebar }} />
          </motion.div>
        </main>
      </div>

      {/* Responsive Horizontal Mobile App Bottom Bar */}
      {!isFullPage && <MobileBottomNav />}
    </div>
  );
};

export default MainLayout;