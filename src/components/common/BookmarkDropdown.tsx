import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, FolderPlus, Folder, Check, Plus, Trash2, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../redux/slices/uiSlice';

interface BookmarkDropdownProps {
  submissionId: string;
  isBookmarked: boolean;
  initialFolder?: string | null;
  onBookmarkChange?: (isBookmarked: boolean, folder: string | null) => void;
  className?: string;
  size?: number;
  showLabel?: boolean;
}

export const BookmarkDropdown: React.FC<BookmarkDropdownProps> = ({
  submissionId,
  isBookmarked: initialIsBookmarked,
  initialFolder,
  onBookmarkChange,
  className = '',
  size = 18,
  showLabel = false,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isOpen, setIsOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [currentFolder, setCurrentFolder] = useState<string>(initialFolder || 'General');
  const [folders, setFolders] = useState<string[]>(['General']);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [savingAction, setSavingAction] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync props
  useEffect(() => {
    setIsBookmarked(initialIsBookmarked);
    if (initialFolder) {
      setCurrentFolder(initialFolder);
    }
  }, [initialIsBookmarked, initialFolder]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreatingFolder(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getAuthHeader = () => {
    const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  // Load existing folders when dropdown opens
  const fetchFolders = async () => {
    if (!isAuthenticated) return;
    setLoadingFolders(true);
    try {
      const res = await axios.get('/api/users/bookmark-folders', getAuthHeader());
      if (Array.isArray(res.data) && res.data.length > 0) {
        setFolders(res.data);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleToggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated) {
      dispatch(showNotification({ message: 'Please sign in to save bookmarks', type: 'info' }));
      navigate('/auth/login');
      return;
    }

    if (!isOpen) {
      fetchFolders();
    }
    setIsOpen(!isOpen);
  };

  // Save / move bookmark to target folder
  const handleSelectFolder = async (folderName: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    setSavingAction(true);
    try {
      const res = await axios.post(
        `/api/submissions/${submissionId}/interact`,
        { type: 'BOOKMARK', folder: folderName },
        getAuthHeader()
      );

      setIsBookmarked(true);
      setCurrentFolder(folderName);
      if (!folders.includes(folderName)) {
        setFolders((prev) => [...prev, folderName]);
      }

      dispatch(showNotification({ message: `Saved to "${folderName}"`, type: 'success' }));
      if (onBookmarkChange) {
        onBookmarkChange(true, folderName);
      }
      setIsOpen(false);
      setIsCreatingFolder(false);
    } catch (err) {
      console.error('Error updating bookmark folder:', err);
      dispatch(showNotification({ message: 'Failed to update bookmark', type: 'error' }));
    } finally {
      setSavingAction(false);
    }
  };

  // Create new folder and save bookmark into it
  const handleCreateFolderAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    await handleSelectFolder(trimmed);
    setNewFolderName('');
  };

  // Remove bookmark
  const handleRemoveBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setSavingAction(true);
    try {
      await axios.post(
        `/api/submissions/${submissionId}/interact`,
        { type: 'BOOKMARK', remove: true },
        getAuthHeader()
      );

      setIsBookmarked(false);
      setCurrentFolder('General');
      dispatch(showNotification({ message: 'Removed from bookmarks', type: 'info' }));
      if (onBookmarkChange) {
        onBookmarkChange(false, null);
      }
      setIsOpen(false);
    } catch (err) {
      console.error('Error removing bookmark:', err);
    } finally {
      setSavingAction(false);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={handleToggleOpen}
        className={`flex items-center gap-1.5 transition-all p-1.5 rounded-full hover:bg-primary-50 dark:hover:bg-primary-950/30 ${
          isBookmarked
            ? 'text-primary-600 dark:text-primary-400 font-semibold'
            : 'text-dark-400 dark:text-light-400 hover:text-primary-600 dark:hover:text-primary-400'
        } ${className}`}
        title={isBookmarked ? `Saved in "${currentFolder}" (Click to organize)` : 'Bookmark story'}
        aria-label="Bookmark options"
      >
        <Bookmark
          size={size}
          fill={isBookmarked ? 'currentColor' : 'none'}
          className={isBookmarked ? 'scale-110' : ''}
        />
        {showLabel && (
          <span className="text-xs">
            {isBookmarked ? (currentFolder !== 'General' ? currentFolder : 'Saved') : 'Save'}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 bottom-full mb-2 w-64 z-50 bg-light-100 dark:bg-dark-100 rounded-2xl shadow-2xl border border-light-300 dark:border-dark-300 p-3 text-left overflow-hidden pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Status */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-light-200 dark:border-dark-200">
              <span className="text-xs font-bold text-dark-100 dark:text-light-100 flex items-center gap-1.5">
                <Bookmark size={13} className="text-primary-500" />
                <span>Bookmark to Folder</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-dark-400 hover:bg-light-200 dark:hover:bg-dark-200"
              >
                <X size={12} />
              </button>
            </div>

            {/* Quick Folders List */}
            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
              {loadingFolders ? (
                <div className="py-4 text-center text-xs text-dark-400 dark:text-light-400 flex items-center justify-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Loading folders...</span>
                </div>
              ) : (
                folders.map((folder) => {
                  const isSelected = isBookmarked && currentFolder === folder;
                  return (
                    <button
                      key={folder}
                      onClick={(e) => handleSelectFolder(folder, e)}
                      disabled={savingAction}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400 font-bold'
                          : 'text-dark-200 dark:text-light-200 hover:bg-light-200 dark:hover:bg-dark-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder size={13} className={isSelected ? 'text-primary-500' : 'text-dark-400 dark:text-light-400'} />
                        <span className="truncate">{folder}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-primary-600 dark:text-primary-400 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Create New Folder Field */}
            <div className="pt-2 mt-2 border-t border-light-200 dark:border-dark-200">
              {isCreatingFolder ? (
                <form onSubmit={handleCreateFolderAndSave} className="space-y-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name (e.g. AI Reads)..."
                    autoFocus
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-light-200 dark:bg-dark-200 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-1 focus:ring-primary-500 text-dark-100 dark:text-light-100"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsCreatingFolder(false)}
                      className="px-2.5 py-1 text-[11px] rounded-lg text-dark-400 hover:bg-light-200 dark:hover:bg-dark-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newFolderName.trim() || savingAction}
                      className="px-3 py-1 text-[11px] rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-bold transition-all shadow-sm flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>Create & Save</span>
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreatingFolder(true)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                >
                  <FolderPlus size={13} />
                  <span>Create new folder</span>
                </button>
              )}
            </div>

            {/* Remove Bookmark Option (if currently bookmarked) */}
            {isBookmarked && (
              <div className="pt-2 mt-2 border-t border-light-200 dark:border-dark-200">
                <button
                  onClick={handleRemoveBookmark}
                  disabled={savingAction}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Remove from bookmarks</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookmarkDropdown;
