import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, User as UserIcon, MessageSquare, Heart, Bookmark, ChevronRight, TrendingUp, Zap, Star, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Author {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  storiesCount?: number;
  totalLikes?: number;
  followersCount?: number;
  featuredScore?: number;
}

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  count?: number;
}

interface Article {
  _id: string;
  title: string;
  slug: string;
  abstract: string;
  readTime: string;
  image: string;
  createdAt: string;
  author: Author;
  category?: CategoryItem;
  tags?: string[];
  likes?: number;
  comments?: number;
}

interface TagItem {
  name: string;
  count: number;
}

const AuthenticatedHomePage: React.FC = () => {
  const [featuredPosts, setFeaturedPosts] = useState<Article[]>([]);
  const [recentPosts, setRecentPosts] = useState<Article[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [featuredRes, recentRes, catRes, authorRes, tagRes] = await Promise.all([
          axios.get('/api/submissions?limit=3&sort=-likes'),
          axios.get('/api/submissions?limit=6&page=1&sort=-createdAt'),
          axios.get('/api/categories'),
          axios.get('/api/users/featured-authors'),
          axios.get('/api/submissions/popular/tags'),
        ]);

        setFeaturedPosts(featuredRes.data.submissions || []);
        setRecentPosts(recentRes.data.submissions || []);
        setCategories(catRes.data || []);
        setAuthors(authorRes.data || []);
        setTags(tagRes.data || []);
        if (recentRes.data.totalPages <= 1) {
          setHasMore(false);
        }
      } catch (err) {
        console.error('Failed to load authenticated homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await axios.get(`/api/submissions?limit=6&page=${nextPage}&sort=-createdAt`);
      const newArticles: Article[] = res.data.submissions || [];
      
      if (newArticles.length === 0) {
        setHasMore(false);
        return;
      }

      setRecentPosts((prev) => {
        const existingIds = new Set(prev.map(p => p._id));
        const filteredNew = newArticles.filter(p => !existingIds.has(p._id));
        return [...prev, ...filteredNew];
      });
      setPage(nextPage);

      const totalPages = res.data.totalPages || 1;
      if (nextPage >= totalPages) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more articles:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
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

  const getCategoryIcon = (index: number) => {
    const icons = [<Zap size={18} />, <TrendingUp size={18} />, <Star size={18} />];
    return icons[index % icons.length];
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="relative z-10 px-6 py-16 sm:px-12 md:py-24 lg:flex lg:items-center lg:gap-x-10">
          <div className="lg:w-1/2">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold font-heading sm:text-5xl md:text-6xl text-white tracking-tight"
            >
              Discover Insights for the Digital Age
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg text-white/90 font-normal leading-relaxed"
            >
              Explore over 100+ essays and tutorials in engineering, design, and architecture. Written by leading thinkers and practitioners.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link to="/explore" className="btn bg-white text-primary-600 hover:bg-white/90 shadow-md font-semibold rounded-lg px-6 py-3 transition-all hover:scale-105">
                Explore Articles
              </Link>
              <Link to="/write" className="btn bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm font-semibold rounded-lg px-6 py-3 transition-all hover:scale-105">
                Write a Story
              </Link>
            </motion.div>
          </div>
          <div className="hidden lg:block lg:w-1/2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative mt-12 lg:mt-0"
            >
              {/* Magic Code Window Card */}
              <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 text-white font-mono text-xs sm:text-sm">
                {/* Window header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400/90 shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400/90 shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400/90 shadow-sm"></div>
                  </div>
                  <span className="text-white/70 font-sans text-xs font-medium tracking-wide">
                    story.config.ts
                  </span>
                  <div className="w-12"></div>
                </div>

                {/* Magic Code Content */}
                <div className="space-y-2 leading-relaxed">
                  <p>
                    <span className="text-pink-300 font-semibold">import</span>{' '}
                    <span className="text-cyan-200">&#123; createStory, publish &#125;</span>{' '}
                    <span className="text-pink-300 font-semibold">from</span>{' '}
                    <span className="text-amber-200">&apos;@kblog/editorial&apos;</span>;
                  </p>
                  <p className="text-white/40 italic pt-1">
                    &#47;&#47; ✨ Craft ideas with clarity and beautiful styling
                  </p>
                  <p>
                    <span className="text-pink-300 font-semibold">const</span>{' '}
                    <span className="text-yellow-200">story</span> ={' '}
                    <span className="text-pink-300">await</span>{' '}
                    <span className="text-cyan-300 font-semibold">createStory</span>(&#123;
                  </p>
                  <p className="pl-4">
                    <span className="text-indigo-200">title</span>:{' '}
                    <span className="text-emerald-300">&quot;The Future of Web Development&quot;</span>,
                  </p>
                  <p className="pl-4">
                    <span className="text-indigo-200">theme</span>:{' '}
                    <span className="text-emerald-300">&quot;Clarity &amp; Purpose&quot;</span>,
                  </p>
                  <p className="pl-4">
                    <span className="text-indigo-200">status</span>:{' '}
                    <span className="text-violet-300 font-semibold">&quot;PUBLISHED&quot;</span>,
                  </p>
                  <p className="pl-4">
                    <span className="text-indigo-200">tags</span>:{' '}
                    <span className="text-white/90">[</span>
                    <span className="text-amber-200">&apos;Tech&apos;</span>,{' '}
                    <span className="text-amber-200">&apos;Design&apos;</span>,{' '}
                    <span className="text-amber-200">&apos;Insights&apos;</span>
                    <span className="text-white/90">]</span>
                  </p>
                  <p>&#125;);</p>
                  <p className="pt-1">
                    <span className="text-pink-300">await</span>{' '}
                    <span className="text-cyan-300 font-semibold">publish</span>(
                    <span className="text-yellow-200">story</span>
                    );
                  </p>
                </div>

                {/* Footer stats */}
                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/70 font-sans">
                  <div className="flex items-center space-x-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-medium text-white/90">Live on KBlog</span>
                  </div>
                  <span className="text-white/60">5 min read · Featured</span>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-secondary-400/40 blur-xl pointer-events-none"></div>
              <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-primary-400/40 blur-xl pointer-events-none"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Posts Section */}
      <section>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold font-heading sm:text-3xl text-dark-100 dark:text-light-100">
            Featured Posts
          </h2>
          <Link
            to="/explore"
            className="flex items-center text-primary-600 dark:text-primary-400 hover:underline"
          >
            View All <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="card animate-pulse h-96 bg-light-200 dark:bg-dark-200 rounded-xl"></div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {featuredPosts.map((post) => (
              <motion.div
                key={post._id}
                variants={itemVariants}
                className="card group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2072&q=80'}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-100/80 to-transparent"></div>
                    {post.category && (
                      <Link
                        to={`/explore?category=${encodeURIComponent(post.category.name)}`}
                        className="absolute left-4 top-4 rounded-full bg-primary-600/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-primary-500"
                      >
                        {post.category.name}
                      </Link>
                    )}
                  </div>
                  <div className="p-6">
                    <Link to={`/blog/${post.slug}`}>
                      <h3 className="mb-3 text-xl font-bold font-heading text-dark-100 dark:text-light-100 transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="mb-4 text-dark-300 dark:text-light-300 line-clamp-3 text-sm font-serif">
                      {post.abstract}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-0">
                  <div className="mb-4 flex items-center text-sm text-dark-400 dark:text-light-400">
                    <Link
                      to={`/authors/${post.author?.username || post.author?._id}`}
                      className="flex items-center group/author hover:underline mr-4 truncate"
                    >
                      <img
                        src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'Author')}`}
                        alt={post.author?.name || 'Author'}
                        className="w-5 h-5 rounded-full mr-2 object-cover"
                      />
                      <span className="truncate font-medium text-dark-200 dark:text-light-200 group-hover/author:text-primary-600 dark:group-hover/author:text-primary-400">
                        {post.author?.name || 'Author'}
                      </span>
                    </Link>
                    <Clock size={14} className="mr-1 flex-shrink-0" />
                    <span className="whitespace-nowrap">{post.readTime || '5 min read'}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-light-300/60 dark:border-dark-300/60 pt-4">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Read More <ChevronRight size={16} className="ml-1" />
                    </Link>
                    <div className="flex items-center space-x-3 text-dark-400 dark:text-light-400">
                      <Link
                        to={`/blog/${post.slug}#comments`}
                        className="flex items-center text-xs hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title="Go to comments"
                      >
                        <MessageSquare size={13} className="mr-1" />
                        {post.comments || 0}
                      </Link>
                      <span className="flex items-center text-xs">
                        <Heart size={13} className="mr-1" />
                        {post.likes || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Newsletter Section */}
      <section className="rounded-2xl bg-gradient-to-r from-primary-600/10 to-secondary-600/10 p-8 dark:from-primary-600/20 dark:to-secondary-600/20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold font-heading sm:text-3xl text-dark-100 dark:text-light-100">
            Join 10,000+ readers getting weekly insights
          </h2>
          <p className="mt-4 text-dark-300 dark:text-light-300">
            Stay up-to-date with curated technology essays, design architectures, and systems thinking.
          </p>
          <form 
            onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }}
            className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-center sm:space-x-4"
          >
            <input
              type="email"
              placeholder="Your email address"
              className="input mb-4 sm:mb-0 sm:w-72"
              required
            />
            <button type="submit" className="btn btn-primary">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Recent Posts & Sidebar */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Recent Posts */}
        <div className="lg:col-span-2">
          {/* Category Tabs Bar */}
          {categories.length > 0 && (
            <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs font-bold uppercase tracking-wider text-dark-400 dark:text-light-400 mr-1 shrink-0">
                Topics:
              </span>
              <Link
                to="/explore"
                className="rounded-full px-4 py-1.5 text-xs font-semibold bg-dark-100 text-light-100 dark:bg-light-100 dark:text-dark-100 shrink-0 hover:opacity-90 transition-opacity"
              >
                All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/explore?category=${encodeURIComponent(cat.name)}`}
                  className="rounded-full px-4 py-1.5 text-xs font-medium bg-light-200 text-dark-400 hover:bg-primary-100 hover:text-primary-700 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 shrink-0 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold font-heading sm:text-3xl text-dark-100 dark:text-light-100">
              Recent Articles
            </h2>
            <Link
              to="/explore"
              className="flex items-center text-primary-600 dark:text-primary-400 hover:underline"
            >
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="card animate-pulse h-48 bg-light-200 dark:bg-dark-200 rounded-xl"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {recentPosts.map((post) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="card group flex flex-col md:flex-row overflow-hidden"
                >
                  <div className="relative h-48 w-full md:h-auto md:w-1/3 flex-shrink-0">
                    <img
                      src={post.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=2070&q=80'}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-100/60 to-transparent md:bg-gradient-to-l"></div>
                    {post.category && (
                      <Link
                        to={`/explore?category=${encodeURIComponent(post.category.name)}`}
                        className="absolute left-4 top-4 rounded-full bg-primary-600/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-primary-500"
                      >
                        {post.category.name}
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <Link to={`/blog/${post.slug}`}>
                        <h3 className="mb-2 text-xl font-bold font-heading text-dark-100 dark:text-light-100 transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="mb-4 text-dark-300 dark:text-light-300 line-clamp-2 font-serif text-sm">
                        {post.abstract}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-light-300/60 dark:border-dark-300/60">
                      <div className="mb-2 flex items-center text-xs text-dark-400 dark:text-light-400 md:mb-0">
                        <Link
                          to={`/authors/${post.author?.username || post.author?._id}`}
                          className="flex items-center group/author hover:underline mr-3"
                        >
                          <img
                            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'Author')}`}
                            alt={post.author?.name || 'Author'}
                            className="w-4 h-4 rounded-full mr-2 object-cover"
                          />
                          <span className="font-medium text-dark-200 dark:text-light-200 group-hover/author:text-primary-600 dark:group-hover/author:text-primary-400">
                            {post.author?.name || 'Author'}
                          </span>
                        </Link>
                        <Clock size={12} className="mr-1" />
                        <span>{post.readTime || '5 min read'}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-dark-400 dark:text-light-400">
                        <Link
                          to={`/blog/${post.slug}#comments`}
                          className="flex items-center hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Go to comments"
                        >
                          <MessageSquare size={12} className="mr-1" />
                          {post.comments || 0}
                        </Link>
                        <span className="flex items-center">
                          <Heart size={12} className="mr-1" />
                          {post.likes || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {hasMore ? (
            <div className="mt-10 text-center">
              <button 
                type="button"
                onClick={handleLoadMore} 
                disabled={loadingMore}
                className="btn btn-outline px-8 py-3 rounded-full hover:scale-105 transition-all inline-flex items-center gap-2 text-sm font-semibold shadow-sm hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-primary-500" />
                    <span>Loading Articles...</span>
                  </>
                ) : (
                  <span>Load More Articles</span>
                )}
              </button>
            </div>
          ) : (
            recentPosts.length > 0 && (
              <p className="mt-10 text-center text-xs text-dark-400 dark:text-light-400 font-serif">
                You've reached the end of recent articles.
              </p>
            )
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Trending Categories */}
          <div className="card p-6">
            <h3 className="mb-4 text-xl font-bold font-heading text-dark-100 dark:text-light-100">
              Trending Categories
            </h3>
            <ul className="space-y-2.5">
              {categories.slice(0, 6).map((category, idx) => (
                <li key={category._id}>
                  <Link
                    to={`/explore?category=${encodeURIComponent(category.name)}`}
                    className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-light-200 dark:hover:bg-dark-300 group"
                  >
                    <div className="flex items-center">
                      <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 group-hover:scale-105 transition-transform">
                        {getCategoryIcon(idx)}
                      </span>
                      <span className="font-medium text-dark-100 dark:text-light-100 text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {category.name}
                      </span>
                    </div>
                    <span className="rounded-full bg-light-300 px-2 py-0.5 text-xs font-medium text-dark-500 dark:bg-dark-300 dark:text-light-400">
                      {category.count || 0}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-center">
              <Link
                to="/explore"
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                View All Categories
              </Link>
            </div>
          </div>

          {/* Featured Authors (Algorithmically Ranked Creators) */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold font-heading text-dark-100 dark:text-light-100 flex items-center gap-2">
                <Star size={18} className="text-amber-500 fill-amber-500" /> Featured Authors
              </h3>
            </div>
            <div className="space-y-3.5">
              {authors.slice(0, 5).map((author, idx) => (
                <div
                  key={author._id}
                  className="flex items-center justify-between group p-2 rounded-xl hover:bg-light-200 dark:hover:bg-dark-300 transition-colors"
                >
                  <Link
                    to={`/authors/${author.username || author._id}`}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}`}
                        alt={author.name}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-primary-500/30 group-hover:ring-primary-500 transition-all"
                      />
                      <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-primary-600 text-[10px] font-bold text-white flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-dark-100 dark:text-light-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {author.name}
                      </p>
                      <p className="text-xs text-dark-400 dark:text-light-400 truncate">
                        @{author.username} {author.storiesCount !== undefined ? `· ${author.storiesCount} stories` : ''}
                      </p>
                    </div>
                  </Link>

                  <Link
                    to={`/authors/${author.username || author._id}`}
                    className="btn btn-outline py-1 px-3 text-xs rounded-full shrink-0 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all font-semibold"
                  >
                    Profile
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Tags */}
          <div className="card p-6">
            <h3 className="mb-4 text-xl font-bold font-heading text-dark-100 dark:text-light-100">
              Popular Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.name}
                  to={`/explore?tag=${encodeURIComponent(tag.name)}`}
                  className="rounded-full bg-light-200 px-3 py-1.5 text-xs font-medium text-dark-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors"
                >
                  #{tag.name}
                  {tag.count !== undefined && (
                    <span className="ml-1 text-[10px] opacity-70">({tag.count})</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="rounded-2xl bg-gradient-to-r from-primary-600 to-secondary-600 p-8 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold font-heading sm:text-3xl text-white">
            Ready to share your own ideas?
          </h2>
          <p className="mt-4 text-white/90">
            Publish essays, case studies, and engineering breakdowns to thousands of curious minds.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-center sm:space-x-4">
            <Link to="/write" className="btn bg-white text-primary-600 hover:bg-white/90 mb-4 sm:mb-0 shadow-md font-semibold rounded-lg px-6 py-2.5">
              Start Writing
            </Link>
            <Link to="/explore" className="btn bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm font-semibold rounded-lg px-6 py-2.5">
              Explore Articles
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthenticatedHomePage;
