import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Lock, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Logo from '../../components/common/Logo';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { resettoken } = useParams<{ resettoken: string }>();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await axios.put(`/api/auth/resetpassword/${resettoken}`, { password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex w-full min-h-screen">
      {/* Left panel - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-dark-200 overflow-hidden">
        <div className="absolute inset-0 bg-primary-900/20 mix-blend-multiply z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1455390582262-044cdead2708?q=80&w=2940&auto=format&fit=crop" 
          alt="Writing aesthetic" 
          className="absolute inset-0 w-full h-full object-cover opacity-70 grayscale contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-100/80 to-transparent z-10"></div>
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-12">
          <div>
            <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
              <Logo />
            </Link>
          </div>
          <div>
            <h2 className="text-4xl lg:text-5xl font-heading text-light-100 tracking-tight leading-tight mb-4">
              Secure your <br /><span className="italic text-primary-300">account.</span>
            </h2>
            <p className="text-light-300/80 font-light text-lg max-w-md">
              Choose a strong password to keep your ideas safe.
            </p>
          </div>
        </div>
      </div>
      
      {/* Right panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 xl:p-24 bg-light-100 dark:bg-dark-100 relative">
        <div className="lg:hidden absolute top-8 left-8">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="w-full max-w-md pt-12 lg:pt-0"
        >
          <div className="mb-10">
            <h1 className="text-3xl font-heading font-bold text-dark-100 dark:text-light-100 tracking-tight">
              Reset Password
            </h1>
            <p className="mt-2 text-dark-400 dark:text-light-400">
              Enter your new password below.
            </p>
          </div>
          
          {success ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-dark-100 dark:text-light-100 mb-2">Password Reset Successfully</h3>
              <p className="text-dark-400 dark:text-light-400 mb-6">
                Redirecting you to login page...
              </p>
              <Link to="/auth/login" className="btn btn-primary w-full inline-block">
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-sm flex items-start gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                  <div className="flex-1">
                    <p className="font-bold text-xs uppercase tracking-wider text-red-800 dark:text-red-300">Error</p>
                    <p className="text-sm mt-0.5 leading-snug">{error}</p>
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-dark-100 dark:text-light-100">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10 pr-10 w-full"
                    placeholder="Enter your new password"
                    required
                    minLength={6}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-light-400" size={18} />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 dark:text-light-400 dark:hover:text-light-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-dark-100 dark:text-light-100">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input pl-10 pr-10 w-full"
                    placeholder="Confirm your new password"
                    required
                    minLength={6}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-light-400" size={18} />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary w-full mt-4"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
