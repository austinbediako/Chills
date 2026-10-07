import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Heart, Repeat, MessageSquare, Clock, 
  Settings, Check, UserPlus, UserMinus, ShieldCheck, Sparkles,
  BookOpen, Bookmark
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

interface AuthorProfile {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  role?: string;
  gender?: string;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  storiesCount: number;
  totalLikesReceived: number;
  isFollowing: boolean;
  isSelf: boolean;
}

interface StoryItem {
  _id: string;
  title: string;
  slug: string;
  abstract: string;
  image?: string;
  readTime?: string;
  createdAt: string;
  likes?: number;
  comments?: number;
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
  author?: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  repostedAt?: string;
  repostQuote?: string;
  likedAt?: string;
}

interface CommentItem {
  _id: string;
  content: string;
  createdAt: string;
  likes: number;
  submission?: {
    _id: string;
    title: string;
    slug: string;
    abstract?: string;
    image?: string;
    category?: {
      name: string;
    };
  };
}

type TabType = 'posts' | 'reposts' | 'comments' | 'likes';

const AuthorProfilePage: React.FC = () => {
  const { identifier, username } = useParams<{ identifier?: string; username?: string }>();
  const activeIdentifier = identifier || username || '';
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [loadingAuthor, setLoadingAuthor] = useState(true);
  const [authorNotFound, setAuthorNotFound] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [posts, setPosts] = useState<StoryItem[]>([]);
  const [reposts, setReposts] = useState<StoryItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [likes, setLikes] = useState<StoryItem[]>([]);
  const [loadingTabContent, setLoadingTabContent] = useState(false);

  const [isFollowingState, setIsFollowingState] = useState(false);
  const [followersCountState, setFollowersCountState] = useState(0);
  const [followSubmitting, setFollowSubmitting] = useState(false);
  const [isHoveringFollow, setIsHoveringFollow] = useState(false);

  const getAuthHeader = useCallback(() => {
    const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, [user]);

  // 1. Fetch Author Profile Info
  const fetchAuthorProfile = useCallback(async () => {
    if (!activeIdentifier) return;
    try {
      setLoadingAuthor(true);
      setAuthorNotFound(false);
      const res = await axios.get(`/api/users/profile/${encodeURIComponent(activeIdentifier)}`, getAuthHeader());
      setAuthor(res.data);
      setIsFollowingState(Boolean(res.data.isFollowing));
      setFollowersCountState(res.data.followersCount || 0);
    } catch (err: any) {
      console.error('Failed to load author profile:', err);
      setAuthorNotFound(true);
    } finally {
      setLoadingAuthor(false);
    }
  }, [activeIdentifier, getAuthHeader]);

  useEffect(() => {
    fetchAuthorProfile();
  }, [fetchAuthorProfile]);

  // 2. Fetch Tab Content dynamically
  useEffect(() => {
    if (!author?._id) return;

    let isMounted = true;
    const fetchTabItems = async () => {
      try {
        setLoadingTabContent(true);
        if (activeTab === 'posts') {
          const res = await axios.get(`/api/users/${author.username}/posts`);
          if (isMounted) setPosts(res.data || []);
        } else if (activeTab === 'reposts') {
          const res = await axios.get(`/api/users/${author.username}/reposts`);
          if (isMounted) setReposts(res.data || []);
        } else if (activeTab === 'comments') {
          const res = await axios.get(`/api/users/${author.username}/comments`);
          if (isMounted) setComments(res.data || []);
        } else if (activeTab === 'likes') {
          const res = await axios.get(`/api/users/${author.username}/likes`);
          if (isMounted) setLikes(res.data || []);
        }
      } catch (err) {
        console.error(`Failed to load ${activeTab} for author:`, err);
      } finally {
        if (isMounted) setLoadingTabContent(false);
      }
    };

    fetchTabItems();
    return () => { isMounted = false; };
  }, [activeTab, author?._id, author?.username]);

  // 3. Handle Follow / Unfollow Toggle
  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    if (!author?._id || followSubmitting) return;

    // Optimistic UI update
    const previousState = isFollowingState;
    const previousCount = followersCountState;
    setIsFollowingState(!previousState);
    setFollowersCountState(previousState ? Math.max(0, previousCount - 1) : previousCount + 1);

    try {
      setFollowSubmitting(true);
      const res = await axios.post(`/api/users/${author._id}/follow`, {}, getAuthHeader());
      setIsFollowingState(Boolean(res.data.isFollowing));
      setFollowersCountState(res.data.followersCount ?? (previousState ? previousCount - 1 : previousCount + 1));
    } catch (err) {
      console.error('Follow toggle error:', err);
      // Revert optimistic update
      setIsFollowingState(previousState);
      setFollowersCountState(previousCount);
    } finally {
      setFollowSubmitting(false);
    }
  };

  if (loadingAuthor) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-4 animate-pulse">
        <div className="h-44 bg-light-200 dark:bg-dark-200 rounded-2xl w-full"></div>
        <div className="flex items-center gap-4 px-4">
          <div className="h-24 w-24 rounded-full bg-light-300 dark:bg-dark-300"></div>
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 bg-light-300 dark:bg-dark-300 rounded"></div>
            <div className="h-4 w-32 bg-light-300 dark:bg-dark-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (authorNotFound || !author) {
    const displayHandle = (activeIdentifier || '').replace(/^@/, '');
    return (
      <div className="max-w-5xl lg:max-w-6xl mx-auto border-x border-light-200 dark:border-dark-300 min-h-screen bg-light-100/50 dark:bg-dark-100/50 pb-20">
        {/* Sticky Header Bar */}
        <div className="sticky top-0 z-40 bg-light-100/80 dark:bg-dark-100/80 backdrop-blur-md px-4 py-3 flex items-center gap-6 border-b border-light-200 dark:border-dark-300">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-base font-bold font-heading">Profile</h2>
            <p className="text-xs text-dark-400 dark:text-light-400">@{displayHandle}</p>
          </div>
        </div>

        {/* Placeholder Cover Banner */}
        <div className="h-44 sm:h-56 bg-light-200 dark:bg-dark-200 w-full relative"></div>

        {/* Empty Avatar Placeholder */}
        <div className="px-6 relative -mt-16 sm:-mt-20 mb-6 flex justify-between items-end">
          <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-light-100 dark:bg-dark-100 border-4 border-light-100 dark:border-dark-100 flex items-center justify-center text-dark-300 dark:text-light-400 shadow-md">
            <UserMinus size={48} />
          </div>
        </div>

        {/* Account Not Found Content */}
        <div className="px-6 py-8 max-w-lg mx-auto text-center space-y-4">
          <div className="text-left mb-6">
            <h3 className="text-xl font-bold font-heading text-dark-100 dark:text-light-100">
              @{displayHandle}
            </h3>
          </div>
          <div className="py-6 space-y-2">
            <h3 className="text-2xl font-extrabold font-heading text-dark-100 dark:text-light-100">
              Account not found
            </h3>
            <p className="text-sm font-serif text-dark-400 dark:text-light-400 leading-relaxed">
              This account doesn’t exist or has been removed. Try searching for another creator or explore the community timeline.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Link
              to="/feed"
              className="px-6 py-2.5 rounded-full bg-dark-100 text-light-100 dark:bg-light-100 dark:text-dark-100 text-xs font-bold hover:scale-105 transition-all shadow-md inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Go to Timeline</span>
            </Link>
            <Link
              to="/explore"
              className="px-6 py-2.5 rounded-full border border-light-300 dark:border-dark-300 text-xs font-bold hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
            >
              Explore Creators
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl lg:max-w-6xl mx-auto border-x border-light-200 dark:border-dark-300 min-h-screen bg-light-100/50 dark:bg-dark-100/50 pb-20">
      
      {/* ── X-Style Top Header Bar ── */}
      <div className="sticky top-0 z-40 bg-light-100/80 dark:bg-dark-100/80 backdrop-blur-md px-4 py-2 flex items-center gap-6 border-b border-light-200 dark:border-dark-300">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-light-200 dark:hover:bg-dark-200 transition-colors text-dark-300 dark:text-light-300"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold font-heading text-dark-100 dark:text-light-100 leading-tight flex items-center gap-1.5">
            {author.name}
            {author.role === 'admin' && (
              <span className="text-primary-500" title="KBlog Staff / Administrator">
                <ShieldCheck size={16} />
              </span>
            )}
          </h2>
          <span className="text-xs text-dark-400 dark:text-light-400">
            {author.storiesCount} {author.storiesCount === 1 ? 'Story' : 'Stories'}
          </span>
        </div>
      </div>

      {/* ── Cover Banner (like X) ── */}
      <div className="relative h-44 sm:h-56 w-full bg-gradient-to-r from-primary-600 via-secondary-600 to-indigo-700 overflow-hidden">
        {author.coverImage ? (
          <img
            src={author.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full opacity-30 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        )}
      </div>

      {/* ── Profile Header Section (like X) ── */}
      <div className="px-5 sm:px-6 relative pb-4">
        
        {/* Avatar and Action Button Row */}
        <div className="flex justify-between items-end -mt-16 sm:-mt-20 mb-4">
          {/* Avatar with Ring */}
          <div className="relative">
            <img
              src={author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&size=150`}
              alt={author.name}
              className="h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover border-4 border-light-100 dark:border-dark-100 bg-light-200 dark:bg-dark-200 shadow-xl"
            />
          </div>

          {/* Action Button: Edit or Follow */}
          <div>
            {author.isSelf ? (
              <Link
                to="/profile"
                className="btn btn-outline rounded-full font-bold text-sm px-5 py-2 flex items-center gap-2 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
              >
                <Settings size={15} /> Edit Profile
              </Link>
            ) : (
              <button
                onClick={handleFollowToggle}
                onMouseEnter={() => setIsHoveringFollow(true)}
                onMouseLeave={() => setIsHoveringFollow(false)}
                disabled={followSubmitting}
                className={`rounded-full font-bold text-sm px-6 py-2 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  isFollowingState
                    ? isHoveringFollow
                      ? 'bg-red-50 text-red-600 border border-red-300 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800'
                      : 'bg-light-100 text-dark-100 border border-light-300 dark:bg-dark-100 dark:text-light-100 dark:border-dark-300'
                    : 'bg-dark-100 text-light-100 dark:bg-light-100 dark:text-dark-100 hover:opacity-90'
                }`}
              >
                {isFollowingState ? (
                  isHoveringFollow ? (
                    <>
                      <UserMinus size={15} /> Unfollow
                    </>
                  ) : (
                    <>
                      <Check size={15} /> Following
                    </>
                  )
                ) : (
                  <>
                    <UserPlus size={15} /> Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Name and Handle */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 flex items-center gap-2">
            {author.name}
            {author.role === 'admin' && (
              <span className="text-primary-500" title="Administrator">
                <ShieldCheck size={20} />
              </span>
            )}
          </h1>
          <p className="text-sm text-dark-400 dark:text-light-400 font-mono">
            @{author.username}
          </p>
        </div>

        {/* Bio */}
        {author.bio ? (
          <p className="mt-3 text-dark-200 dark:text-light-200 text-sm sm:text-base leading-relaxed font-serif">
            {author.bio}
          </p>
        ) : (
          <p className="mt-3 text-dark-400 dark:text-light-400 text-sm italic font-serif">
            Writer and thinker contributing thoughts on KBlog.
          </p>
        )}

        {/* Meta details row: Joined date, stories count */}
        <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-dark-400 dark:text-light-400">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>Joined {new Date(author.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} />
            <span>{author.storiesCount} published {author.storiesCount === 1 ? 'article' : 'articles'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
            <Sparkles size={14} />
            <span>{author.totalLikesReceived} total story likes received</span>
          </div>
        </div>

        {/* Social Counts: Following & Followers (like X) */}
        <div className="mt-4 flex items-center gap-5 text-sm pt-2 border-t border-light-200/60 dark:border-dark-300/60">
          <div className="flex items-center gap-1.5 cursor-pointer hover:underline">
            <span className="font-bold text-dark-100 dark:text-light-100">{author.followingCount}</span>
            <span className="text-dark-400 dark:text-light-400">Following</span>
          </div>
          <div className="flex items-center gap-1.5 cursor-pointer hover:underline">
            <span className="font-bold text-dark-100 dark:text-light-100">{followersCountState}</span>
            <span className="text-dark-400 dark:text-light-400">{followersCountState === 1 ? 'Follower' : 'Followers'}</span>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation Bar (like X) ── */}
      <div className="flex border-b border-light-200 dark:border-dark-300 sticky top-14 z-30 bg-light-100/90 dark:bg-dark-100/90 backdrop-blur-md">
        {[
          { id: 'posts' as const, label: 'Posts' },
          { id: 'reposts' as const, label: 'Reposts' },
          { id: 'comments' as const, label: 'Comments' },
          { id: 'likes' as const, label: 'Likes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-colors relative hover:bg-light-200/40 dark:hover:bg-dark-200/40 ${
              activeTab === tab.id
                ? 'text-dark-100 dark:text-light-100'
                : 'text-dark-400 dark:text-light-400'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="x-profile-tab"
                className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary-600 dark:bg-primary-400 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content Feed ── */}
      <div className="divide-y divide-light-200 dark:divide-dark-300">
        {loadingTabContent ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-light-200 dark:bg-dark-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            {/* ── POSTS TAB ── */}
            {activeTab === 'posts' && (
              posts.length === 0 ? (
                <div className="py-16 text-center text-dark-400 dark:text-light-400">
                  <BookOpen size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="font-serif">@{author.username} hasn't published any stories yet.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <article 
                    key={post._id}
                    className="p-5 hover:bg-light-200/30 dark:hover:bg-dark-200/30 transition-colors flex flex-col sm:flex-row gap-4"
                  >
                    {post.image && (
                      <div className="h-36 sm:h-28 w-full sm:w-44 rounded-xl overflow-hidden shrink-0">
                        <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {post.category && (
                          <Link 
                            to={`/explore?category=${encodeURIComponent(post.category.name)}`}
                            className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:underline"
                          >
                            {post.category.name}
                          </Link>
                        )}
                        <span className="text-xs text-dark-400 dark:text-light-400 flex items-center gap-1">
                          <Clock size={11} /> {post.readTime || '5 min read'}
                        </span>
                      </div>

                      <Link to={`/blog/${post.slug}`} className="block group">
                        <h3 className="text-lg font-bold font-heading text-dark-100 dark:text-light-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-sm font-serif text-dark-300 dark:text-light-300 line-clamp-2">
                        {post.abstract}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-dark-400 dark:text-light-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Heart size={13} /> {post.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={13} /> {post.comments || 0}
                        </span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </article>
                ))
              )
            )}

            {/* ── REPOSTS TAB ── */}
            {activeTab === 'reposts' && (
              reposts.length === 0 ? (
                <div className="py-16 text-center text-dark-400 dark:text-light-400">
                  <Repeat size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="font-serif">No reposted stories to display.</p>
                </div>
              ) : (
                reposts.map((post) => (
                  <div key={post._id} className="p-5 hover:bg-light-200/30 dark:hover:bg-dark-200/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                      <Repeat size={13} /> Reposted by @{author.username}
                    </div>
                    {post.repostQuote && (
                      <div className="mb-3 p-3 rounded-xl bg-light-200/60 dark:bg-dark-200/60 border border-light-300 dark:border-dark-300 text-sm text-dark-100 dark:text-light-100 italic">
                        "{post.repostQuote}"
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4">
                      {post.image && (
                        <div className="h-32 sm:h-24 w-full sm:w-36 rounded-xl overflow-hidden shrink-0">
                          <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'Author')}`}
                            alt=""
                            className="h-4 w-4 rounded-full object-cover"
                          />
                          <Link to={`/authors/${post.author?.username}`} className="text-xs font-medium text-dark-200 dark:text-light-200 hover:underline">
                            {post.author?.name}
                          </Link>
                        </div>
                        <Link to={`/blog/${post.slug}`}>
                          <h4 className="font-bold font-heading text-dark-100 dark:text-light-100 hover:text-primary-600 transition-colors">
                            {post.title}
                          </h4>
                        </Link>
                        <p className="text-xs font-serif text-dark-300 dark:text-light-300 line-clamp-2">
                          {post.abstract}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {/* ── COMMENTS TAB ── */}
            {activeTab === 'comments' && (
              comments.length === 0 ? (
                <div className="py-16 text-center text-dark-400 dark:text-light-400">
                  <MessageSquare size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="font-serif">@{author.username} hasn't posted any comments yet.</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="p-5 hover:bg-light-200/30 dark:hover:bg-dark-200/30 transition-colors space-y-2">
                    {comment.submission && (
                      <div className="text-xs text-dark-400 dark:text-light-400 flex items-center gap-1.5">
                        <span>Commented on</span>
                        <Link 
                          to={`/blog/${comment.submission.slug}`}
                          className="font-semibold text-primary-600 dark:text-primary-400 hover:underline truncate max-w-sm"
                        >
                          "{comment.submission.title}"
                        </Link>
                      </div>
                    )}
                    <div className="p-3.5 rounded-xl bg-light-200/70 dark:bg-dark-200/60 border border-light-300/50 dark:border-dark-300/50 text-sm font-serif text-dark-100 dark:text-light-100">
                      {comment.content}
                    </div>
                    <div className="flex items-center justify-between text-xs text-dark-400 dark:text-light-400">
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} /> {comment.likes || 0}
                      </span>
                    </div>
                  </div>
                ))
              )
            )}

            {/* ── LIKES TAB ── */}
            {activeTab === 'likes' && (
              likes.length === 0 ? (
                <div className="py-16 text-center text-dark-400 dark:text-light-400">
                  <Heart size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="font-serif">No liked stories to show.</p>
                </div>
              ) : (
                likes.map((post) => (
                  <div key={post._id} className="p-5 hover:bg-light-200/30 dark:hover:bg-dark-200/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 mb-2">
                      <Heart size={13} fill="currentColor" /> Liked by @{author.username}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {post.image && (
                        <div className="h-32 sm:h-24 w-full sm:w-36 rounded-xl overflow-hidden shrink-0">
                          <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'Author')}`}
                            alt=""
                            className="h-4 w-4 rounded-full object-cover"
                          />
                          <Link to={`/authors/${post.author?.username}`} className="text-xs font-medium text-dark-200 dark:text-light-200 hover:underline">
                            {post.author?.name}
                          </Link>
                        </div>
                        <Link to={`/blog/${post.slug}`}>
                          <h4 className="font-bold font-heading text-dark-100 dark:text-light-100 hover:text-primary-600 transition-colors">
                            {post.title}
                          </h4>
                        </Link>
                        <p className="text-xs font-serif text-dark-300 dark:text-light-300 line-clamp-2">
                          {post.abstract}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default AuthorProfilePage;
