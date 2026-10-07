import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const MembershipPage: React.FC = () => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden pt-24 pb-32">
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

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-24 text-center max-w-4xl mx-auto"
        >
          <h1 className="text-[10vw] md:text-[8vw] leading-[0.9] font-heading tracking-tight text-dark-100 dark:text-light-100 mb-8">
            Go <span className="italic font-light text-primary-600 dark:text-primary-400">pro.</span>
          </h1>
          <p className="text-xl md:text-3xl text-dark-400 dark:text-light-400 font-light tracking-tight max-w-3xl mx-auto leading-relaxed">
            Support independent writing and get access to exclusive features, advanced analytics, and priority support.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-32">
          
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="p-8 md:p-12 rounded-3xl border border-light-300 dark:border-dark-300 bg-light-100/50 dark:bg-dark-100/50 backdrop-blur-md flex flex-col"
          >
            <h3 className="text-2xl font-heading font-bold mb-2 text-dark-100 dark:text-light-100">Standard</h3>
            <p className="text-dark-400 dark:text-light-400 mb-8">Everything you need to start writing.</p>
            <div className="text-5xl font-heading font-bold mb-8 text-dark-100 dark:text-light-100">$0 <span className="text-lg font-normal text-dark-300 dark:text-light-400">/ forever</span></div>
            
            <ul className="space-y-4 mb-12 flex-1">
              {[
                "Unlimited publishing",
                "Basic reading analytics",
                "Custom domain linking",
                "Standard support"
              ].map((feature, i) => (
                <li key={i} className="flex items-center text-dark-400 dark:text-light-400">
                  <Check size={18} className="mr-3 text-dark-300 dark:text-light-500" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <Link to="/auth/signup" className="block text-center w-full rounded-full border border-dark-200 dark:border-light-200 bg-transparent text-dark-100 dark:text-light-100 px-8 py-4 font-medium hover:bg-dark-100 hover:text-light-100 dark:hover:bg-light-100 dark:hover:text-dark-100 transition-colors duration-300">
              Get Started
            </Link>
          </motion.div>

          {/* Pro Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="p-8 md:p-12 rounded-3xl bg-dark-100 dark:bg-light-100 text-light-100 dark:text-dark-100 relative shadow-2xl flex flex-col"
          >
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
              Recommended
            </div>
            <h3 className="text-2xl font-heading font-bold mb-2">Pro</h3>
            <p className="text-light-300 dark:text-dark-400 mb-8">For serious publishers and creators.</p>
            <div className="text-5xl font-heading font-bold mb-8">$12 <span className="text-lg font-normal text-light-400 dark:text-dark-300">/ month</span></div>
            
            <ul className="space-y-4 mb-12 flex-1">
              {[
                "Everything in Standard",
                "Advanced audience analytics",
                "Newsletter delivery",
                "Paywall monetization",
                "Priority 24/7 support"
              ].map((feature, i) => (
                <li key={i} className="flex items-center">
                  <Check size={18} className="mr-3 text-primary-400 dark:text-primary-600" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <Link to="/auth/signup" className="block text-center w-full rounded-full bg-light-100 dark:bg-dark-100 text-dark-100 dark:text-light-100 px-8 py-4 font-medium hover:scale-105 transition-transform duration-300">
              Upgrade to Pro
            </Link>
          </motion.div>

        </div>

        {/* FAQ Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto border-t border-light-300 dark:border-dark-300 pt-16 pb-16"
        >
          <h2 className="text-3xl font-heading font-bold mb-12 text-center text-dark-100 dark:text-light-100 tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h4 className="text-xl font-medium mb-2 text-dark-100 dark:text-light-100">Can I switch plans later?</h4>
              <p className="text-dark-400 dark:text-light-400 font-light">Absolutely. You can upgrade or downgrade your plan at any time. Prorated charges will be applied automatically.</p>
            </div>
            <div>
              <h4 className="text-xl font-medium mb-2 text-dark-100 dark:text-light-100">Do you take a cut of my monetization?</h4>
              <p className="text-dark-400 dark:text-light-400 font-light">We take a flat 5% fee on Pro tier memberships to cover payment processing and infrastructure. The rest is yours.</p>
            </div>
            <div>
              <h4 className="text-xl font-medium mb-2 text-dark-100 dark:text-light-100">What happens to my content if I leave?</h4>
              <p className="text-dark-400 dark:text-light-400 font-light">You own your content. You can export all your posts, subscriber lists, and data at any time with one click.</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default MembershipPage;
