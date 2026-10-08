import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, UserPlus, Check, Loader2, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../redux/slices/uiSlice';
import { useEscapeKey } from '../../hooks/useKeyboardShortcuts';

export type FollowModalTab = 'verified' | 'followers' | 'following';

interface FollowUser {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  role?: string;
  isVerified?: boolean;
  isFollowing?: boolean;
  isSelf?: boolean;
  followersCount?: number;
  followingCount?: number;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorId: string;
  authorName: string;
  authorUsername: string;
  initialTab?: FollowModalTab;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  authorId,
  authorName,
  authorUsername,
  initialTab = 'followers',
}) => {
  const [activeTab, setActiveTab] = useState<FollowModalTab>(initialTab);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { isAuthenticated, user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Consistent Global ESC Key Dismissal
  useEscapeKey(onClose, isOpen);

  const getAuthHeader = () => {
    const token =
      user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      loadData();
    }
  }, [isOpen, initialTab, authorUsername, authorId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [followersRes, followingRes] = await Promise.allSettled([
        axios.get(`/api/users/${authorUsername}/followers`, getAuthHeader()),
        axios.get(`/api/users/${authorUsername}/following`, getAuthHeader()),
      ]);

      if (followersRes.status === 'fulfilled' && Array.isArray(followersRes.value.data)) {
        setFollowers(followersRes.value.data);
      } else {
        setFollowers([]);
      }

      if (followingRes.status === 'fulfilled' && Array.isArray(followingRes.value.data)) {
        setFollowing(followingRes.value.data);
      } else {
        setFollowing([]);
      }
    } catch (err) {
      console.error('Error fetching followers/following:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (targetUser: FollowUser) => {
    if (!isAuthenticated) {
      dispatch(showNotification({ message: 'Please sign in to follow users', type: 'info' }));
      navigate('/auth/login');
      return;
    }

    const targetId = targetUser._id;
    const isCurrentlyFollowing = targetUser.isFollowing;
    setTogglingId(targetId);

    // Optimistic update across both lists
    const updater = (list: FollowUser[]) =>
      list.map((u) => (u._id === targetId ? { ...u, isFollowing: !isCurrentlyFollowing } : u));

    setFollowers(updater);
    setFollowing(updater);

    try {
      const res = await axios.post(`/api/users/${targetId}/follow`, {}, getAuthHeader());
      dispatch(
        showNotification({
          message: res.data.message || (res.data.isFollowing ? `Followed @${targetUser.username}` : `Unfollowed @${targetUser.username}`),
          type: 'success',
        })
      );
    } catch (err) {
      // Revert on error
      const reverter = (list: FollowUser[]) =>
        list.map((u) => (u._id === targetId ? { ...u, isFollowing: isCurrentlyFollowing } : u));
      setFollowers(reverter);
      setFollowing(reverter);
    } finally {
      setTogglingId(null);
    }
  };

  if (!isOpen) return null;

  // Filter list by active tab
  let currentList: FollowUser[] = [];
  if (activeTab === 'verified') {
    currentList = followers.filter(
      (u) => u.isVerified || u.role === 'admin' || u.role === 'author'
    );
  } else if (activeTab === 'followers') {
    currentList = followers;
  } else {
    currentList = following;
  }

  const tabs: { id: FollowModalTab; label: string; count: number }[] = [
    {
      id: 'verified',
      label: 'Verified Followers',
      count: followers.filter((u) => u.isVerified || u.role === 'admin' || u.role === 'author').length,
    },
    { id: 'followers', label: 'Followers', count: followers.length },
    { id: 'following', label: 'Following', count: following.length },
  ];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-dark-900/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg h-full sm:h-[620px] bg-light-100 dark:bg-dark-100 rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-light-300 dark:border-dark-300 flex flex-col overflow-hidden"
        >
          {/* ── Top Header matching X style from user reference ── */}
          <div className="px-4 py-3 border-b border-light-200 dark:border-dark-300 flex items-center gap-4 bg-light-100/90 dark:bg-dark-100/90 backdrop-blur-md shrink-0">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-light-200 dark:hover:bg-dark-200 text-dark-300 dark:text-light-300 transition-colors shrink-0"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading font-extrabold text-lg text-dark-100 dark:text-light-100 truncate flex items-center gap-1.5 leading-tight">
                <span>{authorName}</span>
                <img
                  src="/badge.svg"
                  alt="Verified"
                  className="w-4 h-4 shrink-0 inline-block"
                  title="Verified Account"
                />
              </h2>
              <p className="text-xs text-dark-400 dark:text-light-400 font-mono">
                @{authorUsername}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-light-200 dark:hover:bg-dark-200 text-dark-400 hover:text-dark-100 dark:hover:text-light-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Tabs Navigation: Verified Followers | Followers | Following ── */}
          <div className="flex border-b border-light-200 dark:border-dark-300 bg-light-100 dark:bg-dark-100 shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3.5 text-center text-xs sm:text-sm font-bold transition-colors relative hover:bg-light-200/50 dark:hover:bg-dark-200/50 ${
                    isActive
                      ? 'text-dark-100 dark:text-light-100'
                      : 'text-dark-400 dark:text-light-400'
                  }`}
                >
                  <span className="truncate block px-1">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="followTabUnderline"
                      className="absolute bottom-0 left-2 right-2 sm:left-4 sm:right-4 h-1 bg-primary-600 dark:bg-primary-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── User List Body ── */}
          <div className="flex-1 overflow-y-auto divide-y divide-light-200 dark:divide-dark-300">
            {loading ? (
              <div className="p-12 text-center space-y-3">
                <Loader2 size={24} className="animate-spin text-primary-500 mx-auto" />
                <p className="text-xs text-dark-400 dark:text-light-400 font-mono">Loading accounts...</p>
              </div>
            ) : currentList.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users size={36} className="text-dark-300 dark:text-light-400 mx-auto stroke-[1.5]" />
                <h4 className="text-base font-bold font-heading text-dark-100 dark:text-light-100">
                  {activeTab === 'verified'
                    ? 'No verified followers yet'
                    : activeTab === 'followers'
                    ? 'No followers yet'
                    : 'Not following anyone yet'}
                </h4>
                <p className="text-xs text-dark-400 dark:text-light-400 max-w-xs mx-auto">
                  {activeTab === 'verified'
                    ? 'Followers with verified badges or creator status will show up here.'
                    : activeTab === 'followers'
                    ? 'When other readers follow this profile, they will be listed here.'
                    : 'Profiles this author follows will appear here.'}
                </p>
              </div>
            ) : (
              currentList.map((u) => {
                const isSelf = u.isSelf || u._id === user?._id;
                const profileUrl = `/@${u.username}`;

                return (
                  <div
                    key={u._id}
                    className="p-4 hover:bg-light-200/40 dark:hover:bg-dark-200/40 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Link
                        to={profileUrl}
                        onClick={onClose}
                        className="shrink-0 relative group"
                      >
                        <img
                          src={
                            u.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&size=80`
                          }
                          alt={u.name}
                          className="w-11 h-11 rounded-full object-cover border border-light-300 dark:border-dark-300 group-hover:ring-2 ring-primary-500 transition-all"
                        />
                      </Link>
                      <div className="min-w-0">
                        <Link
                          to={profileUrl}
                          onClick={onClose}
                          className="font-bold text-sm text-dark-100 dark:text-light-100 hover:underline flex items-center gap-1.5 truncate"
                        >
                          <span className="truncate">{u.name}</span>
                          {(u.isVerified || u.role === 'admin' || u.role === 'author') && (
                            <img
                              src="/badge.svg"
                              alt="Verified"
                              className="w-3.5 h-3.5 shrink-0 inline-block"
                              title="Verified Account"
                            />
                          )}
                        </Link>
                        <p className="text-xs text-dark-400 dark:text-light-400 font-mono truncate">
                          @{u.username}
                        </p>
                        {u.bio && (
                          <p className="text-xs text-dark-300 dark:text-light-300 mt-1 line-clamp-2 leading-relaxed">
                            {u.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(u)}
                        disabled={togglingId === u._id}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 ${
                          u.isFollowing
                            ? 'border border-light-300 dark:border-dark-300 text-dark-100 dark:text-light-100 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300'
                            : 'bg-dark-100 dark:bg-light-100 text-light-100 dark:text-dark-100 hover:scale-105 active:scale-95 shadow-xs'
                        }`}
                      >
                        {togglingId === u._id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : u.isFollowing ? (
                          'Following'
                        ) : (
                          'Follow'
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FollowersModal;
