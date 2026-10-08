import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Loader2, User as UserIcon, X, Check, LogOut } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const UsernameSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUserProfile, logoutUser, loading } = useAuth();
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  
  // Clean up auto-generated username prefix if present to give a clean slate
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    if (user?.bio) {
      setBio(user.bio);
    }
    if (user?.username && user.username.startsWith('pending-')) {
      setUsername('');
    } else if (user?.username) {
      setUsername(user.username);
    }
    if (user?.avatar) {
      setAvatar(user.avatar);
    }
  }, [user]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(val);
    setIsAvailable(null);
    setError('');
  };

  // Debounced real-time username availability check
  useEffect(() => {
    if (username.length < 3) {
      setIsChecking(false);
      setIsAvailable(null);
      setError('');
      return;
    }

    let ignore = false;
    setIsChecking(true);
    setIsAvailable(null);
    setError('');
    const timeout = setTimeout(async () => {
      try {
        const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
        const { data } = await axios.get(`/api/auth/check-username?username=${encodeURIComponent(username)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (ignore) return;
        setIsAvailable(data.available);
        if (!data.available) {
          setError('That username is already taken.');
        }
      } catch (err: any) {
        if (ignore) return;
        setIsAvailable(null);
      } finally {
        if (!ignore) setIsChecking(false);
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, [username, user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('image', file);

      const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
      const headers = {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      // Uploads to Cloudinary in the "avatars" folder
      const { data } = await axios.post('/api/users/upload?folder=avatars', formData, { headers });
      if (data?.imageUrl) {
        setAvatar(data.imageUrl);
      }
    } catch (err: any) {
      console.warn('Avatar upload failed, falling back to local file reader:', err);
      // Fallback: convert to base64 Data URL so user is never blocked
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    
    // Call the update profile thunk with username, name, bio, and avatar
    const payload: { username: string; name?: string; bio?: string; avatar?: string } = {
      username: username.trim(),
    };
    if (name.trim()) {
      payload.name = name.trim();
    }
    if (bio.trim()) {
      payload.bio = bio.trim();
    }
    if (avatar) {
      payload.avatar = avatar;
    }

    const success = await updateUserProfile(payload);
    
    if (success) {
      // Proceed to optional personalization or the original destination
      const from = (location.state as any)?.from?.pathname;
      const destination = from && from !== '/onboarding/username' ? from : '/onboarding/interests';
      navigate(destination, { replace: true });
    } else {
      setError('Username may already be taken or invalid. Please choose another.');
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };
  const pageTransition = { type: "tween", ease: "anticipate", duration: 0.5 };

  return (
    <div className="min-h-screen bg-light-100 dark:bg-dark-100 flex flex-col relative overflow-hidden text-dark-100 dark:text-light-100 font-serif items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-light-100/80 dark:to-dark-100/80 z-0 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-lg my-8">
        <motion.div
          initial="initial" 
          animate="in" 
          exit="out" 
          variants={pageVariants} 
          transition={pageTransition}
          className="bg-white dark:bg-dark-200 p-8 sm:p-10 rounded-3xl shadow-2xl border border-light-300 dark:border-dark-300"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight mb-2">
              Set up your profile
            </h1>
            <p className="text-base text-dark-400 dark:text-light-400">
              Complete your profile details to start reading and publishing on KBlog.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ── Profile Picture Upload ── */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-light-300 dark:border-dark-300 bg-light-200 dark:bg-dark-300 flex items-center justify-center shadow-lg relative">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon size={54} className="text-dark-300 dark:text-light-400" />
                  )}

                  {/* Uploading overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-dark-100/60 flex items-center justify-center backdrop-blur-xs">
                      <Loader2 size={28} className="animate-spin text-white" />
                    </div>
                  )}
                </div>

                {/* Upload Trigger Button */}
                <label 
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white p-2.5 rounded-full shadow-md cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                  title="Upload profile picture"
                >
                  <Camera size={18} />
                  <input 
                    id="avatar-upload"
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    disabled={isUploading} 
                    onChange={handleImageUpload} 
                  />
                </label>

                {/* Clear avatar button */}
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    className="absolute top-0 right-0 bg-dark-100/70 hover:bg-red-600 text-white p-1 rounded-full text-xs shadow-md transition-colors"
                    title="Remove picture"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <label 
                htmlFor="avatar-upload"
                className="mt-3 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
              >
                {isUploading ? 'Uploading to Cloudinary...' : avatar ? 'Change profile picture' : 'Upload profile picture (optional)'}
              </label>
            </div>

            {/* ── Full Name Input ── */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400 dark:text-light-400 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input py-3 text-base w-full font-medium"
                placeholder="Your full name"
                maxLength={50}
              />
            </div>

            {/* ── Username Input ── */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400 dark:text-light-400 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-dark-400 font-medium text-lg">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  className={`input pl-10 pr-10 py-3.5 text-lg w-full font-medium ${
                    error ? 'border-red-500 ring-1 ring-red-500' : isAvailable === true ? 'border-emerald-500 ring-1 ring-emerald-500' : ''
                  }`}
                  placeholder="username"
                  autoFocus
                  maxLength={30}
                />
                <div className="absolute right-3 flex items-center">
                  {isChecking ? (
                    <Loader2 size={18} className="animate-spin text-dark-400 dark:text-light-400" />
                  ) : isAvailable === true ? (
                    <Check size={20} className="text-emerald-500" />
                  ) : isAvailable === false ? (
                    <X size={20} className="text-red-500" />
                  ) : null}
                </div>
              </div>
              {isAvailable === true && (
                <p className="mt-2 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1">
                  <Check size={12} />
                  This username is available
                </p>
              )}
              {error && <p className="mt-2 text-red-500 text-xs font-medium">{error}</p>}
              {!error && isAvailable !== true && (
                <p className="mt-2 text-xs text-dark-400 dark:text-light-400">
                  Letters, numbers, and underscores only (min 3 chars). This will be your permanent handle.
                </p>
              )}
            </div>

            {/* ── Short Bio Input ── */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400 dark:text-light-400 mb-2">
                Bio <span className="text-dark-400 dark:text-light-400 text-[11px] font-normal">(Optional)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input py-2.5 px-3.5 text-sm w-full font-normal resize-none"
                placeholder="Tell readers a bit about yourself..."
                rows={2}
                maxLength={160}
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading || isUploading || isChecking || username.length < 3 || isAvailable !== true}
              className="w-full rounded-full bg-dark-100 dark:bg-light-100 text-light-100 dark:text-dark-100 py-3.5 font-medium text-base hover:scale-[1.02] transition-transform duration-300 shadow-xl disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Saving profile...</span>
                </>
              ) : (
                <span>Complete Profile & Continue</span>
              )}
            </button>

            {/* Sign out fallback */}
            <div className="pt-3 text-center border-t border-light-300/80 dark:border-dark-300/80">
              <button
                type="button"
                onClick={logoutUser}
                className="text-xs text-dark-400 dark:text-light-400 hover:text-red-500 transition-colors inline-flex items-center gap-1.5"
              >
                <LogOut size={13} />
                <span>Signed in as {user?.email || 'user'} · Sign out</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default UsernameSetupPage;
