import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
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

  const isAuthPage = location.pathname.startsWith('/auth/');
  const isOnboardingPage = location.pathname.startsWith('/onboarding');
  const isWritePage = location.pathname.startsWith('/write');
  const isFullPage = isAuthPage || isOnboardingPage || isWritePage;

  return (
    <div className="flex min-h-screen flex-col bg-light-100 dark:bg-dark-100 transition-colors duration-300">
      {!isOnboardingPage && <Navbar toggleSidebar={toggleSidebar} />}
      
      <div className="flex flex-1">
        {isAuthenticated && !isFullPage && (
          <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} userRole={user?.role || 'user'} />
        )}
        
        <main className="flex-1 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`flex-1 flex flex-col ${isFullPage ? 'w-full' : 'container-custom py-8'}`}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;