import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LucideIcon, Home, Compass, PlusCircle, Bookmark, User, LogIn, BookOpen } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface MobileBottomNavProps {
  className?: string;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  isSpecial?: boolean;
  avatar?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ className = '' }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const authenticatedLinks: NavItem[] = [
    {
      to: '/feed',
      label: 'Feed',
      icon: Home,
      isActive: location.pathname === '/feed' || location.pathname === '/',
    },
    {
      to: '/explore',
      label: 'Explore',
      icon: Compass,
      isActive: location.pathname.startsWith('/explore'),
    },
    {
      to: '/write',
      label: 'Write',
      icon: PlusCircle,
      isSpecial: true,
      isActive: location.pathname.startsWith('/write'),
    },
    {
      to: '/bookmarks',
      label: 'Saved',
      icon: Bookmark,
      isActive: location.pathname === '/bookmarks',
    },
    {
      to: user?.username ? `/@${user.username}` : '/profile',
      label: 'Profile',
      icon: User,
      avatar: user?.avatar,
      isActive:
        location.pathname.startsWith('/@') ||
        location.pathname === '/profile' ||
        location.pathname.startsWith('/authors/'),
    },
  ];

  const publicLinks: NavItem[] = [
    {
      to: '/',
      label: 'Home',
      icon: Home,
      isActive: location.pathname === '/',
    },
    {
      to: '/feed',
      label: 'Feed',
      icon: Compass,
      isActive: location.pathname.startsWith('/feed'),
    },
    {
      to: '/explore',
      label: 'Explore',
      icon: Compass,
      isActive: location.pathname.startsWith('/explore'),
    },
    {
      to: '/about',
      label: 'About',
      icon: BookOpen,
      isActive: location.pathname === '/about',
    },
    {
      to: '/auth/login',
      label: 'Sign In',
      icon: LogIn,
      isActive: location.pathname.startsWith('/auth'),
    },
  ];

  const links = isAuthenticated ? authenticatedLinks : publicLinks;

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-light-100/95 dark:bg-dark-100/95 backdrop-blur-2xl border-t border-light-300/80 dark:border-dark-300/80 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg shadow-black/5 transition-transform duration-300 ${className}`}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.isActive;

          if (link.isSpecial) {
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className="flex flex-col items-center justify-center -mt-3.5 group focus:outline-none"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 group-hover:scale-105 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-primary-500/30'
                      : 'bg-dark-100 dark:bg-light-100 text-light-100 dark:text-dark-100'
                  }`}
                >
                  <Icon size={22} className="stroke-[2.5]" />
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 tracking-tight ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-dark-400 dark:text-light-400'
                  }`}
                >
                  {link.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all active:scale-95 group focus:outline-none ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400 font-bold'
                  : 'text-dark-400 dark:text-light-400 hover:text-dark-200 dark:hover:text-light-200'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {link.avatar ? (
                  <img
                    src={link.avatar}
                    alt="Profile"
                    className={`w-5 h-5 rounded-full object-cover border ${
                      isActive
                        ? 'border-primary-500 ring-2 ring-primary-500/20'
                        : 'border-light-300 dark:border-dark-300'
                    }`}
                  />
                ) : (
                  <Icon
                    size={20}
                    className={`transition-transform group-hover:scale-110 ${
                      isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'
                    }`}
                  />
                )}
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 truncate max-w-[56px] text-center">
                {link.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
