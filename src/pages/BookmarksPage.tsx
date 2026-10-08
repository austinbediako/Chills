import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  Folder,
  FolderPlus,
  Search,
  Trash2,
  Clock,
  BookOpen,
  ArrowRight,
  Loader2,
  X,
  Filter,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { showNotification } from '../redux/slices/uiSlice';
import BookmarkDropdown from '../components/common/BookmarkDropdown';
import { useEscapeKey } from '../hooks/useKeyboardShortcuts';

interface Author {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface SavedSubmission {
  _id: string;
  title: string;
  slug: string;
  abstract: string;
  image?: string;
  readTime?: string;
  createdAt: string;
  category?: Category;
  author: Author;
  tags?: string[];
}

interface BookmarkItem {
  _id: string;
  folder: string;
  createdAt: string;
  submission: SavedSubmission;
}

export const BookmarksPage: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [folders, setFolders] = useState<string[]>(['General']);
  const [activeFolder, setActiveFolder] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // New folder creation state
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Global ESC key dismisses folder modal
  useEscapeKey(() => setShowNewFolderModal(false), showNewFolderModal);

  const getAuthHeader = useCallback(() => {
    const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, [user]);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const folderParam = activeFolder !== 'All' ? `&folder=${encodeURIComponent(activeFolder)}` : '';
      const searchParam = searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : '';

      const res = await axios.get(
        `/api/users/bookmarks?${folderParam}${searchParam}`,
        getAuthHeader()
      );

      setBookmarks(res.data?.bookmarks || []);
      if (Array.isArray(res.data?.folders)) {
        setFolders(res.data.folders);
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFolder, searchQuery, getAuthHeader]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Remove a bookmark
  const handleRemoveBookmark = async (submissionId: string) => {
    try {
      await axios.post(
        `/api/submissions/${submissionId}/interact`,
        { type: 'BOOKMARK', remove: true },
        getAuthHeader()
      );

      setBookmarks((prev) => prev.filter((b) => b.submission._id !== submissionId));
      dispatch(showNotification({ message: 'Bookmark removed', type: 'info' }));
    } catch (err) {
      console.error('Error removing bookmark:', err);
    }
  };

  // Change bookmark folder callback
  const handleBookmarkFolderChange = (submissionId: string, newFolder: string | null) => {
    if (!newFolder) {
      setBookmarks((prev) => prev.filter((b) => b.submission._id !== submissionId));
    } else {
      setBookmarks((prev) =>
        prev.map((b) =>
          b.submission._id === submissionId ? { ...b, folder: newFolder } : b
        )
      );
      if (!folders.includes(newFolder)) {
        setFolders((prev) => [...prev, newFolder]);
      }
    }
  };

  // Create empty folder
  const handleCreateNewFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    if (!folders.includes(trimmed)) {
      setFolders((prev) => [...prev, trimmed]);
      setActiveFolder(trimmed);
      dispatch(showNotification({ message: `Folder "${trimmed}" created`, type: 'success' }));
    }
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  // Delete folder
  const handleDeleteFolder = async (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (folderName === 'General') {
      dispatch(showNotification({ message: 'Default folder cannot be deleted', type: 'info' }));
      return;
    }

    try {
      await axios.delete(`/api/users/bookmark-folders/${encodeURIComponent(folderName)}`, getAuthHeader());
      setFolders((prev) => prev.filter((f) => f !== folderName));
      if (activeFolder === folderName) {
        setActiveFolder('All');
      }
      fetchBookmarks();
      dispatch(showNotification({ message: `Folder "${folderName}" deleted. Stories moved to General.`, type: 'info' }));
    } catch (err) {
      console.error('Error deleting folder:', err);
    }
  };

  return (
    <div className="min-h-screen bg-light-100 dark:bg-dark-100 text-dark-100 dark:text-light-100 pt-4 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-light-300 dark:border-dark-300">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
                <Bookmark size={24} fill="currentColor" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
                  Bookmarks
                </h1>
                <p className="text-xs text-dark-400 dark:text-light-400 font-serif">
                  {bookmarks.length} saved {bookmarks.length === 1 ? 'story' : 'stories'} organized with zero duplicated data
                </p>
              </div>
            </div>
          </div>

          {/* Search within bookmarks */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3.5 top-3 text-dark-400 dark:text-light-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookmarks..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-light-200/60 dark:bg-dark-200/60 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="px-4 py-2 rounded-full bg-dark-100 text-light-100 dark:bg-light-100 dark:text-dark-100 text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <FolderPlus size={14} />
              <span>New Folder</span>
            </button>
          </div>
        </div>

        {/* ── Folder Filter Tabs ── */}
        <div className="py-5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-semibold text-dark-400 dark:text-light-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter size={13} />
            <span>Folders:</span>
          </span>

          {['All', ...folders].map((f) => {
            const isSelected = activeFolder === f;
            return (
              <button
                key={f}
                onClick={() => setActiveFolder(f)}
                className={`group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-light-200/80 dark:bg-dark-200/80 text-dark-300 dark:text-light-300 hover:bg-light-300 dark:hover:bg-dark-300'
                }`}
              >
                {f !== 'All' && <Folder size={12} className={isSelected ? 'text-white' : 'text-primary-500'} />}
                <span>{f}</span>
                {f !== 'All' && f !== 'General' && isSelected && (
                  <span
                    onClick={(e) => handleDeleteFolder(f, e)}
                    className="ml-1 opacity-70 hover:opacity-100 hover:text-red-200"
                    title={`Delete folder "${f}"`}
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Bookmarks Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="p-5 rounded-2xl border border-light-300 dark:border-dark-300 space-y-4 animate-pulse">
                <div className="h-44 bg-light-300 dark:bg-dark-300 rounded-xl"></div>
                <div className="h-5 w-3/4 bg-light-300 dark:bg-dark-300 rounded"></div>
                <div className="h-12 w-full bg-light-300 dark:bg-dark-300 rounded"></div>
              </div>
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="py-24 text-center">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-light-200 dark:bg-dark-200 flex items-center justify-center text-primary-500">
              <Bookmark size={28} />
            </div>
            <h3 className="text-lg font-bold font-heading mb-1.5">No Bookmarks in {activeFolder}</h3>
            <p className="text-sm text-dark-400 dark:text-light-400 max-w-sm mx-auto font-serif mb-6">
              {searchQuery
                ? `No bookmarks match "${searchQuery}".`
                : activeFolder === 'All'
                ? "You haven't bookmarked any stories yet. Explore the feed or articles to save pieces for later."
                : `No stories are currently saved in the "${activeFolder}" folder.`}
            </p>
            <Link
              to="/feed"
              className="px-6 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs transition-transform hover:scale-105 shadow-md inline-flex items-center gap-1.5"
            >
              <span>Explore Feed</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
            {bookmarks.map((item) => {
              const s = item.submission;
              return (
                <article
                  key={item._id}
                  className="group rounded-3xl bg-light-200/40 dark:bg-dark-200/40 border border-light-300/80 dark:border-dark-300/80 overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Image */}
                    {s.image ? (
                      <Link to={`/blog/${s.slug}`} className="block h-44 overflow-hidden relative">
                        <img
                          src={s.image}
                          alt={s.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Folder badge overlay */}
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-dark-100/80 text-light-100 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                          <Folder size={11} className="text-amber-400" />
                          <span>{item.folder}</span>
                        </div>
                      </Link>
                    ) : (
                      <div className="p-4 pt-5 pb-0 flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 flex items-center gap-1.5">
                          <Folder size={11} />
                          <span>{item.folder}</span>
                        </span>
                      </div>
                    )}

                    {/* Card Body */}
                    <div className="p-5 space-y-2.5">
                      {/* Author row */}
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            s.author?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(s.author?.name || 'Author')}`
                          }
                          alt=""
                          className="h-5 w-5 rounded-full object-cover"
                        />
                        <Link
                          to={`/@${s.author?.username}`}
                          className="text-xs font-semibold text-dark-300 dark:text-light-300 hover:underline truncate"
                        >
                          {s.author?.name}
                        </Link>
                        {s.readTime && (
                          <span className="text-[11px] text-dark-400 dark:text-light-400 flex items-center gap-1 ml-auto">
                            <Clock size={11} />
                            <span>{s.readTime}</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <Link to={`/blog/${s.slug}`} className="block">
                        <h3 className="font-bold font-heading text-dark-100 dark:text-light-100 text-base group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug">
                          {s.title}
                        </h3>
                      </Link>

                      {/* Excerpt */}
                      <p className="text-xs font-serif text-dark-300 dark:text-light-300 line-clamp-2 leading-relaxed">
                        {s.abstract}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="px-5 py-3.5 border-t border-light-300/60 dark:border-dark-300/60 flex items-center justify-between text-xs">
                    <Link
                      to={`/blog/${s.slug}`}
                      className="font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      <BookOpen size={13} />
                      <span>Read Story</span>
                    </Link>

                    <div className="flex items-center gap-1.5">
                      {/* Interactive Bookmark Dropdown to switch folder or remove */}
                      <BookmarkDropdown
                        submissionId={s._id}
                        isBookmarked={true}
                        initialFolder={item.folder}
                        onBookmarkChange={(isBm, newFolder) => handleBookmarkFolderChange(s._id, newFolder)}
                        size={15}
                      />

                      <button
                        onClick={() => handleRemoveBookmark(s._id)}
                        className="p-1.5 rounded-full text-dark-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Remove bookmark"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Modal: Create New Folder ── */}
      <AnimatePresence>
        {showNewFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-light-100 dark:bg-dark-100 rounded-3xl border border-light-300 dark:border-dark-300 p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-light-200 dark:border-dark-200">
                <h3 className="text-base font-bold font-heading flex items-center gap-2">
                  <FolderPlus size={18} className="text-primary-500" />
                  <span>Create Bookmark Folder</span>
                </h3>
                <button
                  onClick={() => setShowNewFolderModal(false)}
                  className="p-1.5 rounded-full hover:bg-light-200 dark:hover:bg-dark-200"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateNewFolder} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 dark:text-light-300 mb-1.5">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g. Design Systems, AI Research, Weekend Reads"
                    autoFocus
                    required
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-light-200 dark:bg-dark-200 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewFolderModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-dark-400 hover:bg-light-200 dark:hover:bg-dark-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newFolderName.trim()}
                    className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md"
                  >
                    Create Folder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookmarksPage;
