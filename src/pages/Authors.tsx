import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  ExternalLink,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import useAuthors, { AuthorUser } from '../hooks/useAuthors';
import { useAuth } from '../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { showNotification } from '../redux/slices/uiSlice';

const Authors: React.FC = () => {
  const { authors, loading, error, refetch, updateUserRole, deleteUser } = useAuthors();
  const { user: currentUser } = useAuth();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'admin' | 'author' | 'user'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtered authors
  const filteredAuthors = useMemo(() => {
    return authors.filter((a) => {
      const matchesSearch =
        a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'ALL' || a.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [authors, searchQuery, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingId(userId);
      await updateUserRole(userId, newRole);
      dispatch(showNotification({ message: 'User role updated successfully', type: 'success' }));
    } catch (err: any) {
      dispatch(showNotification({ message: err.response?.data?.message || 'Failed to update role', type: 'error' }));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userToDelete: AuthorUser) => {
    if (userToDelete._id === currentUser?._id) {
      dispatch(showNotification({ message: 'You cannot delete your own account', type: 'error' }));
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user @${userToDelete.username}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(userToDelete._id);
      await deleteUser(userToDelete._id);
      dispatch(showNotification({ message: `User @${userToDelete.username} deleted`, type: 'info' }));
    } catch (err: any) {
      dispatch(showNotification({ message: err.response?.data?.message || 'Failed to delete user', type: 'error' }));
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50';
      case 'author':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50';
      default:
        return 'bg-light-300 text-dark-500 border-light-400 dark:bg-dark-300 dark:text-light-400 dark:border-dark-400/40';
    }
  };

  return (
    <div className="container-custom py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-dark-100 dark:text-light-100 tracking-tight">
                Manage Users
              </h1>
              <p className="text-sm text-dark-400 dark:text-light-400 mt-0.5">
                Manage accounts, assign roles, and inspect author profiles across the platform.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="btn btn-outline flex items-center gap-2 text-sm px-4 py-2"
            title="Refresh user list"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-light-300 dark:border-dark-300 bg-light-100 dark:bg-dark-200/50">
          <p className="text-xs uppercase font-mono tracking-wider text-dark-400 dark:text-light-400">Total Users</p>
          <p className="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 mt-1">{authors.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-light-300 dark:border-dark-300 bg-light-100 dark:bg-dark-200/50">
          <p className="text-xs uppercase font-mono tracking-wider text-purple-600 dark:text-purple-400">Admins</p>
          <p className="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 mt-1">
            {authors.filter((a) => a.role === 'admin').length}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-light-300 dark:border-dark-300 bg-light-100 dark:bg-dark-200/50">
          <p className="text-xs uppercase font-mono tracking-wider text-emerald-600 dark:text-emerald-400">Authors</p>
          <p className="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 mt-1">
            {authors.filter((a) => a.role === 'author').length}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-light-300 dark:border-dark-300 bg-light-100 dark:bg-dark-200/50">
          <p className="text-xs uppercase font-mono tracking-wider text-dark-400 dark:text-light-400">Standard Users</p>
          <p className="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 mt-1">
            {authors.filter((a) => a.role === 'user' || !a.role).length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6 p-4 rounded-2xl bg-light-200/60 dark:bg-dark-200/40 border border-light-300 dark:border-dark-300">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, handle, or email..."
            className="input pl-10 pr-4 py-2 w-full text-sm"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-light-400" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter size={15} className="text-dark-400 dark:text-light-400 shrink-0" />
          {(['ALL', 'admin', 'author', 'user'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors uppercase tracking-wider ${
                roleFilter === role
                  ? 'bg-dark-100 text-light-100 dark:bg-light-100 dark:text-dark-100 shadow-sm'
                  : 'bg-light-100 dark:bg-dark-300 text-dark-400 dark:text-light-400 hover:bg-light-300 dark:hover:bg-dark-200'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-800 dark:text-red-300">Error Loading Users</h3>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="text-xs underline font-semibold text-red-700 dark:text-red-300 hover:opacity-80"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Table / List */}
      <div className="rounded-2xl border border-light-300 dark:border-dark-300 bg-light-100 dark:bg-dark-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-500 border-t-transparent mx-auto"></div>
            <p className="text-sm text-dark-400 dark:text-light-400 font-mono">Loading user directory...</p>
          </div>
        ) : filteredAuthors.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <UserX className="w-12 h-12 text-dark-300 dark:text-light-400 mx-auto stroke-[1.5]" />
            <h3 className="text-lg font-bold font-heading text-dark-100 dark:text-light-100">No users found</h3>
            <p className="text-sm text-dark-400 dark:text-light-400 max-w-sm mx-auto">
              No accounts matched your search or role filters.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-primary-600 dark:text-primary-400 font-semibold underline"
              >
                Clear search filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-light-300 dark:border-dark-300 bg-light-200/50 dark:bg-dark-200/50 text-xs font-mono uppercase text-dark-400 dark:text-light-400">
                  <th className="py-3.5 px-4 sm:px-6 font-semibold">User</th>
                  <th className="py-3.5 px-4 font-semibold hidden md:table-cell">Email</th>
                  <th className="py-3.5 px-4 font-semibold">Role</th>
                  <th className="py-3.5 px-4 font-semibold hidden sm:table-cell">Followers</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-200 dark:divide-dark-300">
                {filteredAuthors.map((author) => {
                  const isCurrent = author._id === currentUser?._id;
                  const profileUrl = author.username ? `/@${author.username}` : '#';

                  return (
                    <motion.tr
                      key={author._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-light-200/40 dark:hover:bg-dark-200/40 transition-colors"
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <Link to={profileUrl} className="shrink-0 relative group">
                            <img
                              src={
                                author.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || 'User')}`
                              }
                              alt={author.name}
                              className="w-10 h-10 rounded-full object-cover border border-light-300 dark:border-dark-300 group-hover:ring-2 ring-primary-500 transition-all"
                            />
                          </Link>
                          <div className="min-w-0">
                            <Link
                              to={profileUrl}
                              className="font-bold text-dark-100 dark:text-light-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate block"
                            >
                              {author.name}
                              {isCurrent && (
                                <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 font-semibold">
                                  YOU
                                </span>
                              )}
                            </Link>
                            <p className="text-xs text-dark-400 dark:text-light-400 truncate">
                              @{author.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-dark-400 dark:text-light-400 font-mono text-xs truncate max-w-xs">
                        {author.email || '—'}
                      </td>

                      {/* Role Selector */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={author.role || 'user'}
                            disabled={updatingId === author._id || isCurrent}
                            onChange={(e) => handleRoleChange(author._id, e.target.value)}
                            aria-label={`Change role for ${author.name}`}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${getRoleBadge(
                              author.role || 'user'
                            )} disabled:opacity-75 disabled:cursor-not-allowed`}
                          >
                            <option value="user">User</option>
                            <option value="author">Author</option>
                            <option value="admin">Admin</option>
                          </select>
                          {updatingId === author._id && (
                            <RefreshCw size={12} className="animate-spin text-primary-500" />
                          )}
                        </div>
                      </td>

                      {/* Followers */}
                      <td className="py-3.5 px-4 hidden sm:table-cell text-xs text-dark-400 dark:text-light-400">
                        {Array.isArray(author.followers) ? author.followers.length : 0}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={profileUrl}
                            className="p-1.5 rounded-lg text-dark-400 hover:text-dark-100 dark:text-light-400 dark:hover:text-light-100 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
                            title="View Public Profile"
                          >
                            <ExternalLink size={16} />
                          </Link>

                          {!isCurrent && (
                            <button
                              onClick={() => handleDelete(author)}
                              disabled={deletingId === author._id}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                              title="Delete User Account"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Authors;