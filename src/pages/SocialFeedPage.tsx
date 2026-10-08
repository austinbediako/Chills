import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Repeat,
  MessageCircle,
  Bookmark,
  Share2,
  Sparkles,
  Send,
  CornerDownRight,
  UserPlus,
  UserMinus,
  Search,
  Edit3,
  TrendingUp,
  X,
  Flame,
  Check,
  BookOpen,
  ArrowRight,
  Quote,
  Loader2,
  Menu,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { showNotification, toggleSidebar } from '../redux/slices/uiSlice';
import BookmarkDropdown from '../components/common/BookmarkDropdown';
import { useEscapeKey, isModifierPressed, getModifierKeyLabel } from '../hooks/useKeyboardShortcuts';

interface Author {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  followers?: string[];
  following?: string[];
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface ReplyItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  content: string;
  date: string;
  likedBy?: string[];
}

interface CommentItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  content: string;
  likes: number;
  likedBy?: string[];
  createdAt: string;
  replies?: ReplyItem[];
}

interface Submission {
  _id: string;
  title: string;
  slug: string;
  abstract: string;
  content?: string;
  image?: string;
  readTime?: string;
  createdAt: string;
  category?: Category;
  author: Author;
  tags?: string[];
}

interface FeedItem {
  _id: string;
  feedType: 'post' | 'repost';
  createdAt: string;
  repostedAt?: string;
  submission: Submission;
  repostUser?: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  } | null;
  quote?: string | null;
  likesCount: number;
  repostsCount: number;
  commentsCount: number;
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
  isFollowingAuthor: boolean;
  previewComments?: CommentItem[];
}

interface FeaturedAuthor {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  storiesCount: number;
  followersCount: number;
  isFollowing?: boolean;
}

interface TrendingTag {
  name: string;
  count: number;
}

