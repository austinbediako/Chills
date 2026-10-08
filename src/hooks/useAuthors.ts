import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';

export interface AuthorUser {
  _id: string;
  name: string;
  username: string;
  email?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  followers?: string[];
  following?: string[];
}

export const useAuthors = () => {
  const { user } = useAuth();
  const [authors, setAuthors] = useState<AuthorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeader = useCallback(() => {
    const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, [user]);

  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // First attempt admin endpoint /api/users
      const res = await axios.get('/api/users', getAuthHeader());
      setAuthors(res.data || []);
    } catch (err: any) {
      console.warn('Admin users endpoint failed, attempting /api/users/authors fallback:', err.message);
      try {
        // Fallback to public authors endpoint
        const fallbackRes = await axios.get('/api/users/authors');
        setAuthors(fallbackRes.data || []);
      } catch (fallbackErr: any) {
        console.error('Failed to load authors:', fallbackErr);
        setError(fallbackErr.response?.data?.message || fallbackErr.message || 'Error loading authors');
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await axios.put(`/api/users/${userId}`, { role: newRole }, getAuthHeader());
      setAuthors((prev) =>
        prev.map((a) => (a._id === userId ? { ...a, role: newRole } : a))
      );
      return true;
    } catch (err: any) {
      console.error('Error updating user role:', err);
      throw err;
    }
  };

  const toggleUserStatus = async (userId: string, newActiveState?: boolean) => {
    try {
      const res = await axios.patch(
        `/api/users/${userId}/status`,
        typeof newActiveState === 'boolean' ? { isActive: newActiveState } : {},
        getAuthHeader()
      );
      const nextActive = res.data?.isActive ?? newActiveState;
      setAuthors((prev) =>
        prev.map((a) => (a._id === userId ? { ...a, isActive: nextActive } : a))
      );
      return res.data;
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      throw err;
    }
  };

  return { authors, loading, error, refetch: fetchAuthors, updateUserRole, toggleUserStatus };
};

export default useAuthors;