import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import RegisterForm from '../../components/forms/RegisterForm';
import Logo from '../../components/common/Logo';

const RegisterPage: React.FC = () => {
  return (
    <div className="flex w-full min-h-screen">
      {/* Left panel - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-dark-200 overflow-hidden">
        <div className="absolute inset-0 bg-secondary-900/20 mix-blend-multiply z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2940&auto=format&fit=crop" 
          alt="Vintage typewriter" 
          className="absolute inset-0 w-full h-full object-cover opacity-80 grayscale contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-100/90 via-dark-100/20 to-transparent z-10"></div>
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-12">
          <div>
            <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
              <Logo />
            </Link>
          </div>
          <div>
            <h2 className="text-4xl lg:text-5xl font-heading text-light-100 tracking-tight leading-tight mb-4">
              Your voice, <br /><span className="italic text-secondary-300">amplified.</span>
            </h2>
            <p className="text-light-300/80 font-light text-lg max-w-md">
              Start sharing your insights with an audience that values substance over noise.
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
              Create an account
            </h1>
            <p className="mt-2 text-dark-400 dark:text-light-400">
              Join KBlog and start writing today.
            </p>
          </div>
          
          <RegisterForm />
          
          <p className="mt-8 text-center text-sm text-dark-400 dark:text-light-400">
            Already have an account?{' '}
            <Link to="/auth/login" className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;