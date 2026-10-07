import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Facebook, Twitter } from 'lucide-react';

const AuthPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [authType, setAuthType] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    if (type === 'login' || type === 'signup') {
      setAuthType(type);
    } else {
      navigate('/auth/login');
    }
  }, [type, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
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
    
    // Validate name (only for signup)
    if (authType === 'signup' && !formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }
    
    // Validate phone (only for signup)
    if (authType === 'signup' && formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number is invalid';
      isValid = false;
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (authType === 'signup' && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Simulate authentication
      console.log('Form submitted:', formData);
      
      // Redirect to home page after successful authentication
      setTimeout(() => {
        navigate('/');
      }, 1000);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="card overflow-hidden">
          <div className="border-b border-light-300 dark:border-dark-300 bg-light-200 dark:bg-dark-300 p-8 text-center">
            <h1 className="text-2xl font-bold font-heading text-dark-100 dark:text-light-100">
              {authType === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="mt-2 text-dark-400 dark:text-light-400 font-serif">
              {authType === 'login'
                ? 'Sign in to access your account'
                : 'Join our community of writers and readers'}
            </p>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field (only for signup) */}
              {authType === 'signup' && (
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-dark-100 dark:text-light-100">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`input pl-10 w-full ${errors.name ? 'border-red-500 dark:border-red-500' : ''}`}
                      placeholder="Enter your full name"
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-light-400" size={18} />
                  </div>
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
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
              
              {/* Phone field (only for signup) */}
              {authType === 'signup' && (
                <div>
                  <label htmlFor="phone" className="mb-1 block text-sm font-medium text-dark-100 dark:text-light-100">
                    Phone Number <span className="text-dark-400 dark:text-light-400">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`input pl-10 w-full ${errors.phone ? 'border-red-500 dark:border-red-500' : ''}`}
                      placeholder="Enter your phone number"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-light-400" size={18} />
                  </div>
                  {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                </div>
              )}
              
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
                    placeholder={authType === 'login' ? 'Enter your password' : 'Create a password'}
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
              
              {/* Remember me / Forgot password (only for login) */}
              {authType === 'login' && (
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
                  <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                    Forgot password?
                  </a>
                </div>
              )}
              
              {/* Terms and conditions (only for signup) */}
              {authType === 'signup' && (
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 h-4 w-4 rounded border-light-400 text-primary-600 focus:ring-primary-500 dark:border-dark-300 dark:bg-dark-200"
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-dark-300 dark:text-light-300">
                    I agree to the <a href="#" className="text-primary-600 hover:underline dark:text-primary-400">Terms of Service</a> and <a href="#" className="text-primary-600 hover:underline dark:text-primary-400">Privacy Policy</a>
                  </label>
                </div>
              )}
              
              {/* Submit button */}
              <button type="submit" className="btn btn-primary w-full">
                {authType === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={16} className="ml-2" />
              </button>
            </form>
            
            {/* Social login options */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-light-300 dark:border-dark-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-light-100 px-2 text-dark-400 dark:bg-dark-200 dark:text-light-400">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button className="btn btn-outline flex items-center justify-center">
                  <Facebook size={18} className="mr-2 text-[#1877F2]" />
                  Facebook
                </button>
                <button className="btn btn-outline flex items-center justify-center">
                  <Twitter size={18} className="mr-2 text-[#1DA1F2]" />
                  Twitter
                </button>
              </div>
            </div>
            
            {/* Switch between login and signup */}
            <div className="mt-6 text-center text-sm text-dark-400 dark:text-light-400">
              {authType === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <Link to="/auth/signup" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;