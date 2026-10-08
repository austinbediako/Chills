import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

const PublicHomePage: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex flex-col justify-center items-center px-4 overflow-hidden pt-24 pb-20">
      
      {/* Grid Backdrop */}
      <div className="grid-backdrop text-dark-500 dark:text-light-500" aria-hidden="true">
        <div className="grid-backdrop__cols container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid-backdrop__col"></div>
          <div className="grid-backdrop__col"></div>
          <div className="grid-backdrop__col"></div>
          <div className="grid-backdrop__col"></div>
          <div className="grid-backdrop__col"></div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <h1 className="text-[12vw] sm:text-[10vw] md:text-[8vw] lg:text-[7vw] leading-[0.9] font-heading tracking-[-0.04em] text-dark-100 dark:text-light-100 mb-8">
            Write with <br />
            <span className="italic font-light text-primary-600 dark:text-primary-400">clarity & purpose.</span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="max-w-2xl mx-auto text-lg md:text-xl lg:text-2xl text-dark-400 dark:text-light-400 font-light mb-12 tracking-tight"
          >
            KBlog is the modern platform for brilliant writing, designed for independent thinkers, creators, and publishers.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/auth/signup" className="rounded-full bg-dark-100 dark:bg-light-100 text-light-100 dark:text-dark-100 px-8 py-4 font-medium text-lg hover:scale-105 transition-transform duration-300 shadow-xl">
              Start writing today
            </Link>
            <Link to="/about" className="rounded-full border border-dark-200 dark:border-light-200 bg-light-100/50 dark:bg-dark-100/50 backdrop-blur-md text-dark-100 dark:text-light-100 px-8 py-4 font-medium text-lg hover:bg-dark-100 hover:text-light-100 dark:hover:bg-light-100 dark:hover:text-dark-100 transition-colors duration-300">
              Read our story
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Featured visual element - Studio aesthetic vibe */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl mx-auto mt-24 relative z-10"
      >
        <div className="aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden relative shadow-2xl ring-1 ring-dark-200/5 dark:ring-light-200/5 bg-white dark:bg-dark-200">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/10 to-secondary-900/10 dark:from-primary-900/30 dark:to-secondary-900/30"></div>
          
          {/* Subtle UI mockup overlay */}
          <div className="absolute inset-x-8 -bottom-16 top-16 rounded-t-xl bg-light-100 dark:bg-dark-100 shadow-2xl border border-light-300 dark:border-dark-300 overflow-hidden">
            <div className="h-10 border-b border-light-300 dark:border-dark-300 flex items-center px-4 gap-2 bg-light-200 dark:bg-dark-200">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="p-8">
              <div className="h-8 w-3/4 bg-light-300 dark:bg-dark-300 rounded mb-4"></div>
              <div className="h-4 w-full bg-light-200 dark:bg-dark-400 rounded mb-2"></div>
              <div className="h-4 w-5/6 bg-light-200 dark:bg-dark-400 rounded mb-2"></div>
              <div className="h-4 w-4/6 bg-light-200 dark:bg-dark-400 rounded"></div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
          >
            <div className="bg-dark-100 dark:bg-light-100 text-light-100 dark:text-dark-100 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 border border-dark-200/20 dark:border-light-200/20">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-500 text-white p-2 rounded-xl">
                    <Download size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold font-heading text-sm">Install KBlog App</h4>
                    <p className="text-xs opacity-80">Read and write offline, directly from your home screen.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowInstallBanner(false)}
                  className="p-1 opacity-50 hover:opacity-100 transition-opacity"
                  aria-label="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
              <button 
                onClick={handleInstallClick}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-xl font-bold text-sm transition-colors shadow-sm"
              >
                Download App
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
};

export default PublicHomePage;
