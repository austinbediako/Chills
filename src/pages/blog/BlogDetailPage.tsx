import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Heart, Bookmark, ChevronLeft, CheckCircle, XCircle, Repeat, CornerDownRight, Edit3 } from 'lucide-react';
import axios from 'axios';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useComments } from '../../hooks/useComments';
import { useAuth } from '../../hooks/useAuth';
import CommentForm from '../../components/forms/CommentForm';
import BookmarkDropdown from '../../components/common/BookmarkDropdown';
import '../../styles/article.css';

const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { submission, loading, error, getSubmissionById, interactSubmission, reviewSubmission } = useSubmissions();
  const { comments, getComments } = useComments();
  const { user, isAuthenticated } = useAuth();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [repostsCount, setRepostsCount] = useState(0);
  const [replyInputOpen, setReplyInputOpen] = useState<{ [commentId: string]: boolean }>({});
  const [replyText, setReplyText] = useState<{ [commentId: string]: string }>({});

  useEffect(() => {
    if (slug) {
      getSubmissionById(slug);
    }
  }, [slug, getSubmissionById]);

  useEffect(() => {
    if (submission) {
      getComments(submission._id);
      if (submission.repostsCount !== undefined) {
        setRepostsCount(submission.repostsCount);
      }
      if (submission.isLiked !== undefined) {
        setIsLiked(Boolean(submission.isLiked));
      } else if (user?._id && Array.isArray(submission.likes)) {
        setIsLiked(submission.likes.some((id: any) => String(id) === String(user._id)));
      }
      if (submission.isReposted !== undefined) {
        setIsReposted(Boolean(submission.isReposted));
      } else if (user?._id && Array.isArray(submission.reposts)) {
        setIsReposted(submission.reposts.some((id: any) => String(id) === String(user._id)));
      }
    }
  }, [submission, getComments, user?._id]);

  // Auto-scroll to comments when URL contains #comments or #discussion
  useEffect(() => {
    if (location.hash === '#comments' || location.hash === '#discussion') {
      const timer = setTimeout(() => {
        const commentsEl = document.getElementById('comments');
        if (commentsEl) {
          commentsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const textarea = commentsEl.querySelector('textarea');
          if (textarea) {
            textarea.focus();
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location.hash, submission, loading]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    
    if (submission) {
      await interactSubmission(submission._id, 'LIKE');
      setIsLiked(!isLiked); // Optimistic UI toggle, actual count is handled in redux
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    
    if (submission) {
      await interactSubmission(submission._id, 'BOOKMARK');
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleRepost = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    if (submission) {
      try {
        const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
        const res = await axios.post(
          `/api/submissions/${submission._id}/repost`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsReposted(Boolean(res.data.isReposted));
        setRepostsCount(res.data.repostsCount ?? (isReposted ? Math.max(0, repostsCount - 1) : repostsCount + 1));
      } catch (err) {
        console.error('Error reposting story:', err);
      }
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    try {
      const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
      await axios.post(`/api/comments/${commentId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (submission) {
        getComments(submission._id);
      }
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const handleSendReply = async (commentId: string) => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    const content = (replyText[commentId] || '').trim();
    if (!content) return;
    try {
      const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
      await axios.post(
        `/api/comments/${commentId}/replies`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyText((prev) => ({ ...prev, [commentId]: '' }));
      setReplyInputOpen((prev) => ({ ...prev, [commentId]: false }));
      if (submission) {
        getComments(submission._id);
      }
    } catch (err) {
      console.error('Error adding reply:', err);
    }
  };

  const handleReviewAction = async (status: string) => {
    if (submission) {
      // In a real app, you'd open a modal to get review notes
      const success = await reviewSubmission(submission._id, status, "Automated review action from UI");
      if (success) {
        getSubmissionById(slug!);
      }
    }
  };

  const isAuthor = user && submission && user._id === submission.author?._id;
  const isAdmin = user?.role === 'admin';
  const isReviewer = user?.role === 'reviewer' || isAdmin;
  const canEdit = (isAuthor && submission?.status !== 'PUBLISHED' && submission?.status !== 'PENDING_REVIEW') || isAdmin;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 mb-4">
          Error Loading Document
        </h2>
        <p className="text-dark-300 dark:text-light-300 mb-6">{error}</p>
        <Link to="/explore" className="btn btn-primary">Back to Explore</Link>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 mb-4">
          Document Not Found
        </h2>
        <p className="text-dark-300 dark:text-light-300 mb-6">
          The document you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/explore" className="btn btn-primary">Back to Explore</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6 flex items-center text-sm text-dark-400 dark:text-light-400">
        <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/explore" className="hover:text-primary-600 dark:hover:text-primary-400">Explore</Link>
        <span className="mx-2">/</span>
        <Link 
          to={`/explore?category=${encodeURIComponent(submission.category?.name || '')}`} 
          className="hover:text-primary-600 dark:hover:text-primary-400"
        >
          {submission.category?.name || 'Uncategorized'}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-dark-300 dark:text-light-300 truncate">{submission.title}</span>
      </div>

      {/* Article Header */}
      <header className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <Link
            to={`/explore?category=${encodeURIComponent(submission.category?.name || '')}`}
            className="inline-block rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 hover:bg-primary-200 transition-colors"
          >
            {submission.category?.name || 'Uncategorized'}
          </Link>
          
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
            submission.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
            submission.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
            submission.status === 'REVISIONS_REQUESTED' ? 'bg-orange-100 text-orange-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {submission.status}
          </span>
        </div>
        
        <h1 className="text-3xl font-bold font-heading sm:text-4xl md:text-5xl text-dark-100 dark:text-light-100 mb-6">
          {submission.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-dark-400 dark:text-light-400">
          <div className="flex items-center">
            <img
              src={submission.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.author?.name || 'Anonymous')}`}
              alt={submission.author?.name || 'Author'}
              className="h-10 w-10 rounded-full mr-3"
            />
            <div>
              <Link 
                to={`/authors/${submission.author?.username || 'anonymous'}`} 
                className="font-medium text-dark-100 dark:text-light-100 hover:text-primary-600 dark:hover:text-primary-400"
              >
                {submission.author?.name || 'Anonymous Author'}
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Calendar size={16} className="mr-1" />
            <span>
              {new Date(submission.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-1" />
            <span>{submission.readTime || 'No read time'}</span>
          </div>
        </div>
      </header>

      {/* Reviewer Action Panel */}
      {isReviewer && submission.status === 'PENDING_REVIEW' && (
        <div className="mb-8 p-4 border border-yellow-200 bg-yellow-50 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-700/50">
          <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-400 mb-2">Reviewer Actions</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-500 mb-4">You have permission to review this pending document.</p>
          <div className="flex gap-3">
            <button onClick={() => handleReviewAction('PUBLISHED')} className="btn bg-green-600 text-white hover:bg-green-700 flex items-center">
              <CheckCircle size={16} className="mr-2" /> Approve & Publish
            </button>
            <button onClick={() => handleReviewAction('REVISIONS_REQUESTED')} className="btn bg-orange-500 text-white hover:bg-orange-600 flex items-center">
              <Edit3 size={16} className="mr-2" /> Request Revisions
            </button>
            <button onClick={() => handleReviewAction('REJECTED')} className="btn bg-red-600 text-white hover:bg-red-700 flex items-center">
              <XCircle size={16} className="mr-2" /> Reject
            </button>
          </div>
        </div>
      )}

      {/* Featured Image */}
      <div className="mb-8 overflow-hidden rounded-xl">
        <img
          src={submission.image || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'}
          alt={submission.title}
          className="h-auto w-full object-cover"
        />
      </div>

      {/* Abstract */}
      <div className="mb-8 p-6 bg-light-200 dark:bg-dark-200 rounded-xl italic border-l-4 border-primary-500 text-dark-300 dark:text-light-300">
        <h4 className="font-bold font-heading mb-2 not-italic">Abstract</h4>
        {submission.abstract}
      </div>

      {/* Article Content — uses shared kblog-article renderer */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="kblog-article text-dark-100 dark:text-light-100 mb-8"
        dangerouslySetInnerHTML={{ __html: submission.content }}
      />

      {/* Tags */}
      <div className="mb-8">
        <h3 className="text-lg font-bold font-heading text-dark-100 dark:text-light-100 mb-3">Keywords / Tags</h3>
        <div className="flex flex-wrap gap-2">
          {submission.tags?.map((tag) => (
            <Link
              key={tag}
              to={`/explore?tag=${encodeURIComponent(tag)}`}
              className="rounded-full bg-light-200 px-3 py-1 text-sm font-medium text-dark-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Author Bio */}
      <div className="mb-12 rounded-xl bg-light-200 p-6 dark:bg-dark-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <Link to={`/authors/${submission.author?.username || 'anonymous'}`}>
              <img
                src={submission.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.author?.name || 'Anonymous')}`}
                alt={submission.author?.name || 'Author'}
                className="h-20 w-20 rounded-full mr-6 object-cover ring-2 ring-primary-500/20 hover:scale-105 transition-transform"
              />
            </Link>
            <div>
              <Link 
                to={`/authors/${submission.author?.username || 'anonymous'}`}
                className="text-xl font-bold font-heading text-dark-100 dark:text-light-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {submission.author?.name || 'Anonymous Author'}
              </Link>
              <p className="text-dark-300 dark:text-light-300 mt-1 max-w-lg font-serif text-sm">
                {submission.author?.bio || `Contributing author on KBlog.`}
              </p>
            </div>
          </div>
          <Link
            to={`/authors/${submission.author?.username || 'anonymous'}`}
            className="btn btn-outline rounded-full text-xs font-semibold px-4 py-2 self-start sm:self-auto shrink-0"
          >
            View Author Profile
          </Link>
        </div>
      </div>

      {/* Article Actions */}
      <div className="mb-12 flex flex-wrap items-center justify-between gap-4 border-y border-light-300 py-4 dark:border-dark-300">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 rounded-full px-4 py-2 ${
              isLiked ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
              : 'bg-light-200 text-dark-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400'
            }`}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{submission.likesCount || 0} Appreciations</span>
          </button>
          <button
            onClick={handleRepost}
            className={`flex items-center space-x-2 rounded-full px-4 py-2 transition-colors ${
              isReposted
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold'
                : 'bg-light-200 text-dark-500 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-emerald-950/30'
            }`}
          >
            <Repeat size={18} />
            <span>{repostsCount} Reposts</span>
          </button>
          <BookmarkDropdown
            submissionId={submission._id}
            isBookmarked={isBookmarked}
            onBookmarkChange={(next) => setIsBookmarked(next)}
            showLabel={true}
            size={18}
          />
        </div>
      </div>

      {/* Comments Section */}
      <div id="comments" className="mb-12 scroll-mt-24">
        <h2 id="discussion" className="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 mb-6">
          Discussion ({comments.length})
        </h2>
        
        {isAuthenticated ? (
          <CommentForm submissionId={submission._id} />
        ) : (
          <div className="mb-8 p-6 bg-light-200 dark:bg-dark-200 rounded-lg text-center">
            <p className="text-dark-300 dark:text-light-300 mb-4">
              Please sign in to join the discussion.
            </p>
            <Link to="/auth/login" className="btn btn-primary">Sign In</Link>
          </div>
        )}
        
        <div className="space-y-6">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment._id} className="rounded-xl bg-light-200 p-6 dark:bg-dark-200">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center">
                    <Link 
                      to={`/authors/${comment.user?.username || comment.user?._id || 'anonymous'}`}
                      className="flex items-center group"
                    >
                      <img
                        src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || 'Anonymous')}`}
                        alt={comment.user?.name || 'Comment author'}
                        className="h-10 w-10 rounded-full mr-3 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div>
                        <h4 className="font-medium text-dark-100 dark:text-light-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {comment.user?.name || 'Anonymous'}
                        </h4>
                        <p className="text-sm text-dark-400 dark:text-light-400">
                          {new Date(comment.createdAt).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
                <p className="text-dark-300 dark:text-light-300 mb-3 font-serif leading-relaxed">{comment.content}</p>

                {/* Comment Actions: Like & Reply */}
                <div className="flex items-center gap-4 text-xs text-dark-400 dark:text-light-400 pt-2 border-t border-light-300/60 dark:border-dark-300/60">
                  <button
                    onClick={() => handleLikeComment(comment._id)}
                    className={`flex items-center gap-1 hover:text-rose-500 transition-colors ${
                      Array.isArray(comment.likedBy) && comment.likedBy.some(id => String(id) === String(user?._id))
                        ? 'text-rose-500 font-bold'
                        : ''
                    }`}
                  >
                    <Heart
                      size={14}
                      fill={Array.isArray(comment.likedBy) && comment.likedBy.some(id => String(id) === String(user?._id)) ? 'currentColor' : 'none'}
                    />
                    <span>{comment.likes || 0}</span>
                  </button>

                  <button
                    onClick={() => setReplyInputOpen(prev => ({ ...prev, [comment._id]: !prev[comment._id] }))}
                    className="flex items-center gap-1 hover:text-primary-500 transition-colors"
                  >
                    <CornerDownRight size={14} />
                    <span>Reply</span>
                  </button>
                </div>

                {/* Reply Form */}
                {replyInputOpen[comment._id] && (
                  <div className="ml-6 mt-3 pl-3 border-l-2 border-primary-500/40 flex gap-2">
                    <input
                      type="text"
                      value={replyText[comment._id] || ''}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [comment._id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendReply(comment._id);
                        }
                      }}
                      placeholder={`Reply to @${comment.user?.username || 'user'}...`}
                      className="flex-1 px-3 py-1.5 text-xs rounded-full bg-light-100 dark:bg-dark-100 border border-light-300 dark:border-dark-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => handleSendReply(comment._id)}
                      disabled={!(replyText[comment._id] || '').trim()}
                      className="px-3.5 py-1 rounded-full bg-primary-600 text-white text-xs font-bold disabled:opacity-40"
                    >
                      Send
                    </button>
                  </div>
                )}

                {/* Threaded Replies */}
                {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                  <div className="ml-6 mt-3 pl-3 border-l-2 border-light-300 dark:border-dark-300 space-y-2.5">
                    {comment.replies.map((reply, rIdx) => (
                      <div key={reply._id || rIdx} className="flex gap-2.5 items-start text-xs">
                        <img
                          src={reply.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.user?.name || 'User')}`}
                          alt={reply.user?.name}
                          className="h-6 w-6 rounded-full object-cover shrink-0 mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-dark-100 dark:text-light-100">{reply.user?.name}</span>
                            <span className="text-[10px] text-dark-400 dark:text-light-400">@{reply.user?.username}</span>
                          </div>
                          <p className="text-dark-300 dark:text-light-300 font-serif mt-0.5 leading-relaxed">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-dark-300 dark:text-light-300">
                No discussion yet. Be the first to share your thoughts!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Post Navigation */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/explore"
          className="group flex items-center rounded-lg border border-light-300 p-4 transition-colors hover:border-primary-600 dark:border-dark-300 dark:hover:border-primary-400"
        >
          <ChevronLeft size={20} className="mr-2 text-dark-400 group-hover:text-primary-600 dark:text-light-400 dark:group-hover:text-primary-400" />
          <div>
            <span className="block text-sm text-dark-400 dark:text-light-400">Back to</span>
            <span className="font-medium text-dark-100 group-hover:text-primary-600 dark:text-light-100 dark:group-hover:text-primary-400">
              Explore
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default BlogDetailPage;