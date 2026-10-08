import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { showNotification } from '../redux/slices/uiSlice';
import { 
  Camera, Loader2, ArrowLeft, Check, Lock, 
  Sparkles, ExternalLink, Image as ImageIcon, X, Eye, EyeOff
} from 'lucide-react';
import axios from 'axios';

export const ProfilePage: React.FC = () => {
  const { user, updateUserProfile, loading } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    gender: user?.gender || 'other',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    coverImage: user?.coverImage || '',
    password: '',
    confirmPassword: '',
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [coverPreview, setCoverPreview] = useState(user?.coverImage || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch latest fresh profile data directly from server on mount
  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get('/api/auth/profile', { headers });
        if (res.data) {
          setProfileData((prev) => ({
            ...prev,
            name: res.data.name || '',
            email: res.data.email || '',
            username: res.data.username || '',
            gender: res.data.gender || 'other',
            bio: res.data.bio || '',
            avatar: res.data.avatar || '',
            coverImage: res.data.coverImage || '',
          }));
          setAvatarPreview(res.data.avatar || '');
          setCoverPreview(res.data.coverImage || '');
        }
      } catch (err) {
        console.warn('Could not fetch server profile, using cached user state:', err);
      }
    };

    fetchLatestProfile();
  }, [user]);

  // Sync state if user context updates
  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        username: prev.username || user.username || '',
        gender: prev.gender || user.gender || 'other',
        bio: prev.bio || user.bio || '',
        avatar: prev.avatar || user.avatar || '',
        coverImage: prev.coverImage || user.coverImage || '',
      }));
      if (!avatarPreview && user.avatar) setAvatarPreview(user.avatar);
      if (!coverPreview && user.coverImage) setCoverPreview(user.coverImage);
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Upload Avatar to Cloudinary (folder: avatars)
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      dispatch(showNotification({
        message: 'Please select a valid image file (PNG, JPG, WebP).',
        type: 'error'
      }));
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      dispatch(showNotification({
        message: 'Avatar image must be smaller than 8MB.',
        type: 'error'
      }));
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append('image', file);

      const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
      const res = await axios.post('/api/submissions/upload?folder=avatars', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      const uploadedUrl = res.data?.imageUrl;
      if (!uploadedUrl) throw new Error('No image URL returned from upload server');

      setProfileData((prev) => ({ ...prev, avatar: uploadedUrl }));
      setAvatarPreview(uploadedUrl);

      dispatch(showNotification({
        message: 'Avatar uploaded successfully! Click "Save Changes" to apply.',
        type: 'success'
      }));
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      dispatch(showNotification({
        message: err.response?.data?.message || 'Failed to upload avatar image. Please try again.',
        type: 'error'
      }));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Upload Cover Image to Cloudinary (folder: covers)
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      dispatch(showNotification({
        message: 'Please select a valid image file (PNG, JPG, WebP).',
        type: 'error'
      }));
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      dispatch(showNotification({
        message: 'Cover banner image must be smaller than 12MB.',
        type: 'error'
      }));
      return;
    }

    try {
      setIsUploadingCover(true);
      const formData = new FormData();
      formData.append('image', file);

      const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
      const res = await axios.post('/api/submissions/upload?folder=covers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      const uploadedUrl = res.data?.imageUrl;
      if (!uploadedUrl) throw new Error('No image URL returned from upload server');

      setProfileData((prev) => ({ ...prev, coverImage: uploadedUrl }));
      setCoverPreview(uploadedUrl);

      dispatch(showNotification({
        message: 'Cover image uploaded! Click "Save Changes" to apply.',
        type: 'success'
      }));
    } catch (err: any) {
      console.error('Cover upload failed:', err);
      dispatch(showNotification({
        message: err.response?.data?.message || 'Failed to upload cover image. Please try again.',
        type: 'error'
      }));
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (profileData.password) {
      if (profileData.password !== profileData.confirmPassword) {
        setError('Passwords do not match');
        dispatch(showNotification({ message: 'Passwords do not match', type: 'error' }));
        return;
      }
      if (profileData.password.length < 6) {
        setError('Password must be at least 6 characters');
        dispatch(showNotification({ message: 'Password must be at least 6 characters', type: 'error' }));
        return;
      }
    }

    setIsSaving(true);
    try {
      const updatePayload: any = {
        name: profileData.name.trim(),
        username: profileData.username.trim(),
        gender: profileData.gender,
        bio: profileData.bio.trim(),
        avatar: profileData.avatar,
        coverImage: profileData.coverImage,
      };

      if (profileData.password) {
        updatePayload.password = profileData.password;
      }

      const success = await updateUserProfile(updatePayload);

      if (success) {
        dispatch(showNotification({ message: 'Profile updated successfully!', type: 'success' }));
        navigate(`/@${profileData.username || user?.username}`);
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
      dispatch(showNotification({ 
        message: err.response?.data?.message || 'Failed to update profile', 
        type: 'error' 
      }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-100 dark:bg-dark-100 text-dark-100 dark:text-light-100 pb-24">
      {/* ── Main Container: Matches Author Details Layout (Spacious & Professional) ── */}
      <div className="max-w-5xl lg:max-w-6xl mx-auto border-x border-light-200 dark:border-dark-300 min-h-screen bg-light-100/40 dark:bg-dark-100/40">
        
        {/* ── Sticky Top Header Bar (like X) ── */}
        <div className="sticky top-0 z-30 bg-light-100/90 dark:bg-dark-100/90 backdrop-blur-xl px-5 py-3.5 flex items-center justify-between border-b border-light-300 dark:border-dark-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/@${profileData.username || user?.username}`)}
              className="p-2 rounded-full hover:bg-light-200 dark:hover:bg-dark-200 transition-colors text-dark-300 dark:text-light-300"
              title="Return to Public Profile"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold font-heading leading-tight">
                Edit Profile
              </h1>
              <p className="text-xs text-dark-400 dark:text-light-400">
                @{profileData.username || user?.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to={`/@${profileData.username || user?.username}`}
              className="hidden sm:inline-flex px-4 py-1.5 rounded-full border border-light-300 dark:border-dark-300 text-xs font-bold hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
            >
              View Profile
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSaving || isUploadingAvatar || isUploadingCover}
              className="px-6 py-2 rounded-full bg-dark-100 text-light-100 dark:bg-light-100 dark:text-dark-100 text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Live Cover Image Banner with Camera Upload ── */}
        <div className="relative h-48 sm:h-64 w-full bg-gradient-to-r from-primary-600 via-secondary-600 to-indigo-700 overflow-hidden group">
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="Cover Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full opacity-30 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          )}

          {/* Cover upload overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-70 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <label
              htmlFor="cover-upload-input"
              className="cursor-pointer px-4 py-2 rounded-full bg-dark-100/80 text-light-100 backdrop-blur-md hover:bg-dark-100 text-xs font-bold transition-all shadow-lg flex items-center gap-2 hover:scale-105"
            >
              {isUploadingCover ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Uploading Cover...</span>
                </>
              ) : (
                <>
                  <Camera size={15} />
                  <span>{coverPreview ? 'Change Cover Image' : 'Add Cover Image'}</span>
                </>
              )}
            </label>
            <input
              id="cover-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
              disabled={isUploadingCover}
            />

            {coverPreview && (
              <button
                type="button"
                onClick={() => {
                  setProfileData((prev) => ({ ...prev, coverImage: '' }));
                  setCoverPreview('');
                }}
                className="p-2 rounded-full bg-dark-100/80 text-light-100 hover:bg-red-600 transition-colors backdrop-blur-md"
                title="Remove Cover Image"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* ── Avatar Section with Overlay Camera (Matches Author Layout) ── */}
        <div className="px-6 relative pb-6 border-b border-light-300/60 dark:border-dark-300/60">
          <div className="flex justify-between items-end -mt-16 sm:-mt-20 mb-6">
            <div className="relative group">
              <img
                src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&size=150`}
                alt="Profile Avatar"
                className="h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover border-4 border-light-100 dark:border-dark-100 bg-light-200 dark:bg-dark-200 shadow-2xl"
              />

              {/* Avatar upload overlay */}
              <label
                htmlFor="avatar-upload-input"
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer flex flex-col items-center justify-center text-white transition-opacity border-4 border-transparent"
                title="Change Avatar"
              >
                {isUploadingAvatar ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <Camera size={22} className="mb-1" />
                    <span className="text-[10px] font-bold">Change</span>
                  </>
                )}
              </label>
              <input
                id="avatar-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
              />
            </div>
          </div>

          {/* Error notice if any */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* ── Form Fields: Styled Elegantly into the Profile Layout ── */}
          <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
            
            {/* Name & Handle Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-dark-300 dark:text-light-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-light-200/50 dark:bg-dark-200/50 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark-300 dark:text-light-300 mb-1.5">
                  Username (@handle)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-dark-400 dark:text-light-400 font-mono text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    name="username"
                    value={profileData.username}
                    onChange={handleChange}
                    required
                    placeholder="username"
                    className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl bg-light-200/50 dark:bg-dark-200/50 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Bio Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-dark-300 dark:text-light-300">
                  Bio / About You
                </label>
                <span className="text-[11px] text-dark-400 dark:text-light-400">
                  {profileData.bio.length}/280
                </span>
              </div>
              <textarea
                name="bio"
                rows={3}
                maxLength={280}
                value={profileData.bio}
                onChange={handleChange}
                placeholder="Share your background, what you write about, or interests..."
                className="w-full p-4 text-sm rounded-2xl bg-light-200/50 dark:bg-dark-200/50 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-serif resize-none leading-relaxed"
              />
            </div>

            {/* Gender & Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-dark-300 dark:text-light-300 mb-1.5">
                  Gender
                </label>
                <select
                  name="gender"
                  value={profileData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-light-200/50 dark:bg-dark-200/50 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other / Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark-300 dark:text-light-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-light-300/40 dark:bg-dark-300/40 border border-light-300 dark:border-dark-300 text-dark-400 dark:text-light-400 cursor-not-allowed"
                  title="Contact support to change account email"
                />
              </div>
            </div>

            {/* Change Password Accordion */}
            <div className="pt-2 border-t border-light-300/60 dark:border-dark-300/60">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1.5 hover:underline"
              >
                <Lock size={13} />
                <span>{showPasswordSection ? 'Cancel Password Change' : 'Change Password'}</span>
              </button>

              {showPasswordSection && (
                <div className="mt-4 p-4 rounded-2xl bg-light-200/30 dark:bg-dark-200/30 border border-light-300/60 dark:border-dark-300/60 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark-300 dark:text-light-300 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={profileData.password}
                          onChange={handleChange}
                          placeholder="Min 6 characters"
                          className="w-full px-3.5 py-2 text-xs rounded-xl bg-light-100 dark:bg-dark-100 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-dark-400 hover:text-dark-100"
                        >
                          {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dark-300 dark:text-light-300 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={profileData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-light-100 dark:bg-dark-100 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Save Action Button */}
            <div className="pt-6 flex items-center justify-end gap-3">
              <Link
                to={`/@${profileData.username || user?.username}`}
                className="px-5 py-2.5 rounded-full border border-light-300 dark:border-dark-300 text-xs font-bold hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving || isUploadingAvatar || isUploadingCover}
                className="px-8 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs transition-transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};

export default ProfilePage;