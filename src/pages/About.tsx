import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AboutPage: React.FC = () => {
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
          className="mb-32"
        >
          <div className="max-w-4xl">
            <h1 className="text-[10vw] md:text-[8vw] leading-[0.9] font-heading tracking-tight text-dark-100 dark:text-light-100 mb-8">
              Our <span className="italic font-light text-primary-600 dark:text-primary-400">story.</span>
            </h1>
            <p className="text-xl md:text-3xl text-dark-400 dark:text-light-400 font-light tracking-tight max-w-3xl leading-relaxed">
              We started KBlog to elevate digital publishing. No noise. No algorithm feeds. Just intentional writing and thoughtful readers.
            </p>
          </div>
        </motion.div>

        {/* Story Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8 mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="aspect-[4/5] bg-dark-200 rounded-2xl overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-primary-900/20 mix-blend-multiply z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1505682634904-d7c8d95cdc50?q=80&w=2940&auto=format&fit=crop" 
              alt="Editorial desk" 
              className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 opacity-80"
            />
          </motion.div>
          
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-3xl md:text-5xl font-heading font-bold mb-8 text-dark-100 dark:text-light-100 tracking-tight">
                Design <br/><span className="italic font-light text-primary-500">dictates thought.</span>
              </h2>
              <div className="space-y-6 text-lg text-dark-400 dark:text-light-400 font-light">
                <p>
                  We believe that the medium shapes the message. When you write on a cluttered platform full of ads and distractions, your writing suffers. When you write on a blank, beautifully typeset canvas, your ideas breathe.
                </p>
                <p>
                  KBlog is an engineering and design studio building the finest tools for independent thinkers, essayists, and publishers. We strip away the unnecessary so you can focus on what matters: the words.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="border-y border-light-300 dark:border-dark-300 py-16 mb-32"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "10M+", label: "Monthly Readers" },
              { number: "150+", label: "Countries Served" },
              { number: "500K+", label: "Active Writers" },
              { number: "99.9%", label: "Uptime Reliability" },
            ].map((stat, index) => (
              <div key={stat.label} className="text-center md:text-left">
                <div className="text-4xl md:text-5xl font-heading font-bold text-dark-100 dark:text-light-100 mb-2 tracking-tighter">
                  {stat.number}
                </div>
                <div className="text-dark-400 dark:text-light-400 text-xs md:text-sm uppercase tracking-widest font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto pb-16"
        >
          <h2 className="text-4xl md:text-6xl font-heading tracking-tight mb-8">
            Join the <span className="italic font-light text-primary-500">movement.</span>
          </h2>
          <Link to="/auth/signup" className="inline-block rounded-full bg-dark-100 dark:bg-light-100 text-light-100 dark:text-dark-100 px-8 py-4 font-medium text-lg hover:scale-105 transition-transform duration-300 shadow-xl">
            Start writing today
          </Link>
        </motion.div>

      </div>
    </div>
  );
};

export default AboutPage;