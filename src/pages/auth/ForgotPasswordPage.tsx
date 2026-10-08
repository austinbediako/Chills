import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import Logo from '../../components/common/Logo';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { data } = await axios.post('/api/auth/forgotpassword', { email });
      setMessage(data.data || 'Email sent successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
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
              Reset your <br /><span className="italic text-primary-300">password.</span>
            </h2>
            <p className="text-light-300/80 font-light text-lg max-w-md">
              Don't worry, we'll help you get back to writing in no time.
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
              Forgot Password
            </h1>
            <p className="mt-2 text-dark-400 dark:text-light-400">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
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

            {message && (
              <div className="p-3.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/60 text-green-700 dark:text-green-400 text-sm flex items-start gap-3 shadow-sm">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />
                <div className="flex-1">
                  <p className="font-bold text-xs uppercase tracking-wider text-green-800 dark:text-green-300">Success</p>
                  <p className="text-sm mt-0.5 leading-snug">{message}</p>
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-dark-100 dark:text-light-100">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10 w-full"
                  placeholder="Enter your email"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-light-400" size={18} />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary w-full mt-4"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            
            <div className="mt-8 text-center text-sm text-dark-400 dark:text-light-400">
              Remembered your password?{' '}
              <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                Sign in
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
