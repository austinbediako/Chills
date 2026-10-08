import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowLeft,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Image as ImageIcon,
  Tag,
  X,
  Repeat,
  Heart,
  MessageCircle,
  ExternalLink,
  SlidersHorizontal,
  Clock,
  Compass,
  Check,
  Flame,
  Globe,
  Menu,
} from 'lucide-react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useAuth } from '../../hooks/useAuth';
import BookmarkDropdown from '../../components/common/BookmarkDropdown';

interface AuthorResult {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  followers?: string[];
  following?: string[];
  followersCount?: number;
  followingCount?: number;
  storiesCount?: number;
  isFollowing?: boolean;
}

interface TopicResult {
  name: string;
  slug: string;
  type: 'category' | 'tag';
  count: number | null;
}

const BlogListPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { submissions, loading, getSubmissions, interactSubmission } = useSubmissions();
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and Filter State
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'For you';
  const initialSearchTab = searchParams.get('tab') || 'top';
  const initialTag = searchParams.get('tag') || '';

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [activeSearchQuery, setActiveSearchQuery] = useState(initialSearch);
  const [activeCategoryTab, setActiveCategoryTab] = useState(initialCategory);
  const [searchTab, setSearchTab] = useState<'top' | 'latest' | 'people' | 'media' | 'topics'>(
    (initialSearchTab as any) || 'top'
  );

  // Data State
  const [categories, setCategories] = useState<Array<{ _id: string; name: string; slug: string }>>([]);
  const [popularTags, setPopularTags] = useState<Array<{ name: string; count: number }>>([]);
  const [followingMap, setFollowingMap] = useState<{ [authorId: string]: boolean }>({});
  const [followLoading, setFollowLoading] = useState<{ [authorId: string]: boolean }>({});
  const [repostedMap, setRepostedMap] = useState<{ [subId: string]: boolean }>({});
  const [likedMap, setLikedMap] = useState<{ [subId: string]: boolean }>({});
  const [likesCountMap, setLikesCountMap] = useState<{ [subId: string]: number }>({});
  const [repostsCountMap, setRepostsCountMap] = useState<{ [subId: string]: number }>({});

  // Search Results State
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    stories: any[];
    spotlightPeople: AuthorResult[];
    people: AuthorResult[];
    topics: TopicResult[];
    total: number;
  }>({
    stories: [],
    spotlightPeople: [],
    people: [],
    topics: [],
    total: 0,
  });

  const isSearchActive = Boolean(activeSearchQuery.trim());

  const getAuthHeader = useCallback(() => {
    const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, [user]);

  // 1. Fetch categories and popular tags
  useEffect(() => {
    axios
      .get('/api/categories')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        }
      })
      .catch(() => {});

    axios
      .get('/api/submissions/popular/tags')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setPopularTags(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Sync URL params
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q') || '';
    const cat = searchParams.get('category') || 'For you';
    const tab = (searchParams.get('tab') as any) || 'top';

    setSearchInput(q);
    setActiveSearchQuery(q);
    setActiveCategoryTab(cat);
    if (['top', 'latest', 'people', 'media', 'topics'].includes(tab)) {
      setSearchTab(tab);
    }
  }, [searchParams]);

  // 3. Explore mode (when NOT searching)
  useEffect(() => {
    if (isSearchActive) return;

    const params: { category?: string; sort?: string; tag?: string; limit: number } = {
      limit: 20,
    };

    if (initialTag) {
      params.tag = initialTag;
    }
    if (activeCategoryTab === 'Trending') {
      params.sort = '-likesCount';
    } else if (activeCategoryTab !== 'For you' && activeCategoryTab !== 'All') {
      params.category = activeCategoryTab;
      params.sort = '-createdAt';
    } else {
      params.sort = '-createdAt';
    }

    getSubmissions(params);
  }, [isSearchActive, activeCategoryTab, initialTag, getSubmissions]);

  // 4. Intelligent Search Algorithm Mode (Top, Latest, People, Media, Topics)
  useEffect(() => {
    if (!isSearchActive) return;

    let isCurrent = true;
    setSearchLoading(true);

    axios
      .get(
        `/api/submissions/search/explore?q=${encodeURIComponent(activeSearchQuery)}&tab=${searchTab}`,
        getAuthHeader()
      )
      .then((res) => {
        if (!isCurrent) return;
        const data = res.data || {};
        setSearchResults({
          stories: Array.isArray(data.stories) ? data.stories : [],
          spotlightPeople: Array.isArray(data.spotlightPeople) ? data.spotlightPeople : [],
          people: Array.isArray(data.people) ? data.people : [],
          topics: Array.isArray(data.topics) ? data.topics : [],
          total: data.total || 0,
        });

        // Initialize follow map for people and spotlight people
        const allPeople = [
          ...(Array.isArray(data.people) ? data.people : []),
          ...(Array.isArray(data.spotlightPeople) ? data.spotlightPeople : []),
        ];
        const currentUserId = user?._id;
        setFollowingMap((prev) => {
          const next = { ...prev };
          allPeople.forEach((p: AuthorResult) => {
            if (p.isFollowing !== undefined) {
              next[p._id] = p.isFollowing;
            } else if (currentUserId && Array.isArray(p.followers)) {
              next[p._id] = p.followers.some((f) => f.toString() === currentUserId);
            }
          });
          return next;
        });
      })
      .catch((err) => {
        console.error('Search explore error:', err);
      })
      .finally(() => {
        if (isCurrent) setSearchLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeSearchQuery, searchTab, isSearchActive, getAuthHeader, user?._id]);

  // Search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    const nextParams = new URLSearchParams(searchParams);

    if (trimmed) {
      nextParams.set('q', trimmed);
      nextParams.delete('search');
      nextParams.set('tab', 'top');
      setActiveSearchQuery(trimmed);
      setSearchTab('top');
    } else {
      nextParams.delete('q');
      nextParams.delete('search');
      setActiveSearchQuery('');
    }
    setSearchParams(nextParams);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveSearchQuery('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    nextParams.delete('search');
    nextParams.delete('tab');
    setSearchParams(nextParams);
  };

  const handleSelectCategoryTab = (catName: string) => {
    setActiveCategoryTab(catName);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    nextParams.delete('search');
    nextParams.delete('tag');
    if (catName === 'For you') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', catName);
    }
    setSearchParams(nextParams);
  };

  const handleSelectSearchTab = (tab: 'top' | 'latest' | 'people' | 'media' | 'topics') => {
    setSearchTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tab);
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tagName: string) => {
    const clean = tagName.replace(/^#/, '').trim();
    setSearchInput(clean);
    setActiveSearchQuery(clean);
    const nextParams = new URLSearchParams();
    nextParams.set('q', clean);
    nextParams.set('tab', 'top');
    setSearchParams(nextParams);
  };

  // Follow / Unfollow toggle
  const handleFollowToggle = async (targetId: string, username: string) => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    const prevFollowing = Boolean(followingMap[targetId]);
    setFollowingMap((prev) => ({ ...prev, [targetId]: !prevFollowing }));

    try {
      setFollowLoading((prev) => ({ ...prev, [targetId]: true }));
      const res = await axios.post(`/api/users/${targetId}/follow`, {}, getAuthHeader());
      setFollowingMap((prev) => ({ ...prev, [targetId]: Boolean(res.data.isFollowing) }));
    } catch (err) {
      // Revert on error
      setFollowingMap((prev) => ({ ...prev, [targetId]: prevFollowing }));
    } finally {
      setFollowLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  // Synchronize engagement maps from submissions
  useEffect(() => {
    if (Array.isArray(submissions) && submissions.length > 0) {
      setLikedMap((prev) => {
        const next = { ...prev };
        submissions.forEach((s) => {
          if (next[s._id] === undefined && s.isLiked !== undefined) {
            next[s._id] = Boolean(s.isLiked);
          }
        });
        return next;
      });
      setRepostedMap((prev) => {
        const next = { ...prev };
        submissions.forEach((s) => {
          if (next[s._id] === undefined && s.isReposted !== undefined) {
            next[s._id] = Boolean(s.isReposted);
          }
        });
        return next;
      });
      setLikesCountMap((prev) => {
        const next = { ...prev };
        submissions.forEach((s) => {
          if (next[s._id] === undefined) {
            next[s._id] = typeof s.likesCount === 'number' ? s.likesCount : (Array.isArray(s.likes) ? s.likes.length : 0);
          }
        });
        return next;
      });
      setRepostsCountMap((prev) => {
        const next = { ...prev };
        submissions.forEach((s) => {
          if (next[s._id] === undefined) {
            next[s._id] = typeof s.repostsCount === 'number' ? s.repostsCount : (Array.isArray(s.reposts) ? s.reposts.length : 0);
          }
        });
        return next;
      });
    }
  }, [submissions]);

  // Synchronize engagement maps from searchResults
  useEffect(() => {
    if (Array.isArray(searchResults.stories) && searchResults.stories.length > 0) {
      setLikedMap((prev) => {
        const next = { ...prev };
        searchResults.stories.forEach((s) => {
          if (next[s._id] === undefined && s.isLiked !== undefined) {
            next[s._id] = Boolean(s.isLiked);
          }
        });
        return next;
      });
      setRepostedMap((prev) => {
        const next = { ...prev };
        searchResults.stories.forEach((s) => {
          if (next[s._id] === undefined && s.isReposted !== undefined) {
            next[s._id] = Boolean(s.isReposted);
          }
        });
        return next;
      });
      setLikesCountMap((prev) => {
        const next = { ...prev };
        searchResults.stories.forEach((s) => {
          if (next[s._id] === undefined) {
            next[s._id] = typeof s.likesCount === 'number' ? s.likesCount : (Array.isArray(s.likes) ? s.likes.length : 0);
          }
        });
        return next;
      });
      setRepostsCountMap((prev) => {
        const next = { ...prev };
        searchResults.stories.forEach((s) => {
          if (next[s._id] === undefined) {
            next[s._id] = typeof s.repostsCount === 'number' ? s.repostsCount : (Array.isArray(s.reposts) ? s.reposts.length : 0);
          }
        });
        return next;
      });
    }
  }, [searchResults.stories]);

  // Repost toggle with optimistic count
  const handleRepostToggle = async (submissionId: string, baseCount = 0) => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    const wasReposted = Boolean(repostedMap[submissionId]);
    const nextReposted = !wasReposted;
    const currentCount = repostsCountMap[submissionId] !== undefined ? repostsCountMap[submissionId] : baseCount;
    const nextCount = nextReposted ? currentCount + 1 : Math.max(0, currentCount - 1);

    setRepostedMap((prevMap) => ({ ...prevMap, [submissionId]: nextReposted }));
    setRepostsCountMap((prevMap) => ({ ...prevMap, [submissionId]: nextCount }));

    try {
      const res = await axios.post(`/api/submissions/${submissionId}/repost`, {}, getAuthHeader());
      if (res.data) {
        if (typeof res.data.isReposted === 'boolean') {
          setRepostedMap((prevMap) => ({ ...prevMap, [submissionId]: res.data.isReposted }));
        }
        if (typeof res.data.repostsCount === 'number') {
          setRepostsCountMap((prevMap) => ({ ...prevMap, [submissionId]: res.data.repostsCount }));
        }
      }
    } catch {
      // Revert on error
      setRepostedMap((prevMap) => ({ ...prevMap, [submissionId]: wasReposted }));
      setRepostsCountMap((prevMap) => ({ ...prevMap, [submissionId]: currentCount }));
    }
  };

  // Like toggle with optimistic count
  const handleLikeToggle = async (submissionId: string, baseCount = 0) => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    const wasLiked = Boolean(likedMap[submissionId]);
    const nextLiked = !wasLiked;
    const currentCount = likesCountMap[submissionId] !== undefined ? likesCountMap[submissionId] : baseCount;
    const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    setLikedMap((prevMap) => ({ ...prevMap, [submissionId]: nextLiked }));
    setLikesCountMap((prevMap) => ({ ...prevMap, [submissionId]: nextCount }));

    try {
      await interactSubmission(submissionId, 'LIKE');
    } catch {
      // Revert on error
      setLikedMap((prevMap) => ({ ...prevMap, [submissionId]: wasLiked }));
      setLikesCountMap((prevMap) => ({ ...prevMap, [submissionId]: currentCount }));
    }
  };

  // Filter media-only items if searchTab === 'media'
  const displaySubmissions = useMemo(() => {
    if (searchTab === 'media') {
      return submissions.filter((s) => Boolean(s.image));
    }
    return submissions;
  }, [submissions, searchTab]);

  // Featured highlights (Top 3 for carousel)
  const featuredHighlights = useMemo(() => {
    return submissions.slice(0, 4);
  }, [submissions]);

  return (
    <div className="w-full min-h-screen bg-light-100 dark:bg-dark-100 overflow-x-hidden">
      <div className="max-w-5xl lg:max-w-6xl mx-auto border-x border-light-200 dark:border-dark-300 min-h-screen flex flex-col pb-24 overflow-x-hidden">
        {/* ========================================================================= */}
        {/* TOP HEADER & SEARCH BAR (Sticky X-Style) */}
        {/* ========================================================================= */}
        <header className="sticky top-0 z-30 bg-light-100/95 dark:bg-dark-100/95 backdrop-blur-md border-b border-light-300 dark:border-dark-300 shadow-sm">
          <div className="px-4 py-2.5 flex items-center gap-3">
            {!isSearchActive && (
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="lg:hidden p-2 -ml-1 rounded-full hover:bg-light-200 dark:hover:bg-dark-200 text-dark-400 dark:text-light-300 transition-colors shrink-0"
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>
            )}

            {isSearchActive && (
              <button
                onClick={handleClearSearch}
                className="p-2 rounded-full hover:bg-light-200 dark:hover:bg-dark-200 text-dark-500 dark:text-light-300 transition-colors shrink-0"
                aria-label="Exit Search"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            {/* Pill Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <div className="relative flex items-center">
                <Search
                  size={18}
                  className="absolute left-3.5 text-dark-400 dark:text-light-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search KBlog..."
                  className="w-full bg-light-200 dark:bg-dark-200 text-dark-100 dark:text-light-100 placeholder-dark-400 dark:placeholder-light-400 text-sm rounded-full pl-10 pr-9 py-2.5 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-light-100 dark:focus:bg-dark-100 transition-all shadow-inner"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      if (isSearchActive) handleClearSearch();
                    }}
                    className="absolute right-3 p-1 rounded-full text-dark-400 hover:text-dark-100 dark:text-light-400 dark:hover:text-light-100 hover:bg-light-300 dark:hover:bg-dark-300 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </form>

            <button
              onClick={() => navigate('/feed')}
              className="p-2.5 rounded-full hover:bg-light-200 dark:hover:bg-dark-200 text-dark-400 dark:text-light-400 hover:text-dark-100 dark:hover:text-light-100 transition-colors shrink-0"
              title="Social Feed Timeline"
            >
              <Sparkles size={19} />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* HORIZONTAL TABS - 100% Responsive, Zero Horizontal Scroll or Swipe */}
          {/* ========================================================================= */}
          {isSearchActive ? (
            /* MODE 1: SEARCH RESULTS TABS (Top, Latest, People, Media, Topics) */
            <div className="w-full flex items-center border-t border-light-300 dark:border-dark-300 overflow-hidden">
              {(
                [
                  { id: 'top', label: 'Top' },
                  { id: 'latest', label: 'Latest' },
                  { id: 'people', label: 'People' },
                  { id: 'media', label: 'Media' },
                  { id: 'topics', label: 'Topics' },
                ] as const
              ).map((tab) => {
                const isActive = searchTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectSearchTab(tab.id)}
                    className="flex-1 min-w-0 py-3 text-center text-xs sm:text-sm font-semibold transition-colors relative hover:bg-light-200/50 dark:hover:bg-dark-200/40"
                  >
                    <span
                      className={`truncate block px-0.5 ${
                        isActive
                          ? 'text-dark-100 dark:text-light-100 font-bold'
                          : 'text-dark-400 dark:text-light-400 font-medium'
                      }`}
                    >
                      {tab.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="searchActiveIndicator"
                        className="absolute bottom-0 left-1 right-1 h-1 bg-primary-500 rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* MODE 2: DEFAULT EXPLORE TABS (Cut short - top 3-4 tabs only, NO horizontal scroll or swipe) */
            <div className="w-full flex items-center border-t border-light-300 dark:border-dark-300 overflow-hidden">
              {['For you', 'Trending', ...categories.slice(0, 2).map((c) => c.name)].map((cat) => {
                const isActive = activeCategoryTab === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => handleSelectCategoryTab(cat)}
                    className="flex-1 min-w-0 py-3 text-center text-xs sm:text-sm font-semibold transition-colors relative hover:bg-light-200/50 dark:hover:bg-dark-200/40"
                  >
                    <span
                      className={`truncate block px-1 ${
                        isActive
                          ? 'text-dark-100 dark:text-light-100 font-bold'
                          : 'text-dark-400 dark:text-light-400 font-medium'
                      }`}
                    >
                      {cat}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="exploreActiveIndicator"
                        className="absolute bottom-0 left-2 right-2 h-1 bg-primary-500 rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        {/* ========================================================================= */}
        {/* MAIN BODY CONTENT */}
        {/* ========================================================================= */}
        <main className="flex-1">
          {/* SEARCH MODE VIEWS */}
          {isSearchActive ? (
            <div className="divide-y divide-light-200 dark:divide-dark-300">
              {/* Search Info Pill */}
              <div className="px-4 py-2.5 bg-light-150/40 dark:bg-dark-200/20 text-xs text-dark-400 dark:text-light-400 flex items-center justify-between border-b border-light-200 dark:border-dark-300">
                <span>
                  Showing results for <strong className="text-dark-100 dark:text-light-100 font-semibold">"{activeSearchQuery}"</strong>
                </span>
                <span className="font-mono text-[11px]">
                  {searchTab === 'people'
                    ? `${searchResults.people.length} accounts`
                    : searchTab === 'topics'
                    ? `${searchResults.topics.length} topics`
                    : `${searchResults.stories.length} articles`}
                </span>
              </div>

              {/* LOADING STATE */}
              {searchLoading ? (
                <div className="p-16 text-center space-y-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-500 border-t-transparent mx-auto"></div>
                  <p className="text-xs text-dark-400 dark:text-light-400 font-mono">
                    {searchTab === 'people'
                      ? 'Searching accounts...'
                      : searchTab === 'topics'
                      ? 'Searching topics & categories...'
                      : 'Finding stories & ranking by engagement...'}
                  </p>
                </div>
              ) : (
                <>
                  {/* TAB 1: TOP (Ranked by Engagement + Relevance + Recency + Spotlight People) */}
                  {searchTab === 'top' && (
                    <div className="divide-y divide-light-200 dark:divide-dark-300">
                      {/* Spotlight Creator Box (Twitter/X style spotlight) */}
                      {searchResults.spotlightPeople.length > 0 && (
                        <div className="p-4 bg-light-150/30 dark:bg-dark-200/20 border-b border-light-200 dark:border-dark-300">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-dark-400 dark:text-light-400 flex items-center gap-1.5">
                              <Users size={14} className="text-primary-500" />
                              <span>People</span>
                            </h3>
                            <button
                              onClick={() => handleSelectSearchTab('people')}
                              className="text-xs font-bold text-primary-500 hover:underline"
                            >
                              View all
                            </button>
                          </div>
                          <div className="space-y-3">
                            {searchResults.spotlightPeople.map((person) => {
                              const isSelf = person._id === user?._id;
                              const isFollowing = Boolean(followingMap[person._id]);
                              const isFollowLoadingThis = Boolean(followLoading[person._id]);
                              return (
                                <div key={person._id} className="flex items-start justify-between gap-3">
                                  <Link
                                    to={`/@${person.username}`}
                                    className="flex items-start gap-3 flex-1 min-w-0 group"
                                  >
                                    <img
                                      src={
                                        person.avatar ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name || 'Author')}`
                                      }
                                      alt={person.name}
                                      className="w-10 h-10 rounded-full object-cover border border-light-300 dark:border-dark-300 shrink-0 group-hover:ring-2 ring-primary-500 transition-all"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold text-sm text-dark-100 dark:text-light-100 group-hover:underline truncate">
                                        {person.name}
                                      </p>
                                      <p className="text-xs text-dark-400 dark:text-light-400 truncate">
                                        @{person.username}
                                      </p>
                                      {person.bio && (
                                        <p className="text-xs text-dark-300 dark:text-light-300 mt-1 line-clamp-1 leading-relaxed">
                                          {person.bio}
                                        </p>
                                      )}
                                    </div>
                                  </Link>
                                  {!isSelf && (
                                    <button
                                      onClick={() => handleFollowToggle(person._id, person.username)}
                                      disabled={isFollowLoadingThis}
                                      className={`shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all ${
                                        isFollowing
                                          ? 'border border-light-400 dark:border-dark-300 text-dark-100 dark:text-light-100 hover:border-red-500 hover:text-red-500'
                                          : 'bg-dark-100 text-light-100 dark:bg-light-100 dark:text-dark-100 hover:opacity-90 shadow-sm'
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
                      )}

                      {/* Top Stories List */}
                      {searchResults.stories.length === 0 && searchResults.spotlightPeople.length === 0 ? (
                        <div className="p-16 text-center space-y-2">
                          <Search className="w-12 h-12 text-dark-300 dark:text-light-400 mx-auto stroke-[1.5]" />
                          <h3 className="text-base font-bold font-heading">No top results</h3>
                          <p className="text-xs text-dark-400 dark:text-light-400">
                            Try searching for another keyword, author, or tag.
                          </p>
                        </div>
                      ) : (
                        searchResults.stories.map((sub) => (
                          <StoryCard
                            key={sub._id}
                            sub={sub}
                            isReposted={Boolean(repostedMap[sub._id] !== undefined ? repostedMap[sub._id] : sub.isReposted)}
                            isLiked={Boolean(likedMap[sub._id] !== undefined ? likedMap[sub._id] : sub.isLiked)}
                            likesCount={likesCountMap[sub._id] !== undefined ? likesCountMap[sub._id] : (sub.likesCount ?? (Array.isArray(sub.likes) ? sub.likes.length : 0))}
                            repostsCount={repostsCountMap[sub._id] !== undefined ? repostsCountMap[sub._id] : (sub.repostsCount ?? (Array.isArray(sub.reposts) ? sub.reposts.length : 0))}
                            onRepost={() => handleRepostToggle(sub._id, sub.repostsCount ?? (Array.isArray(sub.reposts) ? sub.reposts.length : 0))}
                            onLike={() => handleLikeToggle(sub._id, sub.likesCount ?? (Array.isArray(sub.likes) ? sub.likes.length : 0))}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 2: LATEST (Reverse Chronological Order) */}
                  {searchTab === 'latest' && (
                    <div className="divide-y divide-light-300 dark:divide-dark-300">
                      {searchResults.stories.length === 0 ? (
                        <div className="p-16 text-center space-y-2">
                          <Clock className="w-12 h-12 text-dark-300 dark:text-light-400 mx-auto stroke-[1.5]" />
                          <h3 className="text-base font-bold font-heading">No recent articles found</h3>
                          <p className="text-xs text-dark-400 dark:text-light-400">
                            No recent stories match "{activeSearchQuery}".
                          </p>
                        </div>
                      ) : (
                        searchResults.stories.map((sub) => (
                          <StoryCard
                            key={sub._id}
                            sub={sub}
                            isReposted={Boolean(repostedMap[sub._id] !== undefined ? repostedMap[sub._id] : sub.isReposted)}
                            isLiked={Boolean(likedMap[sub._id] !== undefined ? likedMap[sub._id] : sub.isLiked)}
                            likesCount={likesCountMap[sub._id] !== undefined ? likesCountMap[sub._id] : (sub.likesCount ?? (Array.isArray(sub.likes) ? sub.likes.length : 0))}
                            repostsCount={repostsCountMap[sub._id] !== undefined ? repostsCountMap[sub._id] : (sub.repostsCount ?? (Array.isArray(sub.reposts) ? sub.reposts.length : 0))}
                            onRepost={() => handleRepostToggle(sub._id, sub.repostsCount ?? (Array.isArray(sub.reposts) ? sub.reposts.length : 0))}
                            onLike={() => handleLikeToggle(sub._id, sub.likesCount ?? (Array.isArray(sub.likes) ? sub.likes.length : 0))}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 3: PEOPLE (X-Style Account Cards with Follow Action) */}
                  {searchTab === 'people' && (
                    <div className="divide-y divide-light-300 dark:divide-dark-300">
                      {searchResults.people.length === 0 ? (
                        <div className="p-16 text-center space-y-2">
                          <User className="w-12 h-12 text-dark-300 dark:text-light-400 mx-auto stroke-[1.5]" />
                          <h3 className="text-base font-bold font-heading">No accounts found</h3>
                          <p className="text-xs text-dark-400 dark:text-light-400">
                            Try searching for another name or handle.
                          </p>
                        </div>
                      ) : (
                        searchResults.people.map((person) => {
                          const isSelf = person._id === user?._id;
                          const isFollowing = Boolean(followingMap[person._id]);
                          const isFollowLoadingThis = Boolean(followLoading[person._id]);

                          return (
                            <div
                              key={person._id}
                              className="p-4 hover:bg-light-200/40 dark:hover:bg-dark-200/30 transition-colors flex items-start justify-between gap-4 border-b border-light-300 dark:border-dark-300"
                            >
                              <Link
                                to={`/@${person.username}`}
                                className="flex items-start gap-3.5 flex-1 min-w-0 group"
                              >
                                <img
                                  src={
                                    person.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name || 'Author')}`
                                  }
                                  alt={person.name}
                                  className="w-12 h-12 rounded-full object-cover border border-light-300 dark:border-dark-300 shrink-0 group-hover:ring-2 ring-primary-500 transition-all"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-sm text-dark-100 dark:text-light-100 group-hover:underline truncate">
                                    {person.name}
                                  </p>
                                  <p className="text-xs text-dark-400 dark:text-light-400 truncate">
                                    @{person.username}
                                  </p>
                                  {person.bio && (
                                    <p className="text-xs text-dark-300 dark:text-light-300 mt-1 line-clamp-2 leading-relaxed">
                                      {person.bio}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 text-[11px] text-dark-400 dark:text-light-400 mt-1.5 font-mono">
                                    <span>
                                      {typeof person.followersCount === 'number'
                                        ? person.followersCount
                                        : Array.isArray(person.followers)
                                        ? person.followers.length
                                        : 0}{' '}
                                      Followers
                                    </span>
                                    {typeof person.storiesCount === 'number' && (
                                      <span>• {person.storiesCount} Stories</span>
                                    )}
                                  </div>
                                </div>
                              </Link>

                              {!isSelf ? (
                                <button
                                  onClick={() => handleFollowToggle(person._id, person.username)}
                                  disabled={isFollowLoadingThis}
                                  className={`shrink-0 text-xs font-bold px-4 py-1.5 rounded-full transition-all ${
                                    isFollowing
                                      ? 'border border-light-400 dark:border-dark-300 text-dark-100 dark:text-light-100 hover:border-red-500 hover:text-red-500'
                                      : 'bg-dark-100 text-light-100 dark:bg-light-100 dark:text-dark-100 hover:opacity-90 shadow-sm'
                                  }`}
                                >
                                  {isFollowing ? 'Following' : 'Follow'}
                                </button>
                              ) : (
                                <span className="shrink-0 text-xs font-semibold px-3 py-1 rounded-full bg-light-200 dark:bg-dark-200 text-dark-400 dark:text-light-400 border border-light-300 dark:border-dark-300">
                                  You
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* TAB 4: MEDIA (Articles with visual images & illustrations) */}
                  {searchTab === 'media' && (
                    <div className="divide-y divide-light-300 dark:divide-dark-300">
                      {searchResults.stories.length === 0 ? (
                        <div className="p-16 text-center space-y-2">
                          <ImageIcon className="w-12 h-12 text-dark-300 dark:text-light-400 mx-auto stroke-[1.5]" />
                          <h3 className="text-base font-bold font-heading">No media found</h3>
                          <p className="text-xs text-dark-400 dark:text-light-400">
                            No articles with photos or illustrations match "{activeSearchQuery}".
                          </p>
                        </div>
                      ) : (
                        searchResults.stories.map((sub) => (
                          <StoryCard
                            key={sub._id}
                            sub={sub}
                            isReposted={Boolean(repostedMap[sub._id] !== undefined ? repostedMap[sub._id] : sub.isReposted)}
                            isLiked={Boolean(likedMap[sub._id] !== undefined ? likedMap[sub._id] : sub.isLiked)}
                            likesCount={likesCountMap[sub._id] !== undefined ? likesCountMap[sub._id] : (sub.likesCount ?? (Array.isArray(sub.likes) ? sub.likes.length : 0))}
                            repostsCount={repostsCountMap[sub._id] !== undefined ? repostsCountMap[sub._id] : (sub.repostsCount ?? (Array.isArray(sub.reposts) ? sub.reposts.length : 0))}
                            onRepost={() => handleRepostToggle(sub._id, sub.repostsCount ?? (Array.isArray(sub.reposts) ? sub.reposts.length : 0))}
                            onLike={() => handleLikeToggle(sub._id, sub.likesCount ?? (Array.isArray(sub.likes) ? sub.likes.length : 0))}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 5: TOPICS (Matching Tags, Categories & Related Stories) */}
                  {searchTab === 'topics' && (
                    <div className="divide-y divide-light-300 dark:divide-dark-300">
                      <div className="p-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-dark-400 dark:text-light-400 mb-3 flex items-center gap-1.5">
                          <Tag size={13} className="text-primary-500" />
                          <span>Matching Topics & Categories</span>
                        </h3>
                        {searchResults.topics.length === 0 ? (
                          <p className="text-xs text-dark-400 dark:text-light-400 py-2">
                            No topic tags or categories match "{activeSearchQuery}".
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2.5">
                            {searchResults.topics.map((topic) => (
                              <button
                                key={`${topic.type}-${topic.slug}`}
                                onClick={() => handleTagClick(topic.name)}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-light-200/80 dark:bg-dark-200/80 text-dark-100 dark:text-light-100 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950/40 dark:hover:text-primary-300 border border-light-300 dark:border-dark-300 transition-all flex items-center gap-2 group"
                              >
                                {topic.type === 'category' ? (
                                  <Compass size={13} className="text-primary-500 group-hover:rotate-45 transition-transform" />
                                ) : (
                                  <Tag size={13} className="text-primary-500" />
                                )}
                                <span className="font-bold">
                                  {topic.type === 'category' ? topic.name : `#${topic.name}`}
                                </span>
                                {typeof topic.count === 'number' && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-light-300 dark:bg-dark-300 font-mono text-dark-400 dark:text-light-400">
                                    {topic.count} {topic.count === 1 ? 'story' : 'stories'}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Related Stories in Topics */}
                      {searchResults.stories.length > 0 && (
                        <div>
                          <div className="px-4 py-2.5 bg-light-150/30 dark:bg-dark-200/20 text-xs font-bold uppercase tracking-wider text-dark-400 dark:text-light-400 border-b border-light-300 dark:border-dark-300">
                            Related Articles
                          </div>
                          {searchResults.stories.map((sub) => (
                            <StoryCard
                              key={sub._id}
                              sub={sub}
                              isReposted={Boolean(repostedMap[sub._id] !== undefined ? repostedMap[sub._id] : sub.isReposted)}
                              isLiked={Boolean(likedMap[sub._id] !== undefined ? likedMap[sub._id] : sub.isLiked)}
                              likesCount={likesCountMap[sub._id] !== undefined ? likesCountMap[sub._id] : (sub.likesCount ?? (Array.isArray(sub.likes) ? sub.likes.length : 0))}
                              repostsCount={repostsCountMap[sub._id] !== undefined ? repostsCountMap[sub._id] : (sub.repostsCount ?? (Array.isArray(sub.reposts) ? sub.reposts.length : 0))}
                              onRepost={() => handleRepostToggle(sub._id, sub.repostsCount ?? (Array.isArray(sub.reposts) ? sub.reposts.length : 0))}
                              onLike={() => handleLikeToggle(sub._id, sub.likesCount ?? (Array.isArray(sub.likes) ? sub.likes.length : 0))}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* DEFAULT EXPLORE VIEW (Matches Image 2 Layout) */
            <div className="divide-y divide-light-300 dark:divide-dark-300">
              {/* SECTION 1: TOP HIGHLIGHTS (Clean Grid - No swipe, No horizontal scroll) */}
              {activeCategoryTab === 'For you' && featuredHighlights.length > 0 && (
                <section className="p-4 border-b border-light-300 dark:border-dark-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-dark-400 dark:text-light-400 flex items-center gap-1.5">
                      <Flame size={14} className="text-amber-500" />
                      Featured Highlights
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {featuredHighlights.slice(0, 2).map((story) => (
                      <Link
                        key={story._id}
                        to={`/blog/${story.slug}`}
                        className="p-4 rounded-2xl bg-light-200/70 dark:bg-dark-200/70 border border-light-300 dark:border-dark-300 hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-all flex flex-col justify-between group hover:shadow-sm"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-dark-400 dark:text-light-400 mb-2 font-mono">
                            <span className="font-semibold text-primary-600 dark:text-primary-400">
                              {story.category?.name || 'General'}
                            </span>
                            <span>{story.readTime || '3 min'}</span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold font-heading text-dark-100 dark:text-light-100 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {story.title}
                          </h4>
                          {story.abstract && (
                            <p className="text-xs text-dark-400 dark:text-light-400 line-clamp-2 mt-1.5 font-serif">
                              {story.abstract}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-light-300 dark:border-dark-300/50 text-xs">
                          <img
                            src={
                              story.author?.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(story.author?.name || 'Author')}`
                            }
                            alt={story.author?.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="text-dark-400 dark:text-light-400 truncate text-[11px] font-medium">
                            {story.author?.name}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* SECTION 2: TODAY'S NEWS (Exact match to user Image 2 'Today's News') */}
              {activeCategoryTab === 'For you' && submissions.length > 0 && (
                <section className="p-4 border-b border-light-300 dark:border-dark-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold font-heading text-dark-100 dark:text-light-100">
                      Today's Stories
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {submissions.slice(0, 3).map((item) => (
                      <Link
                        key={item._id}
                        to={`/blog/${item.slug}`}
                        className="block group hover:bg-light-200/40 dark:hover:bg-dark-200/30 p-2.5 rounded-xl transition-colors"
                      >
                        <h4 className="text-base font-bold font-heading text-dark-100 dark:text-light-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2 text-xs text-dark-400 dark:text-light-400">
                          <img
                            src={
                              item.author?.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(item.author?.name || 'Author')}`
                            }
                            alt={item.author?.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span>{item.author?.name}</span>
                          <span>&bull;</span>
                          <span>{item.category?.name || 'Story'}</span>
                          <span>&bull;</span>
                          <span className="font-mono">
                            {likesCountMap[item._id] !== undefined ? likesCountMap[item._id] : (item.likesCount || 0)} Appreciations
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* SECTION 3: TRENDING LIST (Exact match to user Image 2 'Trending in Ghana / Technology · Trending') */}
              {popularTags.length > 0 && (
                <section className="p-4 border-b border-light-300 dark:border-dark-300">
                  <h3 className="text-base font-bold font-heading text-dark-100 dark:text-light-100 mb-3 flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary-500" />
                    Trending Topics
                  </h3>

                  <div className="space-y-3">
                    {popularTags.slice(0, 5).map((trend, idx) => (
                      <div
                        key={trend.name}
                        onClick={() => handleTagClick(trend.name)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-light-200/50 dark:hover:bg-dark-200/40 cursor-pointer transition-colors group"
                      >
                        <div>
                          <p className="text-[11px] text-dark-400 dark:text-light-400 font-mono">
                            {idx === 0
                              ? 'Trending in Technology'
                              : idx === 1
                              ? 'Trending Worldwide'
                              : 'Topics &bull; Trending'}
                          </p>
                          <p className="text-sm font-bold text-dark-100 dark:text-light-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mt-0.5">
                            #{trend.name}
                          </p>
                          <p className="text-[11px] text-dark-400 dark:text-light-400 font-mono mt-0.5">
                            {trend.count} {trend.count === 1 ? 'story' : 'stories'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagClick(trend.name);
                          }}
                          className="p-2 rounded-full text-dark-400 hover:text-dark-100 dark:text-light-400 dark:hover:text-light-100"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* SECTION 4: FULL STREAM FEED */}
              <section>
                <div className="px-4 py-3 bg-light-200/50 dark:bg-dark-200/40 border-y border-light-300 dark:border-dark-300 text-xs font-mono uppercase tracking-wider text-dark-400 dark:text-light-400">
                  {activeCategoryTab === 'For you'
                    ? 'Latest Feed Articles'
                    : `Articles in ${activeCategoryTab}`}
                </div>

                {loading ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-500 border-t-transparent mx-auto"></div>
                    <p className="text-xs text-dark-400 dark:text-light-400 font-mono">Loading articles...</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <Compass className="w-12 h-12 text-dark-300 dark:text-light-400 mx-auto stroke-[1.5]" />
                    <h3 className="text-base font-bold font-heading">No articles found</h3>
                    <p className="text-xs text-dark-400 dark:text-light-400">
                      Be the first to publish an article in this category!
                    </p>
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <StoryCard
                      key={sub._id}
                      sub={sub}
                      isReposted={Boolean(repostedMap[sub._id] !== undefined ? repostedMap[sub._id] : sub.isReposted)}
                      isLiked={Boolean(likedMap[sub._id] !== undefined ? likedMap[sub._id] : sub.isLiked)}
                      likesCount={likesCountMap[sub._id] !== undefined ? likesCountMap[sub._id] : (sub.likesCount ?? (Array.isArray(sub.likes) ? sub.likes.length : 0))}
                      repostsCount={repostsCountMap[sub._id] !== undefined ? repostsCountMap[sub._id] : (sub.repostsCount ?? (Array.isArray(sub.reposts) ? sub.reposts.length : 0))}
                      onRepost={() => handleRepostToggle(sub._id, sub.repostsCount ?? (Array.isArray(sub.reposts) ? sub.reposts.length : 0))}
                      onLike={() => handleLikeToggle(sub._id, sub.likesCount ?? (Array.isArray(sub.likes) ? sub.likes.length : 0))}
                    />
                  ))
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// =========================================================================
// STORY CARD COMPONENT (X-Style Post Layout)
// =========================================================================
interface StoryCardProps {
  sub: any;
  isReposted: boolean;
  isLiked: boolean;
  likesCount?: number;
  repostsCount?: number;
  onRepost: () => void;
  onLike: () => void;
}

const StoryCard: React.FC<StoryCardProps> = ({
  sub,
  isReposted,
  isLiked,
  likesCount,
  repostsCount,
  onRepost,
  onLike,
}) => {
  const authorName = sub.author?.name || 'Author';
  const authorHandle = sub.author?.username || 'writer';
  const authorAvatar =
    sub.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}`;

  const currentLikes = likesCount !== undefined ? likesCount : (sub.likesCount ?? (Array.isArray(sub.likes) ? sub.likes.length : 0));
  const currentReposts = repostsCount !== undefined ? repostsCount : (sub.repostsCount ?? (Array.isArray(sub.reposts) ? sub.reposts.length : 0));
  const currentComments = sub.commentsCount ?? (Array.isArray(sub.comments) ? sub.comments.length : 0);

  return (
    <article className="p-4 sm:p-5 hover:bg-light-200/30 dark:hover:bg-dark-200/20 transition-colors border-b border-light-300 dark:border-dark-300">
      <div className="flex items-start gap-3.5">
        {/* Author Avatar */}
        <Link to={`/@${authorHandle}`} className="shrink-0 group">
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-light-300 dark:border-dark-300 group-hover:ring-2 ring-primary-500 transition-all"
          />
        </Link>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2 truncate">
              <Link
                to={`/@${authorHandle}`}
                className="font-bold text-sm text-dark-100 dark:text-light-100 hover:underline truncate"
              >
                {authorName}
              </Link>
              <Link
                to={`/@${authorHandle}`}
                className="text-xs text-dark-400 dark:text-light-400 truncate"
              >
                @{authorHandle}
              </Link>
              <span className="text-dark-400 dark:text-light-400 text-xs">&bull;</span>
              <span className="text-xs text-dark-400 dark:text-light-400 shrink-0 font-mono">
                {new Date(sub.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            {sub.category?.name && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-light-200 dark:bg-dark-300 text-primary-600 dark:text-primary-400 shrink-0">
                {sub.category.name}
              </span>
            )}
          </div>

          {/* Title & Abstract */}
          <Link to={`/blog/${sub.slug}`} className="block mt-1.5 group">
            <h3 className="text-base sm:text-lg font-bold font-heading text-dark-100 dark:text-light-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
              {sub.title}
            </h3>
            {sub.abstract && (
              <p className="mt-1 text-xs sm:text-sm text-dark-400 dark:text-light-400 line-clamp-2 leading-relaxed font-serif">
                {sub.abstract}
              </p>
            )}
          </Link>

          {/* Media Image if available */}
          {sub.image && (
            <Link to={`/blog/${sub.slug}`} className="block mt-3 rounded-2xl overflow-hidden border border-light-300 dark:border-dark-300">
              <img
                src={sub.image}
                alt={sub.title}
                className="w-full max-h-72 object-cover hover:scale-102 transition-transform duration-300"
              />
            </Link>
          )}

          {/* Interaction Bar (X-Style: Comment, Repost, Like, Bookmark, Share) */}
          <div className="flex items-center justify-between mt-3 pt-2 text-dark-400 dark:text-light-400 text-xs max-w-md">
            {/* Comments */}
            <Link
              to={`/blog/${sub.slug}#comments`}
              className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group p-1.5 rounded-full hover:bg-primary-50 dark:hover:bg-primary-950/30"
              title="Comments"
            >
              <MessageCircle size={16} />
              <span className="font-mono text-[11px]">{currentComments}</span>
            </Link>

            {/* Repost */}
            <button
              onClick={onRepost}
              className={`flex items-center gap-1.5 transition-colors p-1.5 rounded-full ${
                isReposted
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 font-semibold'
                  : 'hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
              title="Repost to timeline"
            >
              <Repeat size={16} />
              <span className="font-mono text-[11px]">{currentReposts}</span>
            </button>

            {/* Like */}
            <button
              onClick={onLike}
              className={`flex items-center gap-1.5 transition-colors p-1.5 rounded-full ${
                isLiked
                  ? 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/30 font-semibold'
                  : 'hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30'
              }`}
              title="Like"
            >
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              <span className="font-mono text-[11px]">{currentLikes}</span>
            </button>

            {/* Bookmark with Dropdown */}
            <BookmarkDropdown
              submissionId={sub._id}
              isBookmarked={false}
              size={16}
              showLabel={false}
            />
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogListPage;