import React, { useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { X, Home, Search, Users, MessageSquare, Bookmark, BookOpen, Edit3, Settings, LogOut, ShieldAlert, Flame } from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../hooks/useAuth';
import { closeSidebar as closeSidebarAction } from '../../redux/slices/uiSlice';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar?: () => void;
  userRole: 'admin' | 'reviewer' | 'student' | 'user' | string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, closeSidebar, userRole }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, logoutUser } = useAuth();

  const handleClose = useCallback(() => {
    dispatch(closeSidebarAction());
    if (closeSidebar) {
      closeSidebar();
    } else if (isOpen) {
      toggleSidebar();
    }
  }, [dispatch, closeSidebar, isOpen, toggleSidebar]);

  // Close sidebar immediately whenever location/route changes
  useEffect(() => {
    if (isOpen) {
      handleClose();
    }
  }, [location.pathname, location.search]);

  const sidebarVariants = {
    open: {
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    closed: {
      x: '-100%',
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
  };

  const overlayVariants = {
    open: { opacity: 1, pointerEvents: 'auto' as const },
    closed: { opacity: 0, pointerEvents: 'none' as const },
  };

  const menuItems = [
    { name: 'Home', icon: <Home size={20} />, path: '/' },
    { name: 'Feed', icon: <Flame size={20} />, path: '/feed' },
    { name: 'Explore', icon: <Search size={20} />, path: '/explore' },
    { name: 'Bookmarks', icon: <Bookmark size={20} />, path: '/bookmarks' },
    { name: 'My Stories', icon: <BookOpen size={20} />, path: '/me/stories' },
    ...(userRole === 'admin' ? [{ name: 'Manage Users', icon: <Users size={20} />, path: '/admin/users' }] : []),
    ...(userRole === 'admin' || userRole === 'reviewer' ? [{ name: 'Machine Audits', icon: <ShieldAlert size={20} />, path: '/reviews' }] : []),
  ];

  const DesktopSidebar = (
    <aside
      aria-label="Sidebar Navigation"
      className="hidden lg:flex flex-col w-64 shrink-0 border-r border-light-300 dark:border-dark-300 bg-light-100 dark:bg-dark-100 h-screen max-h-screen sticky top-0 overflow-hidden select-none justify-between z-30"
    >
      <div className="p-3.5 flex flex-col min-h-0">
        <div className="mb-3 mt-1 flex items-center px-2 shrink-0">
          <Logo />
        </div>
        
        <div className="mb-3 shrink-0">
          <Link
            to="/write"
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm py-2.5 px-4 rounded-full shadow-md hover:shadow-lg transition-all active:scale-98"
          >
            <Edit3 size={16} />
            <span>Write</span>
          </Link>
        </div>
        
        <nav className="min-h-0 overflow-hidden">
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-3.5 py-2 rounded-xl transition-colors font-medium text-sm ${
                      isActive 
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400 font-bold' 
                        : 'text-dark-300 dark:text-light-300 hover:bg-light-200 dark:hover:bg-dark-200 hover:text-dark-100 dark:hover:text-light-100'
                    }`}
                  >
                    <span className="mr-3 shrink-0">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      
      {/* User Profile Area at Bottom */}
      <div className="p-3 border-t border-light-300/80 dark:border-dark-300/80 shrink-0 bg-light-100 dark:bg-dark-100">
        <div className="flex items-center justify-between group cursor-pointer p-1.5 rounded-xl hover:bg-light-200 dark:hover:bg-dark-200 transition-colors">
          <Link 
            to={user?.username ? `/@${user.username}` : '/profile'} 
            className="flex items-center flex-1 overflow-hidden"
          >
            <img 
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`} 
              alt={user?.name || 'User'} 
              className="w-9 h-9 rounded-full border border-light-300 dark:border-dark-300 shrink-0 object-cover"
            />
            <div className="ml-2.5 truncate">
              <p className="text-xs font-bold text-dark-100 dark:text-light-100 truncate">{user?.name}</p>
              <p className="text-[11px] text-dark-400 dark:text-light-400 truncate">@{user?.username}</p>
            </div>
          </Link>
        </div>
        <div className="flex justify-around mt-1.5 pt-1.5 border-t border-light-200 dark:border-dark-300/50">
          <Link to="/profile" className="p-1.5 text-dark-400 hover:text-dark-100 dark:text-light-400 dark:hover:text-light-100 rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 transition-colors" title="Settings">
            <Settings size={16} />
          </Link>
          <button onClick={logoutUser} className="p-1.5 text-dark-400 hover:text-red-600 dark:text-light-400 dark:hover:text-red-400 rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 transition-colors" title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );

  const MobileSidebar = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            className="fixed inset-0 bg-dark-100/50 z-40 lg:hidden"
            onClick={handleClose}
          />
          
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className="fixed top-0 left-0 bottom-0 w-72 bg-light-100 dark:bg-dark-100 z-50 lg:hidden overflow-y-auto flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-light-300 dark:border-dark-300 shrink-0">
              <Link to="/" onClick={handleClose} className="hover:opacity-90 transition-opacity">
                <Logo />
              </Link>
              <button
                onClick={handleClose}
                className="rounded-md p-2 text-dark-300 hover:bg-light-200 dark:text-light-300 dark:hover:bg-dark-200 transition-colors"
                aria-label="Close sidebar"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
              <div className="mb-6 mt-2">
                <Link onClick={handleClose} to="/write" className="w-full btn btn-primary flex items-center justify-center font-bold py-3 shadow-md hover:shadow-lg transition-all">
                  <Edit3 size={18} className="mr-2" />
                  Write
                </Link>
              </div>
              
              <nav>
                <ul className="space-y-1">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.path}
                          className={`flex items-center px-4 py-3 rounded-lg transition-colors font-medium ${
                            isActive 
                              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
                              : 'text-dark-300 dark:text-light-300 hover:bg-light-200 dark:hover:bg-dark-200 hover:text-dark-100 dark:hover:text-light-100'
                          }`}
                          onClick={handleClose}
                        >
                          <span className="mr-3">{item.icon}</span>
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
            
            {/* User Profile Area at Bottom */}
            <div className="p-4 border-t border-light-300 dark:border-dark-300 shrink-0 bg-light-50 dark:bg-dark-200/50">
              <Link onClick={handleClose} to={`/@${user?.username || 'user'}`} className="flex items-center mb-3 group">
                <img 
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`} 
                  alt={user?.name || 'User'} 
                  className="w-10 h-10 rounded-full border border-light-300 dark:border-dark-300 flex-shrink-0 group-hover:ring-2 group-hover:ring-primary-500 transition-all"
                />
                <div className="ml-3 truncate">
                  <p className="text-sm font-bold text-dark-100 dark:text-light-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{user?.name}</p>
                  <p className="text-xs text-dark-400 dark:text-light-400 truncate">@{user?.username}</p>
                </div>
              </Link>
              <div className="flex gap-2">
                <Link onClick={handleClose} to="/profile" className="flex-1 text-center py-2 text-sm font-medium rounded-lg border border-light-300 dark:border-dark-300 text-dark-300 dark:text-light-300 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors">
                  Settings
                </Link>
                <button onClick={() => { logoutUser(); handleClose(); }} className="flex-1 text-center py-2 text-sm font-medium rounded-lg border border-light-300 dark:border-dark-300 text-dark-300 dark:text-light-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors">
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {DesktopSidebar}
      {MobileSidebar}
    </>
  );
};

export default Sidebar;