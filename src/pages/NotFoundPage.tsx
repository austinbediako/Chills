import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-16rem)] flex-col items-center justify-center py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 text-9xl font-bold font-heading text-dark-100 dark:text-light-100 tracking-tight">
          404
        </div>
        
        <h1 className="mb-4 text-3xl font-bold font-heading text-dark-100 dark:text-light-100">
          Page Not Found
        </h1>
        
        <p className="mb-8 max-w-md text-dark-300 dark:text-light-300">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/" className="btn btn-primary flex items-center">
            <Home size={18} className="mr-2" />
            Back to Home
          </Link>
          
          <Link to="/blog" className="btn btn-outline flex items-center">
            <ArrowLeft size={18} className="mr-2" />
            Go to Blog
          </Link>
        </div>
      </motion.div>
      
      <div className="mt-12 w-full max-w-md">
        <h2 className="mb-4 text-xl font-bold font-heading text-dark-100 dark:text-light-100">
          Search for content
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search articles, categories, tags..."
            className="input pl-10 w-full"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-light-400" size={18} />
        </div>
      </div>
      
      <div className="mt-12">
        <h2 className="mb-4 text-xl font-bold font-heading text-dark-100 dark:text-light-100">
          Popular Categories
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {['Technology', 'Development', 'Design', 'Business', 'Lifestyle'].map((category) => (
            <Link
              key={category}
              to={`/explore?category=${encodeURIComponent(category)}`}
              className="rounded-full bg-light-200 px-4 py-2 text-dark-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;