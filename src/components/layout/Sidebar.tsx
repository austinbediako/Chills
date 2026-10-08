import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, Search, Users, MessageSquare, Bookmark, BookOpen, Edit3, Settings, LogOut, ShieldAlert, Flame } from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  userRole: 'admin' | 'reviewer' | 'student' | 'user' | string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, userRole }) => {
  const location = useLocation();
  const { user, logoutUser } = useAuth();

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
    <div className="hidden lg:flex flex-col w-64 shrink-0 border-r border-light-300 dark:border-dark-300 bg-light-100 dark:bg-dark-100 h-screen sticky top-0">
      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-6 mt-2 flex items-center px-2">
          <Logo />
        </div>
        
        <div className="mb-6 mt-2">
          <Link to="/write" className="w-full btn btn-primary flex items-center justify-center font-bold text-base py-3 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
            <Edit3 size={18} className="mr-2" />
            Write
          </Link>
        </div>
        
        <nav className="flex-1">
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
      <div className="p-4 border-t border-light-300 dark:border-dark-300">
        <div className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 transition-colors">
          <Link 
            to={user?.username ? `/@${user.username}` : '/profile'} 
            className="flex items-center flex-1 overflow-hidden"
          >
            <img 
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`} 
              alt={user?.name || 'User'} 
              className="w-10 h-10 rounded-full border border-light-300 dark:border-dark-300 flex-shrink-0"
            />
            <div className="ml-3 truncate">
              <p className="text-sm font-bold text-dark-100 dark:text-light-100 truncate">{user?.name}</p>
              <p className="text-xs text-dark-400 dark:text-light-400 truncate">@{user?.username}</p>
            </div>
          </Link>
        </div>
        <div className="flex justify-around mt-2 pt-2 border-t border-light-200 dark:border-dark-200">
          <Link to="/profile" className="p-2 text-dark-400 hover:text-dark-100 dark:text-light-400 dark:hover:text-light-100 rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 transition-colors" title="Settings">
            <Settings size={18} />
          </Link>
          <button onClick={logoutUser} className="p-2 text-dark-400 hover:text-red-600 dark:text-light-400 dark:hover:text-red-400 rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 transition-colors" title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
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
            onClick={toggleSidebar}
          />
          
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className="fixed top-0 left-0 bottom-0 w-72 bg-light-100 dark:bg-dark-100 z-50 lg:hidden overflow-y-auto flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-light-300 dark:border-dark-300 shrink-0">
              <Logo />
              <button
                onClick={toggleSidebar}
                className="rounded-md p-2 text-dark-300 hover:bg-light-200 dark:text-light-300 dark:hover:bg-dark-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
              <div className="mb-6 mt-2">
                <Link onClick={toggleSidebar} to="/write" className="w-full btn btn-primary flex items-center justify-center font-bold py-3 shadow-md">
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
                          onClick={toggleSidebar}
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
              <Link onClick={toggleSidebar} to={`/@${user?.username || 'user'}`} className="flex items-center mb-3">
                <img 
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`} 
                  alt={user?.name || 'User'} 
                  className="w-10 h-10 rounded-full border border-light-300 dark:border-dark-300 flex-shrink-0"
                />
                <div className="ml-3 truncate">
                  <p className="text-sm font-bold text-dark-100 dark:text-light-100 truncate">{user?.name}</p>
                  <p className="text-xs text-dark-400 dark:text-light-400 truncate">@{user?.username}</p>
                </div>
              </Link>
              <div className="flex gap-2">
                <Link onClick={toggleSidebar} to="/settings" className="flex-1 text-center py-2 text-sm font-medium rounded-lg border border-light-300 dark:border-dark-300 text-dark-300 dark:text-light-300 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors">
                  Settings
                </Link>
                <button onClick={() => { logoutUser(); toggleSidebar(); }} className="flex-1 text-center py-2 text-sm font-medium rounded-lg border border-light-300 dark:border-dark-300 text-dark-300 dark:text-light-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors">
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