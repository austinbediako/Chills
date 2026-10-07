import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Clock, Globe, MessageSquare } from 'lucide-react';

const ContactPage: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-16rem)] flex-col items-center justify-center py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl px-4"
      >
        {/* Hero Section */}
        <div className="mb-12 space-y-6">
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="mb-8 text-5xl md:text-7xl font-bold font-heading text-dark-100 dark:text-light-100 tracking-tight"
          >
            Get in Touch
          </motion.div>
          
          <p className="text-xl text-dark-400 dark:text-light-400 max-w-3xl mx-auto font-serif leading-relaxed">
            Reach out to the KBlog editorial and engineering teams.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-8 md:p-12 text-left rounded-none border border-light-300 dark:border-dark-300 bg-white dark:bg-dark-200"
          >
            <h2 className="text-3xl font-bold mb-6">Send a Message</h2>
            <form className="space-y-6">
              <div>
                <label className="block text-dark-400 dark:text-light-400 mb-2">Your Name</label>
                <input
                  type="text"
                  className="input w-full bg-light-100 dark:bg-dark-200"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-dark-400 dark:text-light-400 mb-2">Email</label>
                <input
                  type="email"
                  className="input w-full bg-light-100 dark:bg-dark-200"
                  placeholder="hello@example.com"
                />
              </div>
              <div>
                <label className="block text-dark-400 dark:text-light-400 mb-2">Message</label>
                <textarea
                  className="input w-full h-32 bg-light-100 dark:bg-dark-200"
                  placeholder="Type your message here..."
                />
              </div>
              <button className="btn btn-primary w-full flex items-center justify-center">
                <Send size={20} className="mr-2" />
                Send Message
              </button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {/* Contact Methods */}
            <div className="card p-6">
              <div className="space-y-6">
                {[
                  { icon: <Mail size={32} />, title: "Email", value: "hello@kblog.io", link: "mailto:hello@kblog.io" },
                  { icon: <Phone size={32} />, title: "Phone", value: "+1 (555) 123-4567", link: "tel:+15551234567" },
                  { icon: <MapPin size={32} />, title: "HQ Location", value: "Silicon Valley, CA" },
                ].map((item) => (
                  <motion.div
                    key={item.title}
                    whileHover={{ x: 5 }}
                    className="flex items-start space-x-4 p-4 hover:bg-light-100 dark:hover:bg-dark-200 rounded-lg"
                  >
                    <div className="text-primary-600 dark:text-primary-400 mt-1">{item.icon}</div>
                    <div>
                      <h3 className="text-lg font-bold">{item.title}</h3>
                      {item.link ? (
                        <a href={item.link} className="text-dark-300 dark:text-light-300 hover:underline">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-dark-300 dark:text-light-300">{item.value}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Support Hours */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="card p-6 bg-light-200 dark:bg-dark-300 rounded-none border-l-4 border-l-primary-900 dark:border-l-primary-100"
            >
              <div className="flex items-center space-x-4">
                <Clock size={32} className="text-primary-600 dark:text-primary-400" />
                <div className="text-left">
                  <h3 className="text-lg font-bold mb-1">Support Hours</h3>
                  <p className="text-dark-300 dark:text-light-300">
                    24/7 Global Support <br />
                    Avg. Response Time: 15m
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Social Links */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="card p-6"
            >
              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-lg font-bold">Connect Socially</h3>
                <div className="flex space-x-4">
                  {['Twitter', 'LinkedIn', 'GitHub'].map((network) => (
                    <motion.a
                      key={network}
                      whileHover={{ y: -3 }}
                      className="p-2 rounded-full bg-light-200 dark:bg-dark-300 hover:bg-primary-100 dark:hover:bg-primary-900/30"
                      href="#"
                    >
                      <Globe size={20} className="text-dark-500 dark:text-light-300" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Global Presence */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-8 mb-12"
        >
          <h2 className="text-3xl font-bold mb-6">Global Presence</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {['North America', 'Europe', 'Asia-Pacific'].map((region, index) => (
              <motion.div
                key={region}
                whileHover={{ scale: 1.05 }}
                className="p-6 rounded-xl bg-light-100 dark:bg-dark-200"
              >
                <div className="text-4xl font-heading font-bold text-dark-100 dark:text-light-100 mb-4 tracking-tight">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold mb-2">{region}</h3>
                <p className="text-dark-300 dark:text-light-300">
                  {['Silicon Valley', 'London', 'Singapore'][index]}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Live Chat */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card p-8 bg-primary-900 text-white rounded-none border border-primary-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <MessageSquare size={32} />
              <div>
                <h3 className="text-xl font-bold">Instant Support</h3>
                <p>Connect with our AI assistant</p>
              </div>
            </div>
            <button className="btn btn-light flex items-center">
              Start Chat <Send size={16} className="ml-2" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ContactPage;