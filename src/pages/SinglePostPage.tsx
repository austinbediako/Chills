import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, 
  User, 
  Calendar, 
  MessageSquare, 
  Heart, 
  Share2, 
  Bookmark, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Link2, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { isModifierPressed, getModifierKeyLabel } from '../hooks/useKeyboardShortcuts';

// Mock data for blog posts
const blogPosts = [
  {
    id: 1,
    title: 'The Future of Web Development in 2025',
    content: `
      <p>The landscape of web development is constantly evolving, with new technologies, frameworks, and methodologies emerging at a rapid pace. As we look ahead to 2025, several key trends are poised to reshape how we build and interact with web applications.</p>
      
      <h2>AI-Driven Development</h2>
      <p>Artificial intelligence is no longer just a buzzword—it's becoming an integral part of the development process. By 2025, we expect to see AI assistants that can:</p>
      <ul>
        <li>Generate code based on natural language descriptions</li>
        <li>Automatically detect and fix bugs</li>
        <li>Optimize performance without human intervention</li>
        <li>Create personalized user experiences based on behavior patterns</li>
      </ul>
      
      <p>These AI tools won't replace developers but will augment their capabilities, allowing them to focus on more creative and strategic aspects of web development.</p>
      
      <h2>WebAssembly Revolution</h2>
      <p>WebAssembly (Wasm) has been gaining traction, and by 2025, it will likely become a standard part of web development. This technology allows code written in languages like C++, Rust, and Go to run in the browser at near-native speed.</p>
      
      <p>The implications are profound: complex applications that once required native code can now run efficiently in the browser, opening up new possibilities for web-based gaming, video editing, 3D modeling, and more.</p>
      
      <h2>Edge Computing</h2>
      <p>The traditional client-server model is evolving with the rise of edge computing. Instead of processing data in centralized servers, computation is moving closer to the user—to the "edge" of the network.</p>
      
      <p>By 2025, we'll see more frameworks and tools designed specifically for edge computing, enabling developers to build applications that are:</p>
      <ul>
        <li>Faster, with reduced latency</li>
        <li>More resilient to network issues</li>
        <li>Better at handling real-time data processing</li>
        <li>More privacy-focused, with local data processing</li>
      </ul>
      
      <h2>No-Code and Low-Code Platforms</h2>
      <p>The democratization of web development continues with the advancement of no-code and low-code platforms. These tools allow non-developers to create web applications through visual interfaces and pre-built components.</p>
      
      <p>By 2025, these platforms will become more sophisticated, offering:</p>
      <ul>
        <li>Advanced customization options</li>
        <li>Better integration with traditional development workflows</li>
        <li>More powerful functionality without sacrificing ease of use</li>
      </ul>
      
      <p>Professional developers will increasingly use these tools to prototype quickly or handle routine aspects of development, freeing up time for more complex tasks.</p>
      
      <h2>Immersive Web Experiences</h2>
      <p>The line between web applications and native applications will continue to blur. Progressive Web Apps (PWAs) will evolve further, and new APIs will enable more immersive experiences directly in the browser.</p>
      
      <p>We can expect to see:</p>
      <ul>
        <li>More sophisticated AR/VR experiences without plugins</li>
        <li>Advanced haptic feedback support</li>
        <li>Better integration with device features</li>
        <li>Improved offline capabilities</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>The future of web development is exciting and full of possibilities. By embracing these emerging trends, developers can create more powerful, accessible, and engaging web experiences. The key will be to stay adaptable and continue learning as the technology landscape evolves.</p>
      
      <p>What trends are you most excited about? How do you see web development changing in the coming years? Share your thoughts in the comments below!</p>
    `,
    excerpt: 'Explore the latest trends and technologies shaping the future of web development.',
    category: 'Technology',
    author: {
      name: 'Alex Johnson',
      avatar: 'https://i.pravatar.cc/150?img=11',
      bio: 'Senior Web Developer with 10+ years of experience. Passionate about emerging technologies and their impact on the future of the web.',
    },
    date: 'May 15, 2025',
    readTime: '5 min read',
    comments: 24,
    likes: 156,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80',
    slug: 'the-future-of-web-development-2025',
    tags: ['Web Development', 'Trends', 'Technology', 'AI', 'WebAssembly'],
    relatedPosts: [2, 4, 7],
  },
  {
    id: 2,
    title: 'Mastering React Hooks: Advanced Patterns',
    content: `<p>React Hooks have revolutionized how we build React components...</p>`,
    excerpt: 'Learn advanced patterns and techniques for using React Hooks effectively in your projects.',
    category: 'Development',
    author: {
      name: 'Sarah Chen',
      avatar: 'https://i.pravatar.cc/150?img=5',
      bio: 'Frontend Developer specializing in React and modern JavaScript frameworks.',
    },
    date: 'May 10, 2025',
    readTime: '8 min read',
    comments: 42,
    likes: 213,
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    slug: 'mastering-react-hooks-advanced-patterns',
    tags: ['React', 'JavaScript', 'Web Development', 'Hooks'],
    relatedPosts: [1, 4, 6],
  },
  // Other posts...
];

// Mock comments data
const commentsData = [
  {
    id: 1,
    author: {
      name: 'Emily Rodriguez',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
    date: 'May 16, 2025',
    content: 'This is a fantastic article! I especially liked the section about AI-driven development. I think we\'re already seeing the beginnings of this trend with GitHub Copilot and similar tools.',
    likes: 12,
    replies: [
      {
        id: 3,
        author: {
          name: 'Alex Johnson',
          avatar: 'https://i.pravatar.cc/150?img=11',
        },
        date: 'May 16, 2025',
        content: 'Thanks Emily! You\'re right, tools like Copilot are just the beginning. I\'m excited to see how these AI assistants evolve over the next few years.',
        likes: 5,
      }
    ]
  },
  {
    id: 2,
    author: {
      name: 'Michael Torres',
      avatar: 'https://i.pravatar.cc/150?img=12',
    },
    date: 'May 15, 2025',
    content: 'Great insights on WebAssembly! I\'ve been experimenting with it recently and the performance gains are impressive. Do you think it will eventually replace JavaScript for certain types of applications?',
    likes: 8,
    replies: []
  },
];

const SinglePostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<any | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [comments, setComments] = useState(commentsData);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch post data
    setLoading(true);
    setTimeout(() => {
      const foundPost = blogPosts.find(p => p.slug === slug);
      setPost(foundPost || null);
      
      if (foundPost && foundPost.relatedPosts) {
        const related = foundPost.relatedPosts.map(id => 
          blogPosts.find(p => p.id === id)
        ).filter(Boolean);
        setRelatedPosts(related as any[]);
      }
      
      setLoading(false);
    }, 500);
  }, [slug]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const newComment = {
      id: comments.length + 1,
      author: {
        name: 'You',
        avatar: 'https://i.pravatar.cc/150?img=8',
      },
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      content: commentText,
      likes: 0,
      replies: [],
    };
    
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 mb-4">
          Post Not Found
        </h2>
        <p className="text-dark-300 dark:text-light-300 mb-6">
          The article you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/blog" className="btn btn-primary">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6 flex items-center text-sm text-dark-400 dark:text-light-400">
        <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/blog" className="hover:text-primary-600 dark:hover:text-primary-400">Blog</Link>
        <span className="mx-2">/</span>
        <Link to={`/categories/${post.category.toLowerCase()}`} className="hover:text-primary-600 dark:hover:text-primary-400">
          {post.category}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-dark-300 dark:text-light-300 truncate">{post.title}</span>
      </div>

      {/* Article Header */}
      <header className="mb-8">
        <Link
          to={`/categories/${post.category.toLowerCase()}`}
          className="inline-block mb-4 rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
        >
          {post.category}
        </Link>
        <h1 className="text-3xl font-bold font-heading sm:text-4xl md:text-5xl text-dark-100 dark:text-light-100 mb-6">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-dark-400 dark:text-light-400">
          <div className="flex items-center">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="h-10 w-10 rounded-full mr-3"
            />
            <div>
              <Link to={`/authors/${post.author.name.toLowerCase().replace(/\s+/g, '-')}`} className="font-medium text-dark-100 dark:text-light-100 hover:text-primary-600 dark:hover:text-primary-400">
                {post.author.name}
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Calendar size={16} className="mr-1" />
            <span>{post.date}</span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-1" />
            <span>{post.readTime}</span>
          </div>
          <div className="flex items-center">
            <MessageSquare size={16} className="mr-1" />
            <span>{post.comments} comments</span>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <div className="mb-8 overflow-hidden rounded-xl">
        <img
          src={post.image}
          alt={post.title}
          className="h-auto w-full object-cover"
        />
      </div>

      {/* Article Content */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-heading prose-headings:font-bold prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-img:rounded-xl mb-8"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      <div className="mb-8">
        <h3 className="text-lg font-bold font-heading text-dark-100 dark:text-light-100 mb-3">
          Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag: string) => (
            <Link
              key={tag}
              to={`/tags/${tag.toLowerCase().replace(/\s+/g, '-')}`}
              className="rounded-full bg-light-200 px-3 py-1 text-sm text-dark-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Author Bio */}
      <div className="mb-12 rounded-xl bg-light-200 p-6 dark:bg-dark-200">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="h-20 w-20 rounded-full mb-4 sm:mb-0 sm:mr-6"
          />
          <div>
            <h3 className="text-xl font-bold font-heading text-dark-100 dark:text-light-100 mb-2">
              {post.author.name}
            </h3>
            <p className="text-dark-300 dark:text-light-300 mb-4">
              {post.author.bio}
            </p>
            <div className="flex space-x-3">
              <a href="#" className="rounded-full bg-light-300 p-2 text-dark-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400">
                <Twitter size={18} />
              </a>
              <a href="#" className="rounded-full bg-light-300 p-2 text-dark-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400">
                <Linkedin size={18} />
              </a>
              <a href="#" className="rounded-full bg-light-300 p-2 text-dark-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400">
                <Link2 size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Article Actions */}
      <div className="mb-12 flex flex-wrap items-center justify-between gap-4 border-y border-light-300 py-4 dark:border-dark-300">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`flex items-center space-x-2 rounded-full px-4 py-2 ${
              isLiked
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'bg-light-200 text-dark-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400'
            }`}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{isLiked ? post.likes + 1 : post.likes} likes</span>
          </button>
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`flex items-center space-x-2 rounded-full px-4 py-2 ${
              isBookmarked
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'bg-light-200 text-dark-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400'
            }`}
          >
            <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            <span>Save</span>
          </button>
        </div>
        <div className="flex items-center">
          <span className="mr-3 text-dark-400 dark:text-light-400">Share:</span>
          <div className="flex space-x-2">
            <a href="#" className="rounded-full bg-light-200 p-2 text-dark-500 hover:bg-[#1877F2] hover:text-white dark:bg-dark-300 dark:text-light-300 dark:hover:bg-[#1877F2] dark:hover:text-white">
              <Facebook size={18} />
            </a>
            <a href="#" className="rounded-full bg-light-200 p-2 text-dark-500 hover:bg-[#1DA1F2] hover:text-white dark:bg-dark-300 dark:text-light-300 dark:hover:bg-[#1DA1F2] dark:hover:text-white">
              <Twitter size={18} />
            </a>
            <a href="#" className="rounded-full bg-light-200 p-2 text-dark-500 hover:bg-[#0A66C2] hover:text-white dark:bg-dark-300 dark:text-light-300 dark:hover:bg-[#0A66C2] dark:hover:text-white">
              <Linkedin size={18} />
            </a>
            <a href="#" className="rounded-full bg-light-200 p-2 text-dark-500 hover:bg-primary-600 hover:text-white dark:bg-dark-300 dark:text-light-300 dark:hover:bg-primary-600 dark:hover:text-white">
              <Link2 size={18} />
            </a>
          </div>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 mb-6">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.id}
                to={`/blog/${relatedPost.slug}`}
                className="card group overflow-hidden"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={relatedPost.image}
                    alt={relatedPost.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-100/80 to-transparent"></div>
                  <div className="absolute left-4 top-4 rounded-full bg-primary-600/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {relatedPost.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-2 text-lg font-bold font-heading text-dark-100 dark:text-light-100 transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2">
                    {relatedPost.title}
                  </h3>
                  <div className="flex items-center text-xs text-dark-400 dark:text-light-400">
                    <Calendar size={12} className="mr-1" />
                    <span className="mr-3">{relatedPost.date}</span>
                    <Clock size={12} className="mr-1" />
                    <span>{relatedPost.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 mb-6">
          Comments ({comments.length})
        </h2>
        
        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} className="mb-8">
          <div className="mb-4">
            <textarea
              className="input min-h-[120px] w-full"
              placeholder={`Write your comment... (${getModifierKeyLabel()}+Enter to post)`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (isModifierPressed(e) && e.key === 'Enter') {
                  e.preventDefault();
                  handleCommentSubmit(e);
                }
              }}
              required
            ></textarea>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-dark-400 dark:text-light-400 font-mono hidden sm:inline">
              Press {getModifierKeyLabel()}+Enter to submit
            </span>
            <button type="submit" className="btn btn-primary">
              Post Comment
            </button>
          </div>
        </form>
        
        {/* Comments List */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-xl bg-light-200 p-6 dark:bg-dark-200">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center">
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    className="h-10 w-10 rounded-full mr-3"
                  />
                  <div>
                    <h4 className="font-medium text-dark-100 dark:text-light-100">
                      {comment.author.name}
                    </h4>
                    <p className="text-sm text-dark-400 dark:text-light-400">
                      {comment.date}
                    </p>
                  </div>
                </div>
                <button className="text-dark-400 hover:text-primary-600 dark:text-light-400 dark:hover:text-primary-400">
                  <Heart size={18} />
                </button>
              </div>
              <p className="text-dark-300 dark:text-light-300 mb-4">
                {comment.content}
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <button className="font-medium text-dark-400 hover:text-primary-600 dark:text-light-400 dark:hover:text-primary-400">
                  Reply
                </button>
                <span className="text-dark-400 dark:text-light-400">
                  {comment.likes} likes
                 </span>
              </div>
              
              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="mt-4 space-y-4 pl-6 border-l-2 border-light-300 dark:border-dark-300">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="pt-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center">
                          <img
                            src={reply.author.avatar}
                            alt={reply.author.name}
                            className="h-8 w-8 rounded-full mr-3"
                          />
                          <div>
                            <h4 className="font-medium text-dark-100 dark:text-light-100">
                              {reply.author.name}
                            </h4>
                            <p className="text-sm text-dark-400 dark:text-light-400">
                              {reply.date}
                            </p>
                          </div>
                        </div>
                        <button className="text-dark-400 hover:text-primary-600 dark:text-light-400 dark:hover:text-primary-400">
                          <Heart size={16} />
                        </button>
                      </div>
                      <p className="text-dark-300 dark:text-light-300 mb-2">
                        {reply.content}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <button className="font-medium text-dark-400 hover:text-primary-600 dark:text-light-400 dark:hover:text-primary-400">
                          Reply
                        </button>
                        <span className="text-dark-400 dark:text-light-400">
                          {reply.likes} likes
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Post Navigation */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/blog/previous-post"
          className="group flex items-center rounded-lg border border-light-300 p-4 transition-colors hover:border-primary-600 dark:border-dark-300 dark:hover:border-primary-400"
        >
          <ChevronLeft size={20} className="mr-2 text-dark-400 group-hover:text-primary-600 dark:text-light-400 dark:group-hover:text-primary-400" />
          <div>
            <span className="block text-sm text-dark-400 dark:text-light-400">Previous Article</span>
            <span className="font-medium text-dark-100 group-hover:text-primary-600 dark:text-light-100 dark:group-hover:text-primary-400">
              UI/UX Design Trends That Will Dominate 2025
            </span>
          </div>
        </Link>
        <Link
          to="/blog/next-post"
          className="group flex items-center justify-end rounded-lg border border-light-300 p-4 transition-colors hover:border-primary-600 dark:border-dark-300 dark:hover:border-primary-400"
        >
          <div className="text-right">
            <span className="block text-sm text-dark-400 dark:text-light-400">Next Article</span>
            <span className="font-medium text-dark-100 group-hover:text-primary-600 dark:text-light-100 dark:group-hover:text-primary-400">
              Building Scalable APIs with Node.js and Express
            </span>
          </div>
          <ChevronRight size={20} className="ml-2 text-dark-400 group-hover:text-primary-600 dark:text-light-400 dark:group-hover:text-primary-400" />
        </Link>
      </div>
    </div>
  );
};

export default SinglePostPage;