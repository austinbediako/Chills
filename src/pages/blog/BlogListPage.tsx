import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Clock, User, Heart, Bookmark, ChevronRight, ChevronDown, Plus, Tag, X, Sparkles 
} from 'lucide-react';
import axios from 'axios';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useAuth } from '../../hooks/useAuth';

const BlogListPage: React.FC = () => {
  const { submissions, totalPages, currentPage, totalSubmissions, loading, getSubmissions, interactSubmission } = useSubmissions();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization
  const initialTag = searchParams.get('tag') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Available categories & popular tags from database
  const [categories, setCategories] = useState<string[]>(['All']);
  const [categoryObjects, setCategoryObjects] = useState<Array<{ _id: string; name: string; slug: string; count?: number }>>([]);
  const [popularTags, setPopularTags] = useState<Array<{ name: string; count: number }>>([]);
  const [matchedAuthors, setMatchedAuthors] = useState<Array<{
    _id: string;
    name: string;
    username: string;
    avatar: string;
    bio?: string;
    followers?: string[];
  }>>([]);

  // Fetch categories and popular tags on mount
  useEffect(() => {
    axios.get('/api/categories')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCategoryObjects(res.data);
          setCategories(['All', ...res.data.map((c: any) => c.name)]);

          // Canonicalize initial category from URL if present
          const currentUrlCategory = searchParams.get('category');
          if (currentUrlCategory && currentUrlCategory !== 'All') {
            const matched = res.data.find((c: any) => 
              c.slug?.toLowerCase() === currentUrlCategory.toLowerCase() ||
              c.name?.toLowerCase() === currentUrlCategory.toLowerCase()
            );
            if (matched) {
              setSelectedCategory(matched.name);
            }
          }
        }
      })
      .catch(() => {});

    axios.get('/api/submissions/popular/tags')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setPopularTags(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Synchronize state when URL search params change (e.g., clicking tag link or browser navigation)
  useEffect(() => {
    const urlTag = searchParams.get('tag') || '';
    const urlSearch = searchParams.get('search') || '';
    const rawCategory = searchParams.get('category') || 'All';

    setSelectedTag(urlTag);
    setSearchQuery(urlSearch);

    if (rawCategory === 'All') {
      setSelectedCategory('All');
    } else if (categoryObjects.length > 0) {
      const matched = categoryObjects.find((c) => 
        c.slug?.toLowerCase() === rawCategory.toLowerCase() ||
        c.name?.toLowerCase() === rawCategory.toLowerCase()
      );
      setSelectedCategory(matched ? matched.name : rawCategory);
    } else {
      setSelectedCategory(rawCategory);
    }

    setPage(1);
  }, [searchParams, categoryObjects]);

  // Search authors when search query is typed
  useEffect(() => {
    const q = searchQuery.trim().replace(/^@/, '');
    if (q.length > 0) {
      axios.get(`/api/users/search?q=${encodeURIComponent(q)}`)
        .then((res) => {
          if (Array.isArray(res.data)) {
            setMatchedAuthors(res.data);
          }
        })
        .catch(() => setMatchedAuthors([]));
    } else {
      setMatchedAuthors([]);
    }
  }, [searchQuery]);

  // Fetch submissions from backend based on all filters
  useEffect(() => {
    const fetchSubs = async () => {
      const params: { page: number; category?: string; search?: string; sort?: string; tag?: string } = { page };

      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (selectedTag.trim()) {
        params.tag = selectedTag.trim();
      }

      switch (sortBy) {
        case 'latest':
          params.sort = '-createdAt';
          break;
        case 'oldest':
          params.sort = 'createdAt';
          break;
        default:
          params.sort = '-createdAt';
      }

      await getSubmissions(params);
    };

    fetchSubs();
  }, [page, selectedCategory, sortBy, searchQuery, selectedTag, getSubmissions]);

  // Filter actions that sync with URL
  const handleSelectTag = (tag: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (selectedTag.toLowerCase() === tag.toLowerCase()) {
      // Toggle off if already active
      nextParams.delete('tag');
    } else {
      nextParams.set('tag', tag);
    }
    setSearchParams(nextParams);
    setPage(1);
  };

  const handleClearTag = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('tag');
    setSearchParams(nextParams);
    setPage(1);
  };

  const handleCategoryChange = (categoryName: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (categoryName === 'All') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', categoryName);
    }
    setSearchParams(nextParams);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    const trimmed = searchQuery.trim();

    // If query starts with hashtag (#tag), filter by tag instead
    if (trimmed.startsWith('#')) {
      const tagQuery = trimmed.slice(1).trim();
      if (tagQuery) {
        nextParams.set('tag', tagQuery);
        nextParams.delete('search');
        setSearchQuery('');
      }
    } else if (trimmed) {
      nextParams.set('search', trimmed);
    } else {
      nextParams.delete('search');
    }
    
    setSearchParams(nextParams);
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setSearchParams({});
    setSearchQuery('');
    setSelectedTag('');
    setSelectedCategory('All');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sort options
  const sortOptions = [
    { label: 'Latest', value: 'latest' },
    { label: 'Oldest', value: 'oldest' },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const hasActiveFilters = Boolean(selectedTag || (selectedCategory && selectedCategory !== 'All') || searchQuery);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading sm:text-4xl text-dark-100 dark:text-light-100">
            Explore Repository
          </h1>
          <p className="mt-2 text-dark-300 dark:text-light-300">
            Discover articles, research publications, and engineering deep-dives across topics and tags.
          </p>
        </div>

        {isAuthenticated && (
          <Link
            to="/write"
            className="mt-4 md:mt-0 btn btn-primary flex items-center w-fit shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus size={18} className="mr-2" />
            Write Story
          </Link>
        )}
      </div>

      {/* ── Category Tabs Bar ── */}
      {categories.length > 1 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Filter size={16} className="text-primary-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-dark-400 dark:text-light-400">
              Browse Categories
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm ring-2 ring-primary-500/40'
                      : 'bg-light-200 text-dark-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Popular Tags Bar ── */}
      {popularTags.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles size={16} className="text-primary-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-dark-400 dark:text-light-400">
              Popular Tags
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularTags.slice(0, 15).map((pt) => {
              const isActive = selectedTag.toLowerCase() === pt.name.toLowerCase();
              return (
                <button
                  key={pt.name}
                  onClick={() => handleSelectTag(pt.name)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm ring-2 ring-primary-500/40'
                      : 'bg-light-200 text-dark-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400'
                  }`}
                >
                  #{pt.name}
                  {pt.count !== undefined && (
                    <span className="ml-1 text-[10px] opacity-70">({pt.count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Search and Filters Card ── */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Input */}
          <form onSubmit={handleSearch} className="relative flex-1">
            <input
              type="text"
              placeholder="Search by keywords or #tag..."
              className="input pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-light-400" size={18} />
            <button type="submit" className="sr-only">Search</button>
          </form>

          {/* Filters Toggle (Mobile) */}
          <button
            className="btn btn-outline md:hidden w-full flex items-center justify-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} className="mr-2" />
            Filters
            <ChevronDown size={18} className={`ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Desktop Filters */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-dark-400 dark:text-light-400">Category:</span>
              <select
                className="input py-1.5"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-dark-400 dark:text-light-400">Sort by:</span>
              <select
                className="input py-1.5"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Filters (Collapsible) */}
        {showFilters && (
          <div className="mt-4 space-y-4 md:hidden pt-4 border-t border-light-300 dark:border-dark-300">
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-400 dark:text-light-400">
                Category:
              </label>
              <select
                className="input w-full"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-400 dark:text-light-400">
                Sort by:
              </label>
              <select
                className="input w-full"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Active Filters Indicators ── */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-light-300/60 dark:border-dark-300/60 text-xs">
            <span className="font-semibold text-dark-400 dark:text-light-400 mr-1">Active Filters:</span>
            
            {/* Tag Filter Chip */}
            {selectedTag && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-semibold border border-primary-200 dark:border-primary-800">
                <Tag size={12} />
                #{selectedTag}
                <button
                  onClick={handleClearTag}
                  className="hover:text-red-500 ml-1 rounded-full p-0.5"
                  title="Remove tag filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {/* Category Filter Chip */}
            {selectedCategory && selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-light-300 dark:bg-dark-300 text-dark-200 dark:text-light-200 font-medium">
                Category: {selectedCategory}
                <button
                  onClick={() => handleCategoryChange('All')}
                  className="hover:text-red-500 ml-1 rounded-full p-0.5"
                  title="Remove category filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {/* Search Query Chip */}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-light-300 dark:bg-dark-300 text-dark-200 dark:text-light-200 font-medium">
                Keyword: "{searchQuery}"
                <button
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.delete('search');
                    setSearchParams(nextParams);
                    setSearchQuery('');
                  }}
                  className="hover:text-red-500 ml-1 rounded-full p-0.5"
                  title="Remove keyword filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            <button
              onClick={handleClearAllFilters}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Matching Authors Section when user searches an author */}
      {matchedAuthors.length > 0 && (
        <div className="card p-5 bg-gradient-to-r from-primary-500/5 via-primary-500/10 to-transparent border border-primary-500/20">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-primary-600 dark:text-primary-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-dark-100 dark:text-light-100">
              Matching Authors ({matchedAuthors.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {matchedAuthors.map((author) => (
              <div 
                key={author._id}
                className="flex items-center justify-between p-3 rounded-xl bg-light-100/90 dark:bg-dark-200/90 border border-light-300/60 dark:border-dark-300/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <Link to={`/authors/${author.username}`} className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                  <img
                    src={author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}`}
                    alt={author.name}
                    className="h-10 w-10 rounded-full object-cover shrink-0 ring-1 ring-primary-500/30"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-dark-100 dark:text-light-100 truncate hover:text-primary-600 transition-colors">
                      {author.name}
                    </p>
                    <p className="text-xs text-dark-400 dark:text-light-400 font-mono truncate">
                      @{author.username}
                    </p>
                  </div>
                </Link>
                <Link
                  to={`/authors/${author.username}`}
                  className="btn btn-primary text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
                >
                  View & Follow
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-dark-400 dark:text-light-400">
        {loading ? (
          <p>Loading publications...</p>
        ) : (
          <p>
            Showing {submissions.length} of {totalSubmissions} publications
            {selectedTag ? ` tagged with #${selectedTag}` : ''}
          </p>
        )}
      </div>

      {/* Submissions Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
        </div>
      ) : submissions.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {submissions.map((sub) => (
            <motion.div
              key={sub._id}
              variants={itemVariants}
              className="card group flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={sub.image || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'}
                  alt={sub.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-100/80 to-transparent"></div>
                {sub.category && (
                  <button
                    onClick={() => handleCategoryChange(sub.category?.name || 'All')}
                    className="absolute left-4 top-4 rounded-full bg-primary-600/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-primary-700 transition-colors"
                  >
                    {sub.category.name}
                  </button>
                )}
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <Link to={`/blog/${sub.slug}`}>
                  <h3 className="mb-3 text-xl font-bold font-heading text-dark-100 dark:text-light-100 transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2">
                    {sub.title}
                  </h3>
                </Link>
                <p className="mb-4 text-dark-300 dark:text-light-300 flex-grow line-clamp-3 text-sm font-serif">
                  {sub.abstract}
                </p>
                
                <div className="mb-4 flex items-center text-xs text-dark-400 dark:text-light-400">
                  <User size={13} className="mr-1" />
                  <Link
                    to={`/authors/${sub.author?.username || sub.author?._id || 'anonymous'}`}
                    className="mr-4 font-medium text-dark-200 dark:text-light-200 hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors"
                  >
                    {sub.author?.name || 'Anonymous'}
                  </Link>
                  <Clock size={13} className="mr-1" />
                  <span>{sub.readTime || '5 min read'}</span>
                </div>

                {/* Tags on card */}
                {sub.tags && sub.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {sub.tags.slice(0, 4).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleSelectTag(tag)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          selectedTag.toLowerCase() === tag.toLowerCase()
                            ? 'bg-primary-600 text-white'
                            : 'bg-light-200 text-dark-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                    {sub.tags.length > 4 && (
                      <span className="text-[11px] text-dark-400 dark:text-light-400 self-center">
                        +{sub.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-light-200 dark:border-dark-300">
                  <Link
                    to={`/blog/${sub.slug}`}
                    className="flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Read Story <ChevronRight size={16} className="ml-1" />
                  </Link>
                  <div className="flex items-center space-x-3 text-dark-400 dark:text-light-400 text-xs">
                    <span className="flex items-center" title="Likes">
                      <Heart size={14} className="mr-1 text-red-500/80" />
                      {sub.likes || 0}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16 card">
          <div className="mx-auto w-20 h-20 rounded-full bg-light-200 dark:bg-dark-200 flex items-center justify-center mb-4">
            <Search size={28} className="text-dark-300 dark:text-light-300" />
          </div>
          <h3 className="text-xl font-bold font-heading text-dark-100 dark:text-light-100 mb-2">
            No publications found
          </h3>
          <p className="text-dark-300 dark:text-light-300 max-w-md mx-auto text-sm mb-6">
            {selectedTag
              ? `No articles found tagged with "#${selectedTag}". Try selecting another tag or clearing your filters.`
              : 'Try adjusting your search terms or filters to find what you are looking for.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className="btn btn-outline rounded-full px-5 py-2 text-sm"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-outline px-3 py-2 disabled:opacity-50 text-sm"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`btn ${
                  pageNum === currentPage ? 'btn-primary' : 'btn-outline'
                } px-4 py-2 text-sm`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-outline px-3 py-2 disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogListPage;