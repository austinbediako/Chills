import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    
    // Validate name
    if (!formData.name.trim()) {
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
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

  // Generate a pending username to flag that it hasn't been properly set yet
  const generatedUsername = `pending-${Math.random().toString(36).substring(2, 15)}`;

  const success = await registerUser(
    formData.name,
    formData.email,
    generatedUsername,
    formData.password,
    'other' // Default gender
  );

  if (success) {
    navigate('/onboarding');
  }
};

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name field */}
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
            placeholder="Create a password"
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
      
      {/* Confirm Password field */}
      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-dark-100 dark:text-light-100">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`input pl-10 w-full ${errors.confirmPassword ? 'border-red-500 dark:border-red-500' : ''}`}
            placeholder="Confirm your password"
          />
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-light-400" size={18} />
        </div>
        {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
      </div>


      
      {/* Terms and conditions */}
      <div className="flex items-start">
        <input
          type="checkbox"
          id="terms"
          className="mt-1 h-4 w-4 rounded border-light-400 text-primary-600 focus:ring-primary-500 dark:border-dark-300 dark:bg-dark-200"
          required
        />
        <label htmlFor="terms" className="ml-2 text-sm text-dark-300 dark:text-light-300">
          I agree to the <a href="#" className="text-primary-600 hover:underline dark:text-primary-400">Terms of Service</a> and <a href="#" className="text-primary-600 hover:underline dark:text-primary-400">Privacy Policy</a>
        </label>
      </div>
      
      {/* Submit button */}
      <button 
        type="submit" 
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
      
      {/* Sign in link */}
      <div className="text-center text-sm text-dark-400 dark:text-light-400">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
          Sign in
        </Link>
      </div>
    </form>
  );
};

export default RegisterForm;