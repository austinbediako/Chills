import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Moon, Sun, Menu, Settings, LogOut, X, User as UserIcon, BookOpen, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

import Logo from '../common/Logo';

interface NavbarProps {
  toggleSidebar: () => void;
}

interface SearchAuthor {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  followers?: string[];
}

interface SearchStory {
  _id: string;
  title: string;
  slug: string;
  category?: {
    name: string;
  };
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authorResults, setAuthorResults] = useState<SearchAuthor[]>([]);
  const [storyResults, setStoryResults] = useState<SearchStory[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { isAuthenticated, user, logoutUser } = useAuth();
  const navigate = useNavigate();
  
  const isAuthPage = location.pathname.startsWith('/auth/');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Live search debounced effect
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setAuthorResults([]);
      setStoryResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const cleanAuthorQuery = trimmed.replace(/^@/, '');
        const [authorsRes, storiesRes] = await Promise.allSettled([
          axios.get(`/api/users/search?q=${encodeURIComponent(cleanAuthorQuery)}`),
          axios.get(`/api/submissions?search=${encodeURIComponent(trimmed)}&limit=4`),
        ]);

        if (authorsRes.status === 'fulfilled' && Array.isArray(authorsRes.value.data)) {
          setAuthorResults(authorsRes.value.data);
        } else {
          setAuthorResults([]);
        }

        if (storiesRes.status === 'fulfilled' && Array.isArray(storiesRes.value.data?.submissions)) {
          setStoryResults(storiesRes.value.data.submissions);
        } else {
          setStoryResults([]);
        }
      } catch (err) {
        console.error('Navbar search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setSearchOpen(false);
    setSearchQuery('');

    // If query starts with @ or exactly matches a found author username
    if (trimmed.startsWith('@')) {
      navigate(`/authors/${encodeURIComponent(trimmed.slice(1))}`);
      return;
    }

    if (authorResults.length === 1 && storyResults.length === 0) {
      navigate(`/authors/${authorResults[0].username}`);
      return;
    }

    // Default to explore page with search query
    navigate(`/explore?search=${encodeURIComponent(trimmed)}`);
  };

  const handleSelectAuthor = (username: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(`/authors/${username}`);
  };

  const handleSelectStory = (slug: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(`/blog/${slug}`);
  };

  const handleLogout = () => {
    logoutUser();
    setIsProfileOpen(false);
    navigate('/auth/login');
  };

  const ProfileDropdown = () => (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute right-0 top-14 w-56 bg-light-100/90 dark:bg-dark-200/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-light-300/50 dark:border-dark-300/50 overflow-hidden"
    >
      <div className="p-2 space-y-0.5">
        <Link
          to={user?.username ? `/@${user.username}` : '/profile'}
          onClick={() => setIsProfileOpen(false)}
          className="flex items-center px-4 py-2.5 text-sm font-medium text-dark-300 dark:text-light-300 hover:bg-light-200 dark:hover:bg-dark-300 rounded-xl transition-colors"
        >
          <UserIcon size={16} className="mr-3 text-dark-400 dark:text-light-400" />
          Your Profile
        </Link>
        <Link
          to="/profile"
          onClick={() => setIsProfileOpen(false)}
          className="flex items-center px-4 py-2.5 text-sm font-medium text-dark-300 dark:text-light-300 hover:bg-light-200 dark:hover:bg-dark-300 rounded-xl transition-colors"
        >
          <Settings size={16} className="mr-3 text-dark-400 dark:text-light-400" />
          Edit Profile
        </Link>
        <div className="h-px bg-light-300/50 dark:bg-dark-300/50 my-1 mx-2"></div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
        >
          <LogOut size={16} className="mr-3" />
          Logout
        </button>
      </div>
    </motion.div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-6 px-4 md:px-8 pointer-events-none transition-all duration-500">
      <div className="mx-auto max-w-7xl flex items-center justify-between pointer-events-auto">
        
        {/* Brand */}
        <div className="flex items-center group relative z-20">
          {!isAuthPage && (
            <Link to="/" className={isAuthenticated ? "lg:hidden" : ""}>
              <Logo />
            </Link>
          )}
        </div>

        {/* Central Capsule Navigation */}
        <nav className={`hidden md:flex items-center backdrop-blur-xl bg-light-100/70 dark:bg-dark-200/70 border border-light-300/50 dark:border-dark-300/50 rounded-full px-6 py-2.5 transition-all duration-500 shadow-sm ${isScrolled ? 'shadow-lg shadow-black/5 dark:shadow-black/20 translate-y-2' : ''}`}>
          <ul className="flex items-center space-x-6">
            {(isAuthenticated
              ? [
                  { name: 'Feed', path: '/feed' },
                  { name: 'Explore', path: '/explore' },
                  { name: 'Write', path: '/write' },
                ]
              : [
                  { name: 'Feed', path: '/feed' },
                  { name: 'Our Story', path: '/about' },
                  { name: 'Membership', path: '/membership' },
                  { name: 'Write', path: '/write' },
                ]
            ).map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`relative text-sm font-medium tracking-wide transition-colors hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1 ${
                    location.pathname === item.path
                      ? 'text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-dark-400 dark:text-light-300'
                  }`}
                >
                  {item.name}
                  {location.pathname === item.path && (
                    <motion.span
                      layoutId="navbar-indicator"
                      className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3 relative z-20">
          {isAuthenticated && (
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="rounded-full p-2.5 bg-light-100/70 dark:bg-dark-200/70 backdrop-blur-xl border border-light-300/50 dark:border-dark-300/50 text-dark-300 hover:bg-light-200 dark:text-light-300 dark:hover:bg-dark-300 transition-all shadow-sm hover:scale-105 active:scale-95"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          )}
          
          <button
            onClick={toggleTheme}
            className="rounded-full p-2.5 bg-light-100/70 dark:bg-dark-200/70 backdrop-blur-xl border border-light-300/50 dark:border-dark-300/50 text-dark-300 hover:bg-light-200 dark:text-light-300 dark:hover:bg-dark-300 transition-all shadow-sm hover:scale-105 active:scale-95"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.div>
          </button>
          
          {!isAuthenticated ? (
            <div className="hidden sm:flex items-center space-x-2 pl-2">
              <Link
                to="/auth/login"
                className="text-sm font-medium text-dark-300 hover:text-primary-600 dark:text-light-300 dark:hover:text-primary-400 transition-colors px-4 py-2"
              >
                Sign in
              </Link>
              <Link
                to="/auth/signup"
                className="rounded-full bg-dark-100 dark:bg-light-100 px-6 py-2.5 text-sm font-medium text-light-100 dark:text-dark-100 hover:scale-105 transition-transform shadow-sm"
              >
                Get started
              </Link>
            </div>
          ) : (
            <div 
              className="relative pl-2"
              onMouseEnter={() => setIsProfileOpen(true)}
              onMouseLeave={() => setIsProfileOpen(false)}
            >
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 rounded-full p-1 pr-4 bg-light-100/70 dark:bg-dark-200/70 backdrop-blur-xl border border-light-300/50 dark:border-dark-300/50 hover:bg-light-200 dark:hover:bg-dark-300 transition-all shadow-sm"
              >
                <img 
                  src={user?.avatar || 'https://pbs.twimg.com/profile_images/1835759638433652736/fD3zE0qE_400x400.jpg'} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full object-cover border border-light-300 dark:border-dark-300"
                />
                <span className="hidden md:inline text-sm text-dark-300 dark:text-light-300 font-medium">
                  {user?.username}
                </span>
              </button>
              
              <AnimatePresence>
                {isProfileOpen && <ProfileDropdown />}
              </AnimatePresence>
            </div>
          )}

          {isAuthenticated && (
            <button
              onClick={toggleSidebar}
              className="rounded-full p-2.5 bg-light-100/70 dark:bg-dark-200/70 backdrop-blur-xl border border-light-300/50 dark:border-dark-300/50 text-dark-300 hover:bg-light-200 dark:text-light-300 dark:hover:bg-dark-300 transition-all shadow-sm lg:hidden ml-2"
              aria-label="Toggle sidebar"
            >
              <Menu size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="absolute inset-x-0 top-24 mx-auto max-w-2xl px-4 pointer-events-auto"
          >
            <div className="bg-light-100/95 dark:bg-dark-200/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-light-300/50 dark:border-dark-300/50 relative overflow-hidden divide-y divide-light-200 dark:divide-dark-300">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center p-3 pl-4">
                <Search size={20} className="text-dark-400 dark:text-light-400 mr-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search authors (@username), stories, topics..."
                  className="w-full bg-transparent border-none text-base sm:text-lg text-dark-100 dark:text-light-100 placeholder:text-dark-300/50 dark:placeholder:text-light-300/50 focus:ring-0 outline-none pr-10"
                  autoFocus
                />
                {isSearching && (
                  <Loader2 size={18} className="animate-spin text-primary-500 absolute right-14" />
                )}
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                  className="text-dark-300 dark:text-light-300 hover:text-dark-100 dark:hover:text-light-100 transition-colors bg-light-200 dark:bg-dark-300 p-2 rounded-full"
                >
                  <X size={16} />
                </button>
              </form>

              {/* Dynamic Results Dropdown */}
              {searchQuery.trim().length > 0 && (
                <div className="max-h-96 overflow-y-auto p-3 space-y-4">
                  {/* Authors Section */}
                  {authorResults.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                        <UserIcon size={13} />
                        <span>Authors & Creators</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {authorResults.map((author) => (
                          <div
                            key={author._id}
                            onClick={() => handleSelectAuthor(author.username)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-light-200 dark:hover:bg-dark-300 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}`}
                                alt={author.name}
                                className="h-9 w-9 rounded-full object-cover shrink-0 ring-1 ring-primary-500/20"
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-dark-100 dark:text-light-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                  {author.name}
                                </div>
                                <div className="text-xs text-dark-400 dark:text-light-400 font-mono truncate">
                                  @{author.username}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shrink-0">
                              View Account
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stories Section */}
                  {storyResults.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-dark-400 dark:text-light-400">
                        <BookOpen size={13} />
                        <span>Stories & Publications</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {storyResults.map((story) => (
                          <div
                            key={story._id}
                            onClick={() => handleSelectStory(story.slug)}
                            className="p-2.5 rounded-xl hover:bg-light-200 dark:hover:bg-dark-300 cursor-pointer transition-colors group"
                          >
                            <div className="text-sm font-semibold text-dark-100 dark:text-light-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                              {story.title}
                            </div>
                            {story.category && (
                              <div className="text-xs text-dark-400 dark:text-light-400 mt-0.5">
                                {story.category.name}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!isSearching && authorResults.length === 0 && storyResults.length === 0 && (
                    <div className="py-6 text-center text-sm text-dark-400 dark:text-light-400 font-serif">
                      No authors or publications found for "{searchQuery}"
                    </div>
                  )}

                  {/* Bottom Enter hint */}
                  <div 
                    onClick={handleSearchSubmit}
                    className="p-2.5 text-center text-xs text-primary-600 dark:text-primary-400 hover:underline cursor-pointer border-t border-light-200 dark:border-dark-300 flex items-center justify-center gap-1.5"
                  >
                    <span>Press Enter to explore all results for <strong>"{searchQuery}"</strong></span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;