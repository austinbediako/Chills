import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Heart, Repeat, MessageSquare, Clock, 
  Settings, Check, UserPlus, UserMinus, ShieldCheck, Sparkles,
  BookOpen, Bookmark, Camera, Pencil, Menu, Loader2, X
} from 'lucide-react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { showNotification, toggleSidebar } from '../redux/slices/uiSlice';
import ImageCropModal, { CropMode } from '../components/common/ImageCropModal';
import FollowersModal, { FollowModalTab } from '../components/profile/FollowersModal';

interface AuthorProfile {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  role?: string;
  isVerified?: boolean;
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
  const { identifier, username, handle } = useParams<{ identifier?: string; username?: string; handle?: string }>();
  const activeIdentifier = identifier || username || handle || '';
  const dispatch = useDispatch();
  const { user, isAuthenticated, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [loadingAuthor, setLoadingAuthor] = useState(true);
  const [authorNotFound, setAuthorNotFound] = useState(false);

  // File Inputs & Image Crop Modal State for Owner
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [cropModalState, setCropModalState] = useState<{
    isOpen: boolean;
    mode: CropMode;
    imageSrc: string;
  }>({
    isOpen: false,
    mode: 'avatar',
    imageSrc: '',
  });

  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<FollowModalTab>('followers');

  // Background Lazy Upload State
  const [backgroundUpload, setBackgroundUpload] = useState<{
    active: boolean;
    type: 'avatar' | 'banner';
    progress: number;
    status: 'uploading' | 'success' | 'error';
    message: string;
  } | null>(null);

  const isOwner = Boolean(
    author?.isSelf ||
      (user?._id && author?._id && String(user._id) === String(author._id)) ||
      (user?.username && author?.username && user.username.toLowerCase() === author.username.toLowerCase())
  );

  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [tabCache, setTabCache] = useState<{
    posts?: StoryItem[];
    reposts?: StoryItem[];
    comments?: CommentItem[];
    likes?: StoryItem[];
  }>({});
  const [tabLoading, setTabLoading] = useState(false);

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

  // Reset tab cache when navigating between different authors
  useEffect(() => {
    if (author?._id) {
      setTabCache({});
      setActiveTab('posts');
    }
  }, [author?._id]);

  // 2. Fetch Tab Content dynamically with persistent cache (switching is instant!)
  useEffect(() => {
    if (!author?._id || !author?.username) return;

    // If already loaded in cache, switch instantly with zero reload/glitch
    if (tabCache[activeTab]) {
      return;
    }

    let isMounted = true;
    const fetchTabItems = async () => {
      try {
        setTabLoading(true);
        let data = [];
        if (activeTab === 'posts') {
          const res = await axios.get(`/api/users/${author.username}/posts`);
          data = res.data || [];
        } else if (activeTab === 'reposts') {
          const res = await axios.get(`/api/users/${author.username}/reposts`);
          data = res.data || [];
        } else if (activeTab === 'comments') {
          const res = await axios.get(`/api/users/${author.username}/comments`);
          data = res.data || [];
        } else if (activeTab === 'likes') {
          const res = await axios.get(`/api/users/${author.username}/likes`);
          data = res.data || [];
        }

        if (isMounted) {
          setTabCache((prev) => ({ ...prev, [activeTab]: data }));
        }
      } catch (err) {
        console.error(`Failed to load ${activeTab} for author:`, err);
      } finally {
        if (isMounted) setTabLoading(false);
      }
    };

    fetchTabItems();
    return () => { isMounted = false; };
  }, [activeTab, author?._id, author?.username, tabCache]);

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

  // 4. Handle Image File Selection for Avatar or Banner
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, mode: CropMode) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      dispatch(
        showNotification({
          message: 'Please select a valid image file (PNG, JPG, WebP).',
          type: 'error',
        })
      );
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      dispatch(
        showNotification({
          message: 'Image must be smaller than 15MB.',
          type: 'error',
        })
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropModalState({
          isOpen: true,
          mode,
          imageSrc: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);

    // Reset value so picking the same file again triggers onChange
    e.target.value = '';
  };

  // 5. Handle Cropped Image Save & Background Lazy Upload
  const handleCropSave = async (croppedBlob: Blob, previewUrl: string) => {
    const mode = cropModalState.mode;
    const folder = mode === 'avatar' ? 'avatars' : 'covers';
    const label = mode === 'avatar' ? 'profile photo' : 'cover banner';

    // 1. Instant optimistic UI update on page
    if (mode === 'avatar') {
      setAuthor((prev) => (prev ? { ...prev, avatar: previewUrl } : null));
    } else {
      setAuthor((prev) => (prev ? { ...prev, coverImage: previewUrl } : null));
    }

    // 2. Start Background Lazy Upload Status
    setBackgroundUpload({
      active: true,
      type: mode,
      progress: 15,
      status: 'uploading',
      message: `Uploading ${label} in background...`,
    });

    // 3. Upload to server storage with real-time progress
    const formData = new FormData();
    formData.append('image', croppedBlob, `${mode}-${Date.now()}.jpg`);

    try {
      const token =
        user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
      const res = await axios.post(`/api/submissions/upload?folder=${folder}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setBackgroundUpload((prev) =>
              prev ? { ...prev, progress: Math.min(95, Math.max(15, percent)) } : null
            );
          }
        },
      });

      const uploadedUrl = res.data?.imageUrl;
      if (!uploadedUrl) throw new Error('No image URL returned from upload server');

      // 4. Update User profile in database & Redux auth state
      const updatePayload = mode === 'avatar' ? { avatar: uploadedUrl } : { coverImage: uploadedUrl };
      await updateUserProfile(updatePayload);

      // 5. Update author state with permanent server URL
      setAuthor((prev) => {
        if (!prev) return null;
        return mode === 'avatar'
          ? { ...prev, avatar: uploadedUrl }
          : { ...prev, coverImage: uploadedUrl };
      });

      // 6. Success notification & status confirmation
      setBackgroundUpload({
        active: true,
        type: mode,
        progress: 100,
        status: 'success',
        message: `${mode === 'avatar' ? 'Profile photo' : 'Cover banner'} updated successfully!`,
      });

      dispatch(
        showNotification({
          message: `${mode === 'avatar' ? 'Profile photo' : 'Cover banner'} updated successfully!`,
          type: 'success',
        })
      );

      // Auto-dismiss after 3.5s
      setTimeout(() => {
        setBackgroundUpload(null);
      }, 3500);
    } catch (err: any) {
      console.error(`Failed to upload ${mode}:`, err);
      setBackgroundUpload({
        active: true,
        type: mode,
        progress: 0,
        status: 'error',
        message: err.response?.data?.message || `Failed to update ${mode}. Reverting...`,
      });

      dispatch(
        showNotification({
          message: err.response?.data?.message || `Failed to update ${mode}. Please try again.`,
          type: 'error',
        })
      );
      // Revert optimistic update by refetching author profile
      fetchAuthorProfile();

      setTimeout(() => {
        setBackgroundUpload(null);
      }, 4000);
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

  // Tab accessor variables reading from memory cache
  const posts = tabCache.posts || [];
  const reposts = tabCache.reposts || [];
  const comments = tabCache.comments || [];
  const likes = tabCache.likes || [];
  const isCurrentTabLoading = tabLoading && !tabCache[activeTab];

  return (
    <div className="max-w-5xl lg:max-w-6xl mx-auto border-x border-light-200 dark:border-dark-300 min-h-screen bg-light-100/50 dark:bg-dark-100/50 pb-20 w-full min-w-0">
      
      {/* ── X-Style Top Header Bar ── */}
      <div className="sticky top-0 z-40 bg-light-100/90 dark:bg-dark-100/90 backdrop-blur-md px-4 py-2 flex items-center justify-between border-b border-light-200 dark:border-dark-300">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-light-200 dark:hover:bg-dark-200 transition-colors text-dark-300 dark:text-light-300 shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 truncate">
            <h2 className="text-base sm:text-lg font-bold font-heading text-dark-100 dark:text-light-100 leading-tight flex items-center gap-1.5 truncate">
              <span className="truncate">{author.name}</span>
              {(author.isVerified || author.role === 'admin' || author.role === 'author') && (
                <img
                  src="/badge.svg"
                  alt="Verified"
                  className="w-4 h-4 shrink-0 inline-block"
                  title="Verified Creator"
                />
              )}
            </h2>
            <span className="text-xs text-dark-400 dark:text-light-400">
              {author.storiesCount} {author.storiesCount === 1 ? 'Story' : 'Stories'}
            </span>
          </div>
        </div>

        <button
          onClick={() => dispatch(toggleSidebar())}
          className="lg:hidden p-2 rounded-full hover:bg-light-200 dark:hover:bg-dark-200 text-dark-400 dark:text-light-300 transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── Cover Banner (Proper Wide Banner Format) ── */}
      <div
        onClick={() => {
          if (isOwner) bannerInputRef.current?.click();
        }}
        className={`relative w-full aspect-[3/1] min-h-[190px] sm:min-h-[240px] md:min-h-[280px] max-h-[340px] bg-gradient-to-r from-primary-600 via-secondary-600 to-indigo-700 overflow-hidden ${
          isOwner ? 'cursor-pointer group' : ''
        }`}
        title={isOwner ? 'Click to change cover banner' : undefined}
      >
        {author.coverImage ? (
          <img
            src={author.coverImage}
            alt="Cover Banner"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />
        ) : (
          <div className="w-full h-full opacity-30 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        )}

        {/* Owner Controls on Cover Banner */}
        {isOwner && (
          <>
            {/* Subtle Hover Overlay */}
            <div className="absolute inset-0 bg-dark-900/0 group-hover:bg-dark-900/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
              <span className="px-4 py-2 rounded-full bg-dark-900/80 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-2 shadow-lg border border-white/10">
                <Camera size={14} /> Click to change cover banner
              </span>
            </div>

            {/* Pencil/Edit Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                bannerInputRef.current?.click();
              }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-dark-900/75 hover:bg-dark-900 text-white backdrop-blur-md text-xs font-bold flex items-center gap-1.5 border border-white/20 shadow-lg transition-all hover:scale-105 active:scale-95"
              title="Edit cover banner"
            >
              <Pencil size={13} className="text-primary-400" />
              <span>Edit Cover</span>
            </button>
          </>
        )}
      </div>

      {/* ── Profile Header Section (like X) ── */}
      <div className="px-5 sm:px-6 relative pb-4">
        
        {/* Avatar and Action Button Row */}
        <div className="flex justify-between items-end -mt-16 sm:-mt-20 mb-4">
          {/* Avatar with Ring & Owner Edit Controls */}
          <div
            onClick={() => {
              if (isOwner) avatarInputRef.current?.click();
            }}
            className={`relative ${isOwner ? 'cursor-pointer group' : ''}`}
            title={isOwner ? 'Click to change profile photo' : undefined}
          >
            <img
              src={author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&size=150`}
              alt={author.name}
              className="h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover border-4 border-light-100 dark:border-dark-100 bg-light-200 dark:bg-dark-200 shadow-xl"
            />

            {/* Owner Hover Overlay for Avatar */}
            {isOwner && (
              <>
                <div className="absolute inset-0 rounded-full bg-dark-900/0 group-hover:bg-dark-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                  <Camera size={22} className="text-white drop-shadow-md" />
                </div>

                {/* Edit Pencil Icon Badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    avatarInputRef.current?.click();
                  }}
                  className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 p-2 rounded-full bg-dark-900 hover:bg-primary-600 text-white shadow-lg border-2 border-light-100 dark:border-dark-100 transition-all hover:scale-110 active:scale-95"
                  title="Change profile photo"
                  aria-label="Change profile photo"
                >
                  <Pencil size={13} />
                </button>
              </>
            )}
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
            <span>{author.name}</span>
            {(author.isVerified || author.role === 'admin' || author.role === 'author') && (
              <img
                src="/badge.svg"
                alt="Verified"
                className="w-5 h-5 shrink-0 inline-block"
                title="Verified Creator"
              />
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

        {/* Meta details row: Joined date, stories count, story likes received */}
        <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-dark-400 dark:text-light-400">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>Joined {new Date(author.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} />
            <span>{author.storiesCount} published {author.storiesCount === 1 ? 'article' : 'articles'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
            <Heart size={14} className="fill-rose-500 text-rose-500 shrink-0" />
            <span>{author.totalLikesReceived} total story likes received</span>
          </div>
        </div>

        {/* Social Counts: Following & Followers (Clickable -> Opens Followers/Following Modal) */}
        <div className="mt-4 flex items-center gap-5 text-sm pt-2 border-t border-light-200/60 dark:border-dark-300/60">
          <button
            type="button"
            onClick={() => {
              setFollowModalTab('following');
              setFollowModalOpen(true);
            }}
            className="flex items-center gap-1.5 cursor-pointer hover:underline text-left group"
          >
            <span className="font-bold text-dark-100 dark:text-light-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {author.followingCount}
            </span>
            <span className="text-dark-400 dark:text-light-400">Following</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFollowModalTab('followers');
              setFollowModalOpen(true);
            }}
            className="flex items-center gap-1.5 cursor-pointer hover:underline text-left group"
          >
            <span className="font-bold text-dark-100 dark:text-light-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {followersCountState}
            </span>
            <span className="text-dark-400 dark:text-light-400">
              {followersCountState === 1 ? 'Follower' : 'Followers'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation Bar (like X) ── */}
      <div className="flex border-b border-light-200 dark:border-dark-300 sticky top-[52px] z-30 bg-light-100/90 dark:bg-dark-100/90 backdrop-blur-md">
        {[
          { id: 'posts' as const, label: 'Posts' },
          { id: 'reposts' as const, label: 'Reposts' },
          { id: 'comments' as const, label: 'Comments' },
          { id: 'likes' as const, label: 'Likes' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab(tab.id);
            }}
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
      <div className="divide-y divide-light-200 dark:divide-dark-300 min-h-[500px] w-full min-w-0">
        {isCurrentTabLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 bg-light-200/60 dark:bg-dark-200/60 rounded-xl animate-pulse" />
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
                    className="p-5 hover:bg-light-200/30 dark:hover:bg-dark-200/30 transition-colors flex flex-col sm:flex-row gap-4 w-full min-w-0"
                  >
                    {post.image && (
                      <div className="h-36 sm:h-28 w-full sm:w-44 rounded-xl overflow-hidden shrink-0">
                        <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-2">
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
                        <Link
                          to={`/blog/${post.slug}#comments`}
                          className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Go to comments"
                        >
                          <MessageSquare size={13} /> {post.comments || 0}
                        </Link>
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
                  <div key={post._id} className="p-5 hover:bg-light-200/30 dark:hover:bg-dark-200/30 transition-colors w-full min-w-0">
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
                      <div className="flex-1 min-w-0 space-y-1.5">
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
                  <div key={comment._id} className="p-5 hover:bg-light-200/30 dark:hover:bg-dark-200/30 transition-colors space-y-2 w-full min-w-0 max-w-full overflow-hidden">
                    {comment.submission && (
                      <div className="text-xs text-dark-400 dark:text-light-400 flex items-center gap-1.5 min-w-0 flex-wrap">
                        <span className="shrink-0">Commented on</span>
                        <Link 
                          to={`/blog/${comment.submission.slug}`}
                          className="font-semibold text-primary-600 dark:text-primary-400 hover:underline truncate max-w-full"
                        >
                          "{comment.submission.title}"
                        </Link>
                      </div>
                    )}
                    <div className="p-3.5 rounded-xl bg-light-200/70 dark:bg-dark-200/60 border border-light-300/50 dark:border-dark-300/50 text-sm font-serif text-dark-100 dark:text-light-100 break-words whitespace-pre-wrap">
                      {comment.content}
                    </div>
                    <div className="flex items-center justify-between text-xs text-dark-400 dark:text-light-400 pt-1">
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
                  <div key={post._id} className="p-5 hover:bg-light-200/30 dark:hover:bg-dark-200/30 transition-colors w-full min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 mb-2">
                      <Heart size={13} fill="currentColor" /> Liked by @{author.username}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {post.image && (
                        <div className="h-32 sm:h-24 w-full sm:w-36 rounded-xl overflow-hidden shrink-0">
                          <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1.5">
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

      {/* Hidden File Inputs for Owner Direct Photo & Banner Editing */}
      {isOwner && (
        <>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleImageSelect(e, 'avatar')}
          />
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleImageSelect(e, 'banner')}
          />
        </>
      )}

      {/* Interactive Image Crop, Reposition & Preview Modal */}
      <ImageCropModal
        isOpen={cropModalState.isOpen}
        mode={cropModalState.mode}
        imageSrc={cropModalState.imageSrc}
        authorName={author.name}
        authorUsername={author.username}
        currentAvatar={author.avatar}
        onClose={() => setCropModalState((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleCropSave}
      />

      {/* Followers & Following Modal (Matching reference with tabs) */}
      <FollowersModal
        isOpen={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
        authorId={author._id}
        authorName={author.name}
        authorUsername={author.username}
        initialTab={followModalTab}
      />

      {/* Background Lazy Upload Status (Confirmation & Progress Modal / Toast) */}
      <AnimatePresence>
        {backgroundUpload?.active && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`fixed bottom-6 right-6 z-50 max-w-sm w-auto sm:min-w-[320px] p-3.5 rounded-2xl shadow-2xl border backdrop-blur-2xl flex items-center gap-3 ${
              backgroundUpload.status === 'success'
                ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 shadow-emerald-500/10'
                : backgroundUpload.status === 'error'
                ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 shadow-rose-500/10'
                : 'bg-light-100/95 dark:bg-dark-200/95 border-light-300 dark:border-dark-300 text-dark-100 dark:text-light-100 shadow-black/10'
            }`}
          >
            {backgroundUpload.status === 'uploading' && (
              <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
                <Loader2 size={16} className="animate-spin" />
              </div>
            )}
            {backgroundUpload.status === 'success' && (
              <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white">
                <Check size={16} />
              </div>
            )}
            {backgroundUpload.status === 'error' && (
              <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-rose-500 text-white">
                <X size={16} />
              </div>
            )}

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold truncate">
                  {backgroundUpload.message}
                </p>
                {backgroundUpload.status === 'uploading' && (
                  <span className="text-[10px] font-mono font-bold text-primary-500 shrink-0">
                    {backgroundUpload.progress}%
                  </span>
                )}
              </div>
              {backgroundUpload.status === 'uploading' && (
                <div className="w-full bg-light-300 dark:bg-dark-300 h-1.5 rounded-full mt-2 overflow-hidden">
                  <motion.div
                    className="bg-primary-500 h-full rounded-full"
                    animate={{ width: `${backgroundUpload.progress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.2 }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setBackgroundUpload(null)}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss status"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthorProfilePage;
