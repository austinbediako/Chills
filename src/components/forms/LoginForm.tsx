import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, loading, error: authError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    if (serverError) {
      setServerError(null);
    }
    
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setServerError(null);
    const success = await loginUser(formData.email, formData.password);
    
    if (success) {
      const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
      if (storedUser?.username && storedUser.username.startsWith('pending-')) {
        navigate('/onboarding/username');
        return;
      }
      // Redirect to the page the user was trying to access, or to home
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from);
    } else {
      setServerError(authError || 'Invalid email or password. Please check your credentials and try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const activeError = serverError || authError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Prominent Error Alert */}
      {activeError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-sm flex items-start gap-3 shadow-sm animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-bold text-xs uppercase tracking-wider text-red-800 dark:text-red-300">Sign In Failed</p>
            <p className="text-sm mt-0.5 leading-snug">{activeError}</p>
          </div>
        </div>
      )}
      {/* Email field */}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-dark-100 dark:text-light-100">
          Email Address
        </label>
        <div className="relative">
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`input pl-10 w-full ${errors.email ? 'border-red-500 dark:border-red-500' : ''}`}
            placeholder="Enter your email"
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-light-400" size={18} />
        </div>
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
      </div>
      
      {/* Password field */}
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-dark-100 dark:text-light-100">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`input pl-10 pr-10 w-full ${errors.password ? 'border-red-500 dark:border-red-500' : ''}`}
            placeholder="Enter your password"
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
        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
      </div>
      
      {/* Remember me / Forgot password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="remember"
            className="h-4 w-4 rounded border-light-400 text-primary-600 focus:ring-primary-500 dark:border-dark-300 dark:bg-dark-200"
          />
          <label htmlFor="remember" className="ml-2 text-sm text-dark-300 dark:text-light-300">
            Remember me
          </label>
        </div>
        <Link to="/auth/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
          Forgot password?
        </Link>
      </div>
      
      {/* Submit button */}
      <button 
        type="submit" 
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      
      {/* Sign up link */}
      <div className="text-center text-sm text-dark-400 dark:text-light-400">
        Don't have an account?{' '}
        <Link to="/auth/signup" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
          Sign up
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;