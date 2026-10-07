import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, Edit3, Trash2, CheckCircle, Navigation } from 'lucide-react';
import { useSubmissions } from '../hooks/useSubmissions';
import { useAuth } from '../hooks/useAuth';

const MyStoriesPage: React.FC = () => {
  const { user } = useAuth();
  const { submissions, loading, getSubmissions, deleteSubmission } = useSubmissions();
  const [activeTab, setActiveTab] = useState<'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED'>('DRAFT');

  useEffect(() => {
    // Fetch user's submissions
    getSubmissions({ author: user?._id });
  }, [user]);

  // Filter based on active tab
  const filteredStories = submissions.filter(sub => sub.status === activeTab);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this story? This cannot be undone.")) {
      await deleteSubmission(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'DRAFT': return <span className="bg-light-300 dark:bg-dark-300 text-dark-400 dark:text-light-300 px-2 py-0.5 rounded text-xs font-medium">Draft</span>;
      case 'PENDING_REVIEW': return <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded text-xs font-medium">In Review</span>;
      case 'PUBLISHED': return <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded text-xs font-medium">Published</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading text-dark-100 dark:text-light-100 tracking-tight">
            Your Stories
          </h1>
        </div>
        <Link to="/write" className="btn btn-primary rounded-full px-6 py-2.5 font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center w-fit">
          <Edit3 size={18} className="mr-2" />
          Write a story
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex space-x-8 border-b border-light-300 dark:border-dark-300 mb-8 overflow-x-auto">
        {[
          { id: 'DRAFT', label: 'Drafts' },
          { id: 'PENDING_REVIEW', label: 'Pending Review' },
          { id: 'PUBLISHED', label: 'Published' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-dark-100 dark:text-light-100'
                : 'text-dark-400 dark:text-light-400 hover:text-dark-200 dark:hover:text-light-200'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-dark-100 dark:bg-light-100"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading && submissions.length === 0 ? (
          <div className="flex flex-col space-y-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col sm:flex-row gap-4 border-b border-light-200 dark:border-dark-300 pb-6">
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-light-300 dark:bg-dark-300 rounded w-3/4"></div>
                  <div className="h-4 bg-light-200 dark:bg-dark-400 rounded w-full"></div>
                  <div className="h-4 bg-light-200 dark:bg-dark-400 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredStories.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filteredStories.map((story) => (
              <motion.div
                key={story._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group border-b border-light-200 dark:border-dark-300 pb-6 mb-6 last:border-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link 
                      to={story.status === 'DRAFT' ? `/write?draftId=${story._id}` : `/blog/${story.slug}`} 
                      className="block mb-2"
                    >
                      <h3 className="text-xl font-bold font-heading text-dark-100 dark:text-light-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {story.title || 'Untitled Story'}
                      </h3>
                    </Link>
                    
                    <p className="text-dark-300 dark:text-light-300 font-serif text-sm line-clamp-2 mb-3">
                      {story.abstract || 'No content provided yet.'}
                    </p>
                    
                    <div className="flex flex-wrap items-center text-xs text-dark-400 dark:text-light-400 gap-3">
                      <span>Last edited {new Date(story.updatedAt).toLocaleDateString()}</span>
                      <span className="flex items-center"><Clock size={12} className="mr-1" /> {story.readTime || '1 min read'}</span>
                      {getStatusBadge(story.status)}
                      {story.draftRef && (
                        <Link
                          to={`/write?draftId=${story.draftRef._id || story.draftRef}`}
                          className="inline-flex items-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit3 size={11} className="mr-1" /> Draft revision available
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {story.status === 'PUBLISHED' ? (
                      <Link to={`/blog/${story.slug}`} className="p-2 text-dark-400 hover:text-primary-600 bg-light-100 hover:bg-primary-50 dark:bg-dark-200 dark:hover:bg-primary-900/20 rounded-lg transition-colors" title="View story">
                        <Navigation size={18} />
                      </Link>
                    ) : (
                      <Link to={`/write?draftId=${story._id}`} className="p-2 text-dark-400 hover:text-primary-600 bg-light-100 hover:bg-primary-50 dark:bg-dark-200 dark:hover:bg-primary-900/20 rounded-lg transition-colors" title="Edit story">
                        <Edit3 size={18} />
                      </Link>
                    )}
                    <button 
                      onClick={() => handleDelete(story._id)}
                      className="p-2 text-dark-400 hover:text-red-600 bg-light-100 hover:bg-red-50 dark:bg-dark-200 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete story"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-32 h-32 mb-6 bg-light-200 dark:bg-dark-200 rounded-full flex items-center justify-center border-4 border-light-100 dark:border-dark-100 shadow-inner">
              {activeTab === 'DRAFT' ? <FileText size={48} className="text-dark-300 dark:text-light-400" /> : 
               activeTab === 'PENDING_REVIEW' ? <Clock size={48} className="text-dark-300 dark:text-light-400" /> : 
               <CheckCircle size={48} className="text-dark-300 dark:text-light-400" />}
            </div>
            <h3 className="text-xl font-bold font-heading text-dark-100 dark:text-light-100 mb-2">
              {activeTab === 'DRAFT' ? "You have no drafts" : 
               activeTab === 'PENDING_REVIEW' ? "No stories in review" : 
               "You haven't published yet"}
            </h3>
            <p className="text-dark-400 dark:text-light-400 mb-8 max-w-sm mx-auto">
              {activeTab === 'DRAFT' ? "Write a story that matters. Drafts are saved automatically as you write." : 
               activeTab === 'PENDING_REVIEW' ? "Stories submitted for editorial review will appear here while you wait." : 
               "Once your stories are approved and published, they will be listed here for the world to see."}
            </p>
            {activeTab === 'DRAFT' && (
              <Link to="/write" className="btn btn-primary rounded-full px-6 py-2.5 font-bold shadow-md hover:-translate-y-0.5 transition-transform">
                Start writing
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyStoriesPage;