export const SocialFeedPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  // Expanded comment drawers keyed by submissionId
  const [expandedComments, setExpandedComments] = useState<{ [submissionId: string]: boolean }>({});
  const [loadedComments, setLoadedComments] = useState<{ [submissionId: string]: CommentItem[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [submissionId: string]: boolean }>({});
  const [newCommentText, setNewCommentText] = useState<{ [submissionId: string]: string }>({});
  const [replyInputOpen, setReplyInputOpen] = useState<{ [commentId: string]: boolean }>({});
  const [replyText, setReplyText] = useState<{ [commentId: string]: string }>({});

  // Quote Repost Modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteTargetItem, setQuoteTargetItem] = useState<FeedItem | null>(null);
  const [quoteText, setQuoteText] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Global ESC key dismisses quote modal
  useEscapeKey(() => setQuoteModalOpen(false), quoteModalOpen);

  // Right sidebar data
  const [featuredAuthors, setFeaturedAuthors] = useState<FeaturedAuthor[]>([]);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [followingAuthorIds, setFollowingAuthorIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const getAuthHeader = useCallback(() => {
    const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, [user]);

  // Fetch feed items
  const fetchFeed = useCallback(
    async (resetPage = false) => {
      const targetPage = resetPage ? 1 : page;
      if (resetPage) {
        setLoadingFeed(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await axios.get(
          `/api/submissions/feed?tab=${activeTab}&page=${targetPage}&limit=12`,
          getAuthHeader()
        );

        const items: FeedItem[] = res.data?.items || [];
        if (resetPage) {
          setFeedItems(items);
          setPage(2);
        } else {
          setFeedItems((prev) => [...prev, ...items]);
          setPage((p) => p + 1);
        }

        setHasMore(targetPage < (res.data?.totalPages || 1));
        setEmptyMessage(items.length === 0 ? res.data?.message || 'No stories yet' : null);
      } catch (err) {
        console.error('Error fetching social feed:', err);
      } finally {
        setLoadingFeed(false);
        setLoadingMore(false);
      }
    },
    [activeTab, page, getAuthHeader]
  );

  // Reload feed whenever tab changes
  useEffect(() => {
    fetchFeed(true);
  }, [activeTab]);

  // Fetch sidebar data
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
        const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const [authorsRes, tagsRes] = await Promise.allSettled([
          axios.get('/api/users/featured-authors', authHeader),
          axios.get('/api/submissions/popular/tags'),
        ]);

        if (authorsRes.status === 'fulfilled' && Array.isArray(authorsRes.value.data)) {
          const raw = authorsRes.value.data;
          const currentId = user?._id ? String(user._id) : (user as any)?.id ? String((user as any).id) : '';
          const currentHandle = user?.username ? user.username.toLowerCase() : '';
          const filtered = raw.filter((a: any) => {
            const aId = a._id ? String(a._id) : '';
            const aUsername = a.username ? a.username.toLowerCase() : '';
            return (!currentId || aId !== currentId) && (!currentHandle || aUsername !== currentHandle);
          });
          setFeaturedAuthors(filtered.slice(0, 5));
          if (user) {
            const initialFollowing = new Set<string>();
            filtered.forEach((a: any) => {
              if (Array.isArray(a.followers) && a.followers.includes(user._id)) {
                initialFollowing.add(a._id);
              }
            });
            setFollowingAuthorIds(initialFollowing);
          }
        }

        if (tagsRes.status === 'fulfilled' && Array.isArray(tagsRes.value.data)) {
          setTrendingTags(tagsRes.value.data.slice(0, 6));
        }
      } catch (err) {
        console.error('Error loading sidebar data:', err);
      }
    };

    fetchSidebarData();
  }, [user]);

  // Handle Like Toggle on Story
  const handleLikeStory = async (submissionId: string) => {
    if (!isAuthenticated) {
      dispatch(showNotification({ message: 'Please sign in to like posts', type: 'info' }));
      navigate('/auth/login');
      return;
    }

    // Optimistic UI update across all feed items referencing this story
    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.submission._id === submissionId) {
          const nextLiked = !item.isLiked;
          return {
            ...item,
            isLiked: nextLiked,
            likesCount: nextLiked ? item.likesCount + 1 : Math.max(0, item.likesCount - 1),
          };
        }
        return item;
      })
    );

    try {
      await axios.post(`/api/submissions/${submissionId}/interact`, { type: 'LIKE' }, getAuthHeader());
    } catch (err) {
      console.error('Error liking story:', err);
      // Revert if error
      fetchFeed(true);
    }
  };

  // Handle Repost Toggle (Direct repost or open quote modal)
  const handleToggleRepost = async (item: FeedItem) => {
    if (!isAuthenticated) {
      dispatch(showNotification({ message: 'Please sign in to repost', type: 'info' }));
      navigate('/auth/login');
      return;
    }

    const submissionId = item.submission._id;

    // If currently reposted, clicking it un-reposts
    if (item.isReposted) {
      setFeedItems((prev) =>
        prev
          .filter((fItem) => !(fItem.feedType === 'repost' && fItem.repostUser?._id === user?._id && fItem.submission._id === submissionId))
          .map((fItem) => {
            if (fItem.submission._id === submissionId) {
              return {
                ...fItem,
                isReposted: false,
                repostsCount: Math.max(0, fItem.repostsCount - 1),
              };
            }
            return fItem;
          })
      );

      try {
        await axios.post(`/api/submissions/${submissionId}/repost`, {}, getAuthHeader());
        dispatch(showNotification({ message: 'Repost removed', type: 'info' }));
      } catch (err) {
        console.error('Error removing repost:', err);
        fetchFeed(true);
      }
    } else {
      // Prompt modal with option to Repost instantly or Quote
      setQuoteTargetItem(item);
      setQuoteModalOpen(true);
    }
  };

  // Submit Instant Repost
  const handleInstantRepost = async () => {
    if (!quoteTargetItem) return;
    const submissionId = quoteTargetItem.submission._id;
    setQuoteModalOpen(false);

    // Optimistic update
    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.submission._id === submissionId) {
          return {
            ...item,
            isReposted: true,
            repostsCount: item.repostsCount + 1,
          };
        }
        return item;
      })
    );

    try {
      const res = await axios.post(`/api/submissions/${submissionId}/repost`, {}, getAuthHeader());
      dispatch(showNotification({ message: 'Reposted to your feed and profile!', type: 'success' }));
      // Reload feed to show the newly injected repost item at the top
      fetchFeed(true);
    } catch (err) {
      console.error('Error reposting:', err);
      fetchFeed(true);
    }
  };

  // Submit Quote Repost
  const handleQuoteRepost = async () => {
    if (!quoteTargetItem) return;
    const submissionId = quoteTargetItem.submission._id;
    if (!quoteText.trim()) {
      handleInstantRepost();
      return;
    }

    setSubmittingQuote(true);
    try {
      await axios.post(
        `/api/submissions/${submissionId}/repost`,
        { quote: quoteText.trim() },
        getAuthHeader()
      );
      dispatch(showNotification({ message: 'Quote repost published!', type: 'success' }));
      setQuoteModalOpen(false);
      setQuoteText('');
      setQuoteTargetItem(null);
      fetchFeed(true);
    } catch (err) {
      console.error('Error quote reposting:', err);
      dispatch(showNotification({ message: 'Failed to quote repost', type: 'error' }));
    } finally {
      setSubmittingQuote(false);
    }
  };

  // Handle Bookmark Toggle
  const handleToggleBookmark = async (submissionId: string) => {
    if (!isAuthenticated) {
      dispatch(showNotification({ message: 'Please sign in to bookmark', type: 'info' }));
      navigate('/auth/login');
      return;
    }

    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.submission._id === submissionId) {
          return { ...item, isBookmarked: !item.isBookmarked };
        }
        return item;
      })
    );

    try {
      const res = await axios.post(`/api/submissions/${submissionId}/interact`, { type: 'BOOKMARK' }, getAuthHeader());
      dispatch(showNotification({ message: res.data.message || 'Bookmark updated', type: 'success' }));
    } catch (err) {
      console.error('Error bookmarking:', err);
    }
  };

  // Handle Follow / Unfollow Author
  const handleToggleFollow = async (authorId: string, authorUsername: string) => {
    if (!isAuthenticated) {
      dispatch(showNotification({ message: 'Please sign in to follow authors', type: 'info' }));
      navigate('/auth/login');
      return;
    }

    const isFollowing = followingAuthorIds.has(authorId);
    const nextSet = new Set(followingAuthorIds);
    if (isFollowing) {
      nextSet.delete(authorId);
    } else {
      nextSet.add(authorId);
    }
    setFollowingAuthorIds(nextSet);

    // Update feed items for author
    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.submission.author._id === authorId) {
          return { ...item, isFollowingAuthor: !isFollowing };
        }
        return item;
      })
    );

    try {
      const res = await axios.post(`/api/users/${authorId}/follow`, {}, getAuthHeader());
      dispatch(
        showNotification({
          message: res.data.isFollowing ? `Following @${authorUsername}` : `Unfollowed @${authorUsername}`,
          type: 'success',
        })
      );
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  // Toggle inline comment section and load full comments
  const handleToggleCommentsSection = async (submissionId: string) => {
    const isCurrentlyOpen = expandedComments[submissionId];
    setExpandedComments((prev) => ({ ...prev, [submissionId]: !isCurrentlyOpen }));

    if (!isCurrentlyOpen && !loadedComments[submissionId]) {
      setLoadingComments((prev) => ({ ...prev, [submissionId]: true }));
      try {
        const res = await axios.get(`/api/submissions/${submissionId}/comments`);
        setLoadedComments((prev) => ({ ...prev, [submissionId]: res.data || [] }));
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setLoadingComments((prev) => ({ ...prev, [submissionId]: false }));
      }
    }
  };

  // Submit comment / reply to story or repost
  const handleAddComment = async (submissionId: string) => {
    if (!isAuthenticated) {
      dispatch(showNotification({ message: 'Please sign in to comment', type: 'info' }));
      navigate('/auth/login');
      return;
    }

    const content = (newCommentText[submissionId] || '').trim();
    if (!content) return;

    try {
      const res = await axios.post(
        `/api/submissions/${submissionId}/comments`,
        { content },
        getAuthHeader()
      );

      const createdComment: CommentItem = res.data;

      // Update loaded comments list
      setLoadedComments((prev) => ({
        ...prev,
        [submissionId]: [createdComment, ...(prev[submissionId] || [])],
      }));

      // Update feed item comment count and preview
      setFeedItems((prev) =>
        prev.map((item) => {
          if (item.submission._id === submissionId) {
            return {
              ...item,
              commentsCount: item.commentsCount + 1,
              previewComments: [createdComment, ...(item.previewComments || []).slice(0, 2)],
            };
          }
          return item;
        })
      );

      setNewCommentText((prev) => ({ ...prev, [submissionId]: '' }));
      dispatch(showNotification({ message: 'Reply posted!', type: 'success' }));
    } catch (err: any) {
      console.error('Error adding comment:', err);
      dispatch(showNotification({ message: err.response?.data?.message || 'Failed to post comment', type: 'error' }));
    }
  };

  // Toggle Like on Comment
  const handleLikeComment = async (submissionId: string, commentId: string) => {
    if (!isAuthenticated) {
      dispatch(showNotification({ message: 'Please sign in to like comments', type: 'info' }));
      navigate('/auth/login');
      return;
    }

    // Optimistic update
    setLoadedComments((prev) => {
      const list = prev[submissionId] || [];
      const updated = list.map((c) => {
        if (c._id === commentId) {
          const userId = user?._id || '';
          const likedByArr = Array.isArray(c.likedBy) ? c.likedBy : [];
          const isLiked = likedByArr.some((uid) => String(uid) === String(userId));
          const nextLikedBy = isLiked
            ? likedByArr.filter((uid) => String(uid) !== String(userId))
            : [...likedByArr, userId];
          return {
            ...c,
            likes: isLiked ? Math.max(0, c.likes - 1) : c.likes + 1,
            likedBy: nextLikedBy,
          };
        }
        return c;
      });
      return { ...prev, [submissionId]: updated };
    });

    try {
      await axios.post(`/api/comments/${commentId}/like`, {}, getAuthHeader());
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  // Submit threaded reply to a comment
  const handleAddReplyToComment = async (submissionId: string, commentId: string) => {
    if (!isAuthenticated) {
      dispatch(showNotification({ message: 'Please sign in to reply', type: 'info' }));
      navigate('/auth/login');
      return;
    }

    const content = (replyText[commentId] || '').trim();
    if (!content) return;

    try {
      const res = await axios.post(
        `/api/comments/${commentId}/replies`,
        { content },
        getAuthHeader()
      );

      const updatedComment: CommentItem = res.data;

      setLoadedComments((prev) => {
        const list = prev[submissionId] || [];
        return {
          ...prev,
          [submissionId]: list.map((c) => (c._id === commentId ? updatedComment : c)),
        };
      });

      setReplyText((prev) => ({ ...prev, [commentId]: '' }));
      setReplyInputOpen((prev) => ({ ...prev, [commentId]: false }));
      dispatch(showNotification({ message: 'Reply added!', type: 'success' }));
    } catch (err: any) {
      console.error('Error replying to comment:', err);
      dispatch(showNotification({ message: err.response?.data?.message || 'Failed to post reply', type: 'error' }));
    }
  };

  // Format relative timestamp
  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 7) {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    if (diffMin > 0) return `${diffMin}m`;
    return 'now';
  };

  // Copy share link
  const handleSharePost = (slug: string) => {
    const url = `${window.location.origin}/blog/${slug}`;
    navigator.clipboard.writeText(url);
    dispatch(showNotification({ message: 'Link copied to clipboard!', type: 'success' }));
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-light-100 dark:bg-dark-100 text-dark-100 dark:text-light-100">
      <div className="w-full px-0 sm:px-4 lg:px-6 lg:h-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:h-full gap-6 pt-3 sm:pt-4">
          
          {/* ══════════════════════════════════════════════════════════════
              CENTER COLUMN: X-STYLE TIMELINE STREAM (8 Cols)
          ══════════════════════════════════════════════════════════════ */}
          <main className="lg:col-span-8 flex flex-col min-h-screen lg:min-h-0 lg:h-full lg:overflow-y-auto border-x-0 sm:border-x border-light-300/60 dark:border-dark-300/60 bg-light-100 dark:bg-dark-100 rounded-none sm:rounded-2xl shadow-sm">
            
            {/* ── Sticky Top Bar & Timeline Tabs ── */}
            <div className="sticky top-0 z-30 bg-light-100/90 dark:bg-dark-100/90 backdrop-blur-xl border-b border-light-300/60 dark:border-dark-300/60">
              <div className="px-4 sm:px-5 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => dispatch(toggleSidebar())}
                    className="lg:hidden p-1.5 -ml-1 rounded-full hover:bg-light-200 dark:hover:bg-dark-200 text-dark-400 dark:text-light-300 transition-colors"
                    aria-label="Open navigation menu"
                  >
                    <Menu size={20} />
                  </button>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <h1 className="text-xl font-heading font-extrabold tracking-tight">Timeline</h1>
                </div>
                <Link
                  to="/write"
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-dark-100 text-light-100 dark:bg-light-100 dark:text-dark-100 text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <Edit3 size={13} />
                  <span>Write Post</span>
                </Link>
              </div>

              {/* Tabs: For You vs Following */}
              <div className="flex border-t border-light-300/40 dark:border-dark-300/40">
                <button
                  onClick={() => setActiveTab('for-you')}
                  className={`flex-1 py-3.5 text-center text-sm font-bold transition-colors relative hover:bg-light-200/50 dark:hover:bg-dark-200/50 ${
                    activeTab === 'for-you'
                      ? 'text-dark-100 dark:text-light-100'
                      : 'text-dark-400 dark:text-light-400'
                  }`}
                >
                  <span>For You</span>
                  {activeTab === 'for-you' && (
                    <motion.div
                      layoutId="timeline-tab"
                      className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary-600 dark:bg-primary-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('following')}
                  className={`flex-1 py-3.5 text-center text-sm font-bold transition-colors relative hover:bg-light-200/50 dark:hover:bg-dark-200/50 ${
                    activeTab === 'following'
                      ? 'text-dark-100 dark:text-light-100'
                      : 'text-dark-400 dark:text-light-400'
                  }`}
                >
                  <span>Following</span>
                  {activeTab === 'following' && (
                    <motion.div
                      layoutId="timeline-tab"
                      className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary-600 dark:bg-primary-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* ── Feed Stream ── */}
            {loadingFeed ? (
              <div className="p-6 space-y-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-4 rounded-xl border border-light-300/40 dark:border-dark-300/40 space-y-4 animate-pulse">
                    <div className="flex gap-3 items-center">
                      <div className="h-10 w-10 rounded-full bg-light-300 dark:bg-dark-300"></div>
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 w-32 bg-light-300 dark:bg-dark-300 rounded"></div>
                        <div className="h-3 w-20 bg-light-300 dark:bg-dark-300 rounded"></div>
                      </div>
                    </div>
                    <div className="h-5 w-3/4 bg-light-300 dark:bg-dark-300 rounded"></div>
                    <div className="h-16 w-full bg-light-300 dark:bg-dark-300 rounded"></div>
                  </div>
                ))}
              </div>
            ) : feedItems.length === 0 ? (
              <div className="py-20 px-6 text-center">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-light-200 dark:bg-dark-200 flex items-center justify-center text-primary-500">
                  <Sparkles size={28} />
                </div>
                <h3 className="text-lg font-bold font-heading mb-2">No Stories in Feed</h3>
                <p className="text-sm text-dark-400 dark:text-light-400 max-w-sm mx-auto font-serif">
                  {emptyMessage || 'Start exploring creators, publish your first story, or repost inspiring pieces to your network.'}
                </p>
                {activeTab === 'following' && (
                  <button
                    onClick={() => setActiveTab('for-you')}
                    className="mt-5 px-6 py-2.5 rounded-full bg-primary-600 text-white text-xs font-bold hover:scale-105 transition-all shadow-md"
                  >
                    Switch to "For You"
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-light-300/60 dark:border-dark-300/60">
                {feedItems.map((item) => {
                  const s = item.submission;
                  const isRepost = item.feedType === 'repost';
                  const isCommentsOpen = Boolean(expandedComments[s._id]);
                  const commentsForThis = loadedComments[s._id] || item.previewComments || [];

                  return (
                    <article
                      key={item._id}
                      onClick={() => navigate(`/blog/${s.slug}`)}
                      className="p-4 sm:p-5 hover:bg-light-200/25 dark:hover:bg-dark-200/25 transition-colors cursor-pointer"
                    >
                      {/* Repost Header if this item is a repost */}
                      {isRepost && item.repostUser && (
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2.5 ml-11">
                          <Repeat size={13} className="shrink-0" />
                          <Link
                            to={`/@${item.repostUser.username}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline flex items-center gap-1"
                          >
                            <span>{item.repostUser.name}</span>
                            <span className="opacity-70 font-normal">(@{item.repostUser.username}) reposted</span>
                          </Link>
                          {item.repostedAt && (
                            <span className="text-dark-400 dark:text-light-400 font-normal">
                              · {formatTimeAgo(item.repostedAt)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Repost Commentary / Quote Bubble if provided */}
                      {isRepost && item.quote && (
                        <div className="mb-3 ml-11 p-3 rounded-2xl bg-light-200/60 dark:bg-dark-200/60 border border-light-300/80 dark:border-dark-300/80 text-sm text-dark-100 dark:text-light-100 font-medium italic shadow-sm">
                          "{item.quote}"
                        </div>
                      )}

                      {/* Post Content Layout */}
                      <div className="flex gap-3.5">
                        {/* Author Avatar Column */}
                        <div className="shrink-0">
                          <Link to={`/@${s.author?.username}`} onClick={(e) => e.stopPropagation()}>
                            <img
                              src={s.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.author?.name || 'Author')}`}
                              alt={s.author?.name}
                              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover border border-light-300 dark:border-dark-300 hover:opacity-90 transition-opacity"
                            />
                          </Link>
                        </div>

                        {/* Story Content Column */}
                        <div className="flex-1 min-w-0">
                          {/* Header metadata row */}
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Link
                                to={`/@${s.author?.username}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-bold text-sm text-dark-100 dark:text-light-100 hover:underline truncate"
                              >
                                {s.author?.name}
                              </Link>
                              <Link
                                to={`/@${s.author?.username}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-dark-400 dark:text-light-400 truncate"
                              >
                                @{s.author?.username}
                              </Link>
                              <span className="text-xs text-dark-400 dark:text-light-400">·</span>
                              <span className="text-xs text-dark-400 dark:text-light-400 shrink-0">
                                {formatTimeAgo(s.createdAt)}
                              </span>
                              {s.category && (
                                <Link
                                  to={`/explore?category=${encodeURIComponent(s.category.slug)}`}
                                  className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-light-200 dark:bg-dark-200 text-dark-300 dark:text-light-300 hover:bg-light-300 dark:hover:bg-dark-300 transition-colors"
                                >
                                  {s.category.name}
                                </Link>
                              )}
                            </div>

                            {/* 1-Click Follow button if not self */}
                            {user?._id !== s.author?._id && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleFollow(s.author._id, s.author.username); }}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                  item.isFollowingAuthor || followingAuthorIds.has(s.author._id)
                                    ? 'border border-light-300 dark:border-dark-300 text-dark-300 dark:text-light-300 hover:border-red-500 hover:text-red-500'
                                    : 'bg-dark-100 dark:bg-light-100 text-light-100 dark:text-dark-100 hover:scale-105 shadow-sm'
                                }`}
                              >
                                {item.isFollowingAuthor || followingAuthorIds.has(s.author._id)
                                  ? 'Following'
                                  : 'Follow'}
                              </button>
                            )}
                          </div>

                          {/* Story Title & Abstract */}
                          <Link to={`/blog/${s.slug}`} onClick={(e) => e.stopPropagation()} className="block group">
                            <h2 className="text-base sm:text-lg font-bold font-heading text-dark-100 dark:text-light-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug mb-1.5">
                              {s.title}
                            </h2>
                            <p className="text-sm font-serif text-dark-300 dark:text-light-300 line-clamp-3 leading-relaxed mb-3">
                              {s.abstract}
                            </p>
                          </Link>

                          {/* Cover Image Preview */}
                          {s.image && (
                            <Link to={`/blog/${s.slug}`} onClick={(e) => e.stopPropagation()} className="block mb-3.5 rounded-2xl overflow-hidden border border-light-300/80 dark:border-dark-300/80 max-h-80 group">
                              <img
                                src={s.image}
                                alt={s.title}
                                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                              />
                            </Link>
                          )}

                          {/* Tags Chips */}
                          {Array.isArray(s.tags) && s.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {s.tags.slice(0, 3).map((tag, idx) => (
                                <Link
                                  key={idx}
                                  to={`/explore?tag=${encodeURIComponent(tag)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                >
                                  #{tag}
                                </Link>
                              ))}
                              {s.readTime && (
                                <span className="text-xs text-dark-400 dark:text-light-400 ml-2">
                                  · {s.readTime}
                                </span>
                              )}
                            </div>
                          )}

                          {/* ── Engagement Action Bar (Engaging X-Style) ── */}
                          <div className="flex items-center justify-between text-dark-400 dark:text-light-400 max-w-md pt-2 border-t border-light-200/70 dark:border-dark-200/70">
                            {/* Comment / Reply button */}
                            <Link
                              to={`/blog/${s.slug}#comments`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 text-xs font-semibold hover:text-sky-500 transition-colors group p-1.5 rounded-full hover:bg-sky-50 dark:hover:bg-sky-950/30"
                              title="Go straight to comments"
                            >
                              <MessageCircle size={16} className="group-hover:scale-110 transition-transform" />
                              <span>{item.commentsCount}</span>
                            </Link>

                            {/* Repost button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleRepost(item); }}
                              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors group p-1.5 rounded-full ${
                                item.isReposted
                                  ? 'text-emerald-500 hover:text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                                  : 'hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              }`}
                              title={item.isReposted ? 'Undo repost' : 'Repost or quote'}
                            >
                              <Repeat
                                size={16}
                                className={`group-hover:rotate-180 transition-transform duration-300 ${
                                  item.isReposted ? 'stroke-[2.5]' : ''
                                }`}
                              />
                              <span>{item.repostsCount}</span>
                            </button>

                            {/* Like button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleLikeStory(s._id); }}
                              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors group p-1.5 rounded-full ${
                                item.isLiked
                                  ? 'text-rose-500 hover:text-rose-600 bg-rose-50/50 dark:bg-rose-950/30'
                                  : 'hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                              }`}
                              title={item.isLiked ? 'Unlike' : 'Like'}
                            >
                              <Heart
                                size={16}
                                fill={item.isLiked ? 'currentColor' : 'none'}
                                className={`group-hover:scale-125 transition-transform ${
                                  item.isLiked ? 'text-rose-500' : ''
                                }`}
                              />
                              <span>{item.likesCount}</span>
                            </button>

                            {/* Bookmark Dropdown */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <BookmarkDropdown
                                submissionId={s._id}
                                isBookmarked={item.isBookmarked}
                                initialFolder={(item as any).bookmarkFolder}
                                onBookmarkChange={(isBm, folder) => {
                                  setFeedItems((prev) =>
                                    prev.map((f) =>
                                      f.submission._id === s._id
                                        ? { ...f, isBookmarked: isBm, bookmarkFolder: folder }
                                        : f
                                    )
                                  );
                                }}
                                size={16}
                              />
                            </div>

                            {/* Share link button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSharePost(s.slug); }}
                              className="p-1.5 rounded-full hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                              title="Share story link"
                            >
                              <Share2 size={16} />
                            </button>

                            {/* Read Article Full */}
                            <Link
                              to={`/blog/${s.slug}`}
                              className="p-1.5 rounded-full hover:text-dark-100 dark:hover:text-light-100 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
                              title="Read full article"
                            >
                              <BookOpen size={16} />
                            </Link>
                          </div>

                          {/* ── Expandable Inline Comments & Thread Section ── */}
                          <AnimatePresence>
                            {isCommentsOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-light-200 dark:border-dark-200 space-y-4 overflow-hidden"
                              >
                                {/* Quick Reply Box for the story */}
                                {isAuthenticated ? (
                                  <div className="flex gap-2.5 items-start">
                                    <img
                                      src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`}
                                      alt="avatar"
                                      className="h-8 w-8 rounded-full object-cover shrink-0"
                                    />
                                    <div className="flex-1 flex gap-2">
                                      <input
                                        type="text"
                                        value={newCommentText[s._id] || ''}
                                        onChange={(e) =>
                                          setNewCommentText((prev) => ({ ...prev, [s._id]: e.target.value }))
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAddComment(s._id);
                                          }
                                        }}
                                        placeholder={`Reply to @${s.author?.username}...`}
                                        className="flex-1 px-3.5 py-2 text-xs rounded-full bg-light-200/60 dark:bg-dark-200/60 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                      />
                                      <button
                                        onClick={() => handleAddComment(s._id)}
                                        disabled={!(newCommentText[s._id] || '').trim()}
                                        className="px-4 py-1.5 rounded-full bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                      >
                                        <Send size={12} />
                                        <span>Reply</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-3 text-center bg-light-200/50 dark:bg-dark-200/50 rounded-xl text-xs text-dark-400 dark:text-light-400">
                                    <Link to="/auth/login" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
                                      Sign in
                                    </Link>{' '}
                                    to join the conversation and reply to this story.
                                  </div>
                                )}

                                {/* Comments list */}
                                {loadingComments[s._id] ? (
                                  <div className="py-4 text-center text-xs text-dark-400 dark:text-light-400 flex items-center justify-center gap-2">
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Loading conversation thread...</span>
                                  </div>
                                ) : commentsForThis.length === 0 ? (
                                  <p className="text-xs text-dark-400 dark:text-light-400 italic py-2">
                                    No comments yet. Be the first to reply!
                                  </p>
                                ) : (
                                  <div className="space-y-3 divide-y divide-light-200/50 dark:divide-dark-200/50">
                                    {commentsForThis.map((comment) => {
                                      const isCommentLiked =
                                        Boolean(user) &&
                                        Array.isArray(comment.likedBy) &&
                                        comment.likedBy.some((uid) => String(uid) === String(user?._id));
                                      const isReplyBoxOpen = Boolean(replyInputOpen[comment._id]);

                                      return (
                                        <div key={comment._id} className="pt-3 space-y-2">
                                          {/* Main Comment Row */}
                                          <div className="flex gap-2.5 items-start">
                                            <img
                                              src={
                                                comment.user?.avatar ||
                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                  comment.user?.name || 'User'
                                                )}`
                                              }
                                              alt={comment.user?.name}
                                              className="h-7 w-7 rounded-full object-cover shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-xs font-bold text-dark-100 dark:text-light-100">
                                                  {comment.user?.name}
                                                </span>
                                                <span className="text-[11px] text-dark-400 dark:text-light-400">
                                                  @{comment.user?.username}
                                                </span>
                                                <span className="text-[11px] text-dark-400 dark:text-light-400">·</span>
                                                <span className="text-[11px] text-dark-400 dark:text-light-400">
                                                  {formatTimeAgo(comment.createdAt)}
                                                </span>
                                              </div>

                                              <p className="text-xs text-dark-200 dark:text-light-200 mt-1 font-serif leading-relaxed">
                                                {comment.content}
                                              </p>

                                              {/* Action buttons under comment */}
                                              <div className="flex items-center gap-4 mt-2 text-[11px] text-dark-400 dark:text-light-400">
                                                {/* Like comment button */}
                                                <button
                                                  onClick={() => handleLikeComment(s._id, comment._id)}
                                                  className={`flex items-center gap-1 hover:text-rose-500 transition-colors ${
                                                    isCommentLiked ? 'text-rose-500 font-bold' : ''
                                                  }`}
                                                >
                                                  <Heart
                                                    size={12}
                                                    fill={isCommentLiked ? 'currentColor' : 'none'}
                                                  />
                                                  <span>{comment.likes || 0}</span>
                                                </button>

                                                {/* Reply to comment toggle */}
                                                <button
                                                  onClick={() =>
                                                    setReplyInputOpen((prev) => ({
                                                      ...prev,
                                                      [comment._id]: !isReplyBoxOpen,
                                                    }))
                                                  }
                                                  className="hover:text-primary-500 transition-colors flex items-center gap-1"
                                                >
                                                  <CornerDownRight size={12} />
                                                  <span>Reply</span>
                                                </button>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Nested Threaded Reply Box */}
                                          {isReplyBoxOpen && (
                                            <div className="ml-9 pl-3 border-l-2 border-primary-500/40 mt-2 flex gap-2">
                                              <input
                                                type="text"
                                                value={replyText[comment._id] || ''}
                                                onChange={(e) =>
                                                  setReplyText((prev) => ({
                                                    ...prev,
                                                    [comment._id]: e.target.value,
                                                  }))
                                                }
                                                placeholder={`Reply to @${comment.user?.username}...`}
                                                className="flex-1 px-3 py-1.5 text-xs rounded-full bg-light-100 dark:bg-dark-100 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                              />
                                              <button
                                                onClick={() => handleAddReplyToComment(s._id, comment._id)}
                                                disabled={!(replyText[comment._id] || '').trim()}
                                                className="px-3 py-1 rounded-full bg-primary-600 text-white text-xs font-bold disabled:opacity-40"
                                              >
                                                Send
                                              </button>
                                            </div>
                                          )}

                                          {/* Threaded Replies List */}
                                          {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                                            <div className="ml-9 pl-3 border-l-2 border-light-300 dark:border-dark-300 space-y-2 mt-2">
                                              {comment.replies.map((reply, rIdx) => (
                                                <div key={reply._id || rIdx} className="flex gap-2 items-start text-xs">
                                                  <img
                                                    src={
                                                      reply.user?.avatar ||
                                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        reply.user?.name || 'User'
                                                      )}`
                                                    }
                                                    alt={reply.user?.name}
                                                    className="h-5 w-5 rounded-full object-cover shrink-0 mt-0.5"
                                                  />
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                      <span className="font-bold text-dark-100 dark:text-light-100">
                                                        {reply.user?.name}
                                                      </span>
                                                      <span className="text-[10px] text-dark-400 dark:text-light-400">
                                                        @{reply.user?.username}
                                                      </span>
                                                      <span className="text-[10px] text-dark-400 dark:text-light-400">
                                                        · {formatTimeAgo(reply.date)}
                                                      </span>
                                                    </div>
                                                    <p className="text-dark-200 dark:text-light-200 font-serif leading-relaxed">
                                                      {reply.content}
                                                    </p>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {/* Load More Trigger */}
                {hasMore && (
                  <div className="p-6 text-center">
                    <button
                      onClick={() => fetchFeed(false)}
                      disabled={loadingMore}
                      className="px-6 py-2.5 rounded-full bg-light-200 dark:bg-dark-200 hover:bg-light-300 dark:hover:bg-dark-300 text-xs font-bold transition-all disabled:opacity-50 inline-flex items-center gap-2 shadow-sm"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Loading more stories...</span>
                        </>
                      ) : (
                        <span>Load More Stories</span>
                      )}
                    </button>
                  </div>
                )}

                {/* End of feed */}
                {!hasMore && feedItems.length > 0 && (
                  <div className="py-10 px-6 text-center border-t border-light-300/60 dark:border-dark-300/60">
                    <div className="h-20 w-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <svg
                        viewBox="0 0 64 64"
                        className="w-10 h-10 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 12h24l8 12v32a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z" />
                        <path d="M20 12v-4a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v4" />
                        <path d="M20 28h24M20 38h16M20 48h12" />
                        <path d="M44 42l4 4 8-10" />
                        <path d="M12 8l2-2M6 14l2-2M14 18l2-2" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold font-heading mb-1">You're all caught up</h3>
                    <p className="text-sm text-dark-400 dark:text-light-400 font-serif">
                      You've reached the end of the feed.
                    </p>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* ══════════════════════════════════════════════════════════════
              RIGHT COLUMN: SIDEBAR WIDGETS (X-STYLE 4 COLS)
          ══════════════════════════════════════════════════════════════ */}
          <aside className="hidden lg:block lg:col-span-4 lg:h-full lg:overflow-y-auto">
            <div className="space-y-6 pb-6">
              
              {/* Search Box */}
              <div className="p-4 rounded-2xl bg-light-200/50 dark:bg-dark-200/50 border border-light-300/60 dark:border-dark-300/60 shadow-sm">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3 text-dark-400 dark:text-light-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
                      }
                    }}
                    placeholder="Search articles & authors..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full bg-light-100 dark:bg-dark-100 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Who to follow */}
              <div className="p-5 rounded-2xl bg-light-200/40 dark:bg-dark-200/40 border border-light-300/60 dark:border-dark-300/60 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-extrabold text-sm tracking-tight flex items-center gap-2">
                    <UserPlus size={16} className="text-primary-500" />
                    <span>Who to follow</span>
                  </h3>
                </div>
                <div className="space-y-4">
                  {featuredAuthors
                    .filter((author) => {
                      if (!author) return false;
                      const aId = author._id ? String(author._id) : '';
                      const currentId = user?._id ? String(user._id) : (user as any)?.id ? String((user as any).id) : '';
                      const aUsername = author.username ? author.username.toLowerCase() : '';
                      const currentHandle = user?.username ? user.username.toLowerCase() : '';
                      return (!currentId || aId !== currentId) && (!currentHandle || aUsername !== currentHandle);
                    })
                    .map((author) => {
                    const isFollowing = followingAuthorIds.has(author._id);
                    return (
                      <div key={author._id} className="flex items-center justify-between gap-3">
                        <Link to={`/@${author.username}`} className="flex items-center gap-2.5 min-w-0 group">
                          <img
                            src={author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}`}
                            alt={author.name}
                            className="h-10 w-10 rounded-full object-cover border border-light-300 dark:border-dark-300 shrink-0 group-hover:opacity-90"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-dark-100 dark:text-light-100 truncate group-hover:underline">
                              {author.name}
                            </p>
                            <p className="text-[11px] text-dark-400 dark:text-light-400 truncate">
                              @{author.username}
                            </p>
                          </div>
                        </Link>

                        {user?._id !== author._id && (
                          <button
                            onClick={() => handleToggleFollow(author._id, author.username)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                              isFollowing
                                ? 'border border-light-300 dark:border-dark-300 text-dark-300 dark:text-light-300 hover:border-red-500 hover:text-red-500'
                                : 'bg-dark-100 dark:bg-light-100 text-light-100 dark:text-dark-100 hover:scale-105 shadow-sm'
                            }`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trending Topics / Tags */}
              <div className="p-5 rounded-2xl bg-light-200/40 dark:bg-dark-200/40 border border-light-300/60 dark:border-dark-300/60 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-extrabold text-sm tracking-tight flex items-center gap-2">
                    <Flame size={16} className="text-amber-500" />
                    <span>Trending Topics</span>
                  </h3>
                </div>
                <div className="space-y-3">
                  {trendingTags.map((tag) => (
                    <Link
                      key={tag.name}
                      to={`/explore?tag=${encodeURIComponent(tag.name)}`}
                      className="block group p-2 rounded-xl hover:bg-light-200/60 dark:hover:bg-dark-200/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-dark-100 dark:text-light-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                          #{tag.name}
                        </span>
                        <span className="text-[11px] text-dark-400 dark:text-light-400">
                          {tag.count} {tag.count === 1 ? 'story' : 'stories'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Publishing Promo Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <h4 className="text-base font-extrabold font-heading mb-2">Publish without gatekeepers</h4>
                <p className="text-xs text-white/80 leading-relaxed mb-4 font-serif">
                  Write long-form articles, get instant machine scoring, build your audience, and join vibrant discussions.
                </p>
                <Link
                  to="/write"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-dark-100 text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  <span>Start Writing</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Sidebar Footer (Last Point) */}
              <div className="px-3 pt-2 text-[11px] text-dark-400 dark:text-light-400 leading-relaxed flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link to="/about" className="hover:underline">About</Link>
                <span>·</span>
                <Link to="/contact" className="hover:underline">Help</Link>
                <span>·</span>
                <Link to="/explore" className="hover:underline">Explore</Link>
                <span>·</span>
                <Link to="/authors" className="hover:underline">Authors</Link>
                <span>·</span>
                <span>© {new Date().getFullYear()} KBlog</span>
              </div>

            </div>
          </aside>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: REPOST OR QUOTE DIALOG
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {quoteModalOpen && quoteTargetItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-light-100 dark:bg-dark-100 rounded-3xl border border-light-300 dark:border-dark-300 shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-light-300/50 dark:border-dark-300/50 mb-4">
                <h3 className="text-base font-bold font-heading flex items-center gap-2">
                  <Repeat size={18} className="text-emerald-500" />
                  <span>Repost Story</span>
                </h3>
                <button
                  onClick={() => setQuoteModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quote commentary input */}
              <div className="mb-4">
                <textarea
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (isModifierPressed(e) && e.key === 'Enter') {
                      e.preventDefault();
                      handleQuoteRepost();
                    }
                  }}
                  placeholder={`Add your own commentary or thoughts (optional)... (${getModifierKeyLabel()}+Enter to post)`}
                  rows={3}
                  className="w-full p-3.5 text-sm rounded-2xl bg-light-200/50 dark:bg-dark-200/50 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-serif"
                />
              </div>

              {/* Referenced story preview card */}
              <div className="p-4 rounded-2xl bg-light-200/40 dark:bg-dark-200/40 border border-light-300/60 dark:border-dark-300/60 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={quoteTargetItem.submission.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(quoteTargetItem.submission.author?.name || 'Author')}`}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                  <span className="text-xs font-bold text-dark-100 dark:text-light-100">
                    {quoteTargetItem.submission.author?.name}
                  </span>
                  <span className="text-[11px] text-dark-400 dark:text-light-400">
                    @{quoteTargetItem.submission.author?.username}
                  </span>
                </div>
                <h5 className="text-sm font-bold font-heading text-dark-100 dark:text-light-100 line-clamp-1 mb-1">
                  {quoteTargetItem.submission.title}
                </h5>
                <p className="text-xs font-serif text-dark-300 dark:text-light-300 line-clamp-2">
                  {quoteTargetItem.submission.abstract}
                </p>
              </div>

              {/* Modal action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleInstantRepost}
                  disabled={submittingQuote}
                  className="px-5 py-2.5 rounded-full border border-light-300 dark:border-dark-300 text-xs font-bold hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
                >
                  Instant Repost
                </button>
                <button
                  onClick={handleQuoteRepost}
                  disabled={submittingQuote}
                  className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  {submittingQuote ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Quote size={13} />
                      <span>Quote & Repost</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialFeedPage;
