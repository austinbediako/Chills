import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw, Search, 
  Trash2, Cpu, CheckCircle2, XCircle, Filter, 
  ChevronLeft, ChevronRight, User, Clock, Eye, X, Check
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useEscapeKey } from '../hooks/useKeyboardShortcuts';

interface ModerationCategory {
  score: number;
  flagged: boolean;
  matches: string[];
}

interface ModerationData {
  overallScore: number;
  grade: 'CLEAN' | 'MILD' | 'FLAGGED' | 'CRITICAL';
  flagged: boolean;
  labels: string[];
  summary: string;
  categories: {
    sexist: ModerationCategory;
    sexual: ModerationCategory;
    explicit: ModerationCategory;
    eighteenPlus: ModerationCategory;
    racist: ModerationCategory;
  };
  callbackTriggeredAt: string | null;
}

interface AuditedStory {
  _id: string;
  title: string;
  slug: string;
  abstract: string;
  status: string;
  createdAt: string;
  author: {
    _id: string;
    name: string;
    username: string;
    email?: string;
    avatar?: string;
  };
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
  tags?: string[];
  moderation?: ModerationData;
}

interface AuditStats {
  totalCount: number;
  flaggedCount: number;
  cleanCount: number;
  criticalCount: number;
  sexistCount: number;
  sexualCount: number;
  explicitCount: number;
  eighteenPlusCount: number;
  racistCount: number;
}

interface ScanAlertModalData {
  title: string;
  author: string;
  grade: string;
  score: number;
  flagged: boolean;
  summary: string;
  categories: Record<string, ModerationCategory>;
}

const ReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<AuditedStory[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalCount: 0,
    flaggedCount: 0,
    cleanCount: 0,
    criticalCount: 0,
    sexistCount: 0,
    sexualCount: 0,
    explicitCount: 0,
    eighteenPlusCount: 0,
    racistCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRescanningAll, setIsRescanningAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FLAGGED' | 'CLEAN' | 'CRITICAL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'sexist' | 'sexual' | 'explicit' | '18+' | 'racist'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [scanAlertModal, setScanAlertModal] = useState<ScanAlertModalData | null>(null);

  // Global ESC key dismisses scan result alert modal
  useEscapeKey(() => setScanAlertModal(null), !!scanAlertModal);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchAuditData = useCallback(async () => {
    try {
      setLoading(true);
      const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '12');

      if (activeTab === 'FLAGGED') params.set('flagged', 'true');
      if (activeTab === 'CLEAN') params.set('flagged', 'false');
      if (activeTab === 'CRITICAL') params.set('grade', 'CRITICAL');

      if (selectedCategory !== 'ALL') {
        params.set('category', selectedCategory);
      }

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await axios.get(`/api/submissions/moderation/audit?${params.toString()}`, config);
      setSubmissions(res.data.submissions || []);
      setTotalPages(res.data.totalPages || 1);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err: any) {
      console.error('Failed to fetch machine audit data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, page, activeTab, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  // Batch rescan across all published stories
  const handleRescanAll = async () => {
    if (!window.confirm('Run machine safety algorithm across all published stories? Diagnostic output will register in the server console.')) {
      return;
    }
    try {
      setIsRescanningAll(true);
      const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.post('/api/submissions/moderation/rescan-all', {}, config);
      
      const alertMsg = `Machine Batch Audit Finished!\n\n${res.data.message}\nTotal Stories Scanned: ${res.data.scannedCount}\nTotal Flagged: ${res.data.flaggedCount}`;
      alert(alertMsg);
      showToast(res.data.message || 'Batch scan finished!');
      await fetchAuditData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Batch scan failed.');
    } finally {
      setIsRescanningAll(false);
    }
  };

  // Re-evaluate a single story and return result as alert
  const handleReEvaluateSingle = async (storyId: string) => {
    try {
      setEvaluatingId(storyId);
      const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.post(`/api/submissions/${storyId}/moderate`, {}, config);
      
      const updatedStory = res.data;
      const mod = updatedStory.moderation || {};

      setSubmissions((prev) => 
        prev.map((s) => (s._id === storyId ? updatedStory : s))
      );

      const alertText = `Machine Moderation Scan Complete!

Story: "${updatedStory.title}"
Author: @${updatedStory.author?.username || 'author'}
Grade: ${mod.grade || 'CLEAN'}
Overall Score: ${mod.overallScore || 0}/100
Status: ${mod.flagged ? 'FLAGGED FOR REVIEW' : 'CLEAN & SAFE'}

Category Breakdown:
• Sexist: ${mod.categories?.sexist?.score || 0}%
• Sexual: ${mod.categories?.sexual?.score || 0}%
• Explicit: ${mod.categories?.explicit?.score || 0}%
• 18+ (Adult): ${mod.categories?.eighteenPlus?.score || 0}%
• Racist: ${mod.categories?.racist?.score || 0}%

Summary: ${mod.summary || 'Clean and safe content'}`;

      // 1. Native alert so it comes back to the user directly
      alert(alertText);

      // 2. Also mount structured in-app alert modal for visual inspection
      setScanAlertModal({
        title: updatedStory.title,
        author: updatedStory.author?.username || 'author',
        grade: mod.grade || 'CLEAN',
        score: mod.overallScore || 0,
        flagged: Boolean(mod.flagged),
        summary: mod.summary || 'Clean and safe content',
        categories: mod.categories || {},
      });

      showToast('Machine scan completed and verified.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to re-evaluate story.');
    } finally {
      setEvaluatingId(null);
    }
  };

  const handleDelete = async (storyId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.delete(`/api/submissions/${storyId}`, config);
      setSubmissions((prev) => prev.filter((s) => s._id !== storyId));
      showToast('Story removed from database.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete story.');
    }
  };

  const getScoreBadge = (score: number = 0, grade: string = 'CLEAN') => {
    if (grade === 'CRITICAL' || score >= 70) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1">
          <XCircle size={12} /> Critical ({score}/100)
        </span>
      );
    }
    if (grade === 'FLAGGED' || score >= 40) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
          <AlertTriangle size={12} /> Flagged ({score}/100)
        </span>
      );
    }
    if (grade === 'MILD' || score >= 20) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
          Mild ({score}/100)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
        <CheckCircle2 size={12} /> Clean ({score}/100)
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-dark-100 dark:bg-light-100 text-light-100 dark:text-dark-100 px-5 py-2.5 rounded-full shadow-2xl text-xs font-bold"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scan Result Modal Alert ── */}
      <AnimatePresence>
        {scanAlertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-100/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-light-100 dark:bg-dark-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-light-300 dark:border-dark-300 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="text-primary-500" size={20} />
                  <h3 className="text-lg font-bold font-heading text-dark-100 dark:text-light-100">
                    Machine Scan Result
                  </h3>
                </div>
                <button
                  onClick={() => setScanAlertModal(null)}
                  className="p-1 rounded-full hover:bg-light-200 dark:hover:bg-dark-300 text-dark-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-light-200/60 dark:bg-dark-300/60 space-y-2 border border-light-300/40 dark:border-dark-300/40">
                <h4 className="font-bold text-dark-100 dark:text-light-100 text-sm">
                  "{scanAlertModal.title}"
                </h4>
                <div className="flex items-center justify-between text-xs text-dark-400 dark:text-light-400 pt-1 border-t border-light-300/30 dark:border-dark-300/30">
                  <span>Author: @{scanAlertModal.author}</span>
                  <span className="font-mono font-bold text-dark-100 dark:text-light-100">
                    Overall Score: {scanAlertModal.score}/100 ({scanAlertModal.grade})
                  </span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-dark-400 dark:text-light-400">
                  Category Breakdown
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { key: 'sexist', label: 'Sexist' },
                    { key: 'sexual', label: 'Sexual' },
                    { key: 'explicit', label: 'Explicit' },
                    { key: 'eighteenPlus', label: '18+ Adult' },
                    { key: 'racist', label: 'Racist' },
                  ].map(({ key, label }) => {
                    const cat = scanAlertModal.categories[key] || { score: 0, flagged: false };
                    return (
                      <div
                        key={key}
                        className={`p-2.5 rounded-xl border text-center ${
                          cat.flagged
                            ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800'
                            : 'bg-light-200/50 text-dark-300 border-light-300/50 dark:bg-dark-300/40 dark:text-light-300 dark:border-dark-300/50'
                        }`}
                      >
                        <div className="text-[11px] text-dark-400 dark:text-light-400 truncate">{label}</div>
                        <div className="text-sm font-mono font-bold mt-0.5">{cat.score}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-light-200/50 dark:bg-dark-300/30 text-xs text-dark-300 dark:text-light-300">
                <strong>Summary:</strong> {scanAlertModal.summary}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setScanAlertModal(null)}
                  className="btn btn-primary rounded-full px-6 py-2 text-xs font-bold"
                >
                  Acknowledged
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="text-primary-600 dark:text-primary-400" size={24} />
            <h1 className="text-3xl font-bold font-heading text-dark-100 dark:text-light-100">
              Machine Content Safety Audit
            </h1>
          </div>
          <p className="text-sm text-dark-300 dark:text-light-300">
            Automated lexical and semantic content moderation across published stories.
          </p>
        </div>

        <button
          onClick={handleRescanAll}
          disabled={isRescanningAll}
          className="btn btn-primary rounded-full px-6 py-2.5 text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 w-fit"
        >
          <RefreshCw size={14} className={isRescanningAll ? 'animate-spin' : ''} />
          {isRescanningAll ? 'Auditing Database...' : 'Re-run Machine Scan (All)'}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="card p-4">
          <p className="text-xs text-dark-400 dark:text-light-400 font-medium">Published Stories</p>
          <p className="text-2xl font-bold font-mono text-dark-100 dark:text-light-100 mt-1">{stats.totalCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Verified Clean</p>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{stats.cleanCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Flagged</p>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">{stats.flaggedCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Critical</p>
          <p className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 mt-1">{stats.criticalCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-dark-400 dark:text-light-400 font-medium">18+ / Adult</p>
          <p className="text-2xl font-bold font-mono text-dark-100 dark:text-light-100 mt-1">{stats.eighteenPlusCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-dark-400 dark:text-light-400 font-medium">Racist / Hate</p>
          <p className="text-2xl font-bold font-mono text-dark-100 dark:text-light-100 mt-1">{stats.racistCount}</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['ALL', 'FLAGGED', 'CLEAN', 'CRITICAL'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeTab === tab
                    ? 'bg-dark-100 text-light-100 dark:bg-light-100 dark:text-dark-100'
                    : 'text-dark-400 hover:text-dark-100 dark:text-light-400 dark:hover:text-light-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Search audited stories..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="input pl-9 py-1.5 text-xs w-full font-medium"
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-light-200 dark:border-dark-300">
          <span className="text-xs text-dark-400 mr-2 shrink-0">Violation Filter:</span>
          {[
            { id: 'ALL', label: 'All Violations' },
            { id: 'sexist', label: 'Sexist' },
            { id: 'sexual', label: 'Sexual' },
            { id: 'explicit', label: 'Explicit' },
            { id: '18+', label: '18+ Adult' },
            { id: 'racist', label: 'Racist' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id as any); setPage(1); }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-light-200 text-dark-400 hover:bg-light-300 dark:bg-dark-300 dark:text-light-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audited Stories List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card h-40 animate-pulse bg-light-200 dark:bg-dark-200"></div>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <ShieldCheck size={48} className="mx-auto text-emerald-500" />
          <h3 className="text-xl font-bold font-heading text-dark-100 dark:text-light-100">
            No matching stories found
          </h3>
          <p className="text-dark-400 dark:text-light-400 font-serif text-sm max-w-md mx-auto">
            Try adjusting your search criteria or filter tabs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const mod = sub.moderation || {
              overallScore: 0,
              grade: 'CLEAN' as const,
              flagged: false,
              labels: [],
              summary: 'Clean content',
              categories: {
                sexist: { score: 0, flagged: false, matches: [] },
                sexual: { score: 0, flagged: false, matches: [] },
                explicit: { score: 0, flagged: false, matches: [] },
                eighteenPlus: { score: 0, flagged: false, matches: [] },
                racist: { score: 0, flagged: false, matches: [] },
              },
              callbackTriggeredAt: null,
            };

            return (
              <div 
                key={sub._id}
                className="card p-6 border border-light-300/70 dark:border-dark-300/70 transition-all hover:shadow-md"
              >
                <div className="flex flex-col space-y-4">
                  {/* Top Bar: Grade, Category, ID, and Action buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {getScoreBadge(mod.overallScore, mod.grade)}
                      {sub.category && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-light-200 text-dark-400 dark:bg-dark-300 dark:text-light-300">
                          {sub.category.name}
                        </span>
                      )}
                      <span className="text-xs text-dark-400 dark:text-light-400 font-mono">
                        ID: {sub._id.slice(-6)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/blog/${sub.slug}`}
                        className="btn btn-outline py-1 px-3 text-xs flex items-center gap-1.5 rounded-full"
                      >
                        <Eye size={12} /> View Live Story
                      </Link>
                      <button
                        onClick={() => handleReEvaluateSingle(sub._id)}
                        disabled={evaluatingId === sub._id}
                        className="btn btn-outline py-1 px-3 text-xs flex items-center gap-1.5 rounded-full hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        <RefreshCw size={12} className={evaluatingId === sub._id ? 'animate-spin' : ''} />
                        {evaluatingId === sub._id ? 'Scanning...' : 'Re-run Machine Scan'}
                      </button>
                      <button
                        onClick={() => handleDelete(sub._id, sub.title)}
                        className="p-1.5 text-dark-400 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        title="Delete Story"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Abstract */}
                  <div className="space-y-1.5">
                    <Link to={`/blog/${sub.slug}`} className="block group">
                      <h3 className="text-lg font-bold font-heading text-dark-100 dark:text-light-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {sub.title}
                      </h3>
                    </Link>
                    <p className="text-dark-300 dark:text-light-300 text-sm font-serif line-clamp-2">
                      {sub.abstract}
                    </p>
                  </div>

                  {/* Author & Timestamp */}
                  <div className="flex items-center gap-4 text-xs text-dark-400 dark:text-light-400">
                    <Link to={`/authors/${sub.author?.username}`} className="flex items-center gap-1.5 hover:underline">
                      <img
                        src={sub.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.author?.name || 'User')}`}
                        alt={sub.author?.name}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                      <span className="font-medium text-dark-200 dark:text-light-200">{sub.author?.name}</span>
                      <span className="text-dark-400 dark:text-light-400">(@{sub.author?.username})</span>
                    </Link>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Clean Machine Safety Metrics Grid (Non-AI Slop, No rainbow bars) */}
                  <div className="pt-3 border-t border-light-200 dark:border-dark-300 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-dark-100 dark:text-light-100 flex items-center gap-1.5">
                        <Cpu size={14} className="text-primary-500" /> Machine Safety Metrics
                      </span>
                      <span className="font-mono text-xs text-dark-400 dark:text-light-400">
                        {mod.summary}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { label: 'Sexist', cat: mod.categories.sexist },
                        { label: 'Sexual', cat: mod.categories.sexual },
                        { label: 'Explicit', cat: mod.categories.explicit },
                        { label: '18+ Adult', cat: mod.categories.eighteenPlus },
                        { label: 'Racist', cat: mod.categories.racist },
                      ].map(({ label, cat }) => (
                        <div
                          key={label}
                          className={`p-2.5 rounded-xl border text-center transition-colors ${
                            cat.flagged
                              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40 font-semibold'
                              : 'bg-light-200/50 text-dark-300 border-light-300/40 dark:bg-dark-300/40 dark:text-light-300 dark:border-dark-300/40'
                          }`}
                        >
                          <div className="text-[11px] text-dark-400 dark:text-light-400 truncate">{label}</div>
                          <div className="text-sm font-mono font-bold mt-0.5">{cat.score}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-outline p-2 rounded-full disabled:opacity-40"
            aria-label="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-mono text-dark-400 dark:text-light-400 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-outline p-2 rounded-full disabled:opacity-40"
            aria-label="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
