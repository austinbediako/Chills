import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Category from './models/Category.js';
import Submission from './models/Submission.js';
import Comment from './models/Comment.js';
import Interaction from './models/Interaction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chills_blog';

// Curated high quality editorial Unsplash images
const coverImages = [
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2072&q=80',
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=2064&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1579547945413-497e1b99dac0?auto=format&fit=crop&w=2039&q=80',
  'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1677442135136-760c813a743d?auto=format&fit=crop&w=2232&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=2055&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=2069&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2072&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=2074&q=80',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=2074&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2070&q=80',
];

const authorAvatars = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
];

const categoriesList = [
  { name: 'Technology', slug: 'technology', description: 'Frontiers of computing, hardware, and digital transformation.' },
  { name: 'Development', slug: 'development', description: 'Architectures, frontend, backend, protocols, and clean code.' },
  { name: 'Design', slug: 'design', description: 'UI/UX systems, editorial aesthetics, typography, and motion design.' },
  { name: 'Artificial Intelligence', slug: 'ai', description: 'Machine learning, neural models, reasoning agents, and ethics.' },
  { name: 'Business', slug: 'business', description: 'Tech ecosystems, venture capital, product strategy, and remote teams.' },
  { name: 'Lifestyle', slug: 'lifestyle', description: 'Digital ergonomics, deep focus, developer well-being, and habits.' },
  { name: 'Culture', slug: 'culture', description: 'Modern societal shifts, open internet culture, and creative freedom.' },
  { name: 'Science', slug: 'science', description: 'Quantum breakthroughs, applied mathematics, and physical sciences.' },
  { name: 'Architecture', slug: 'architecture', description: 'Distributed systems, microservices, cloud fabrics, and resilient storage.' },
  { name: 'Programming', slug: 'programming', description: 'Language internals, compilers, TypeScript, Rust, Go, and Python.' }
];

const seedUsers = [
  { name: 'Alex Johnson', username: 'alexj', email: 'alex@kblog.com', role: 'admin', gender: 'male', bio: 'Staff Systems Architect and Contributing Editor at KBlog.', avatar: authorAvatars[1] },
  { name: 'Sarah Chen', username: 'sarahchen', email: 'sarah@kblog.com', role: 'student', gender: 'female', bio: 'Frontend Lead specializing in React internals and design systems.', avatar: authorAvatars[0] },
  { name: 'Michael Torres', username: 'mtorres', email: 'michael@kblog.com', role: 'reviewer', gender: 'male', bio: 'Product Design Director & Minimalist Typographer.', avatar: authorAvatars[3] },
  { name: 'Emily Rodriguez', username: 'emily_r', email: 'emily@kblog.com', role: 'student', gender: 'female', bio: 'Design Researcher investigating cognitive ergonomics and spatial computing.', avatar: authorAvatars[2] },
  { name: 'David Kim', username: 'davidkim', email: 'david@kblog.com', role: 'student', gender: 'male', bio: 'Backend and Distributed Infrastructure Engineer.', avatar: authorAvatars[7] },
  { name: 'Sophia Lee', username: 'sophialee', email: 'sophia@kblog.com', role: 'reviewer', gender: 'female', bio: 'AI Researcher, LLM Evaluator, and technology ethicist.', avatar: authorAvatars[4] },
  { name: 'James Wilson', username: 'jwilson', email: 'james@kblog.com', role: 'student', gender: 'male', bio: 'Open-source creator, TypeScript core contributor and educator.', avatar: authorAvatars[9] },
  { name: 'Austin Bediako', username: 'austin', email: 'austin@kblog.com', role: 'admin', gender: 'male', bio: 'Creator of KBlog. Building platforms for independent thinkers.', avatar: authorAvatars[5] },
  { name: 'Elena Rostova', username: 'elena_r', email: 'elena@kblog.com', role: 'student', gender: 'female', bio: 'Investigative tech essayist covering algorithmic accountability.', avatar: authorAvatars[6] },
  { name: 'Marcus Vance', username: 'marcus_v', email: 'marcus@kblog.com', role: 'student', gender: 'male', bio: 'Venture engineer and product strategist.', avatar: authorAvatars[8] },
];

// 110 rich articles across domains
const articlesCatalog = [
  // Technology
  { title: 'The Future of Web Development in 2025', cat: 'Technology', tags: ['WebDev', 'Tech', 'Frontend'] },
  { title: 'The Rise of AI in Content Creation', cat: 'Technology', tags: ['AI', 'Tech', 'Automation'] },
  { title: 'Quantum Computing: From Theory to Developer Sandboxes', cat: 'Technology', tags: ['Quantum', 'Hardware', 'Computing'] },
  { title: 'Why WebAssembly is Transforming Browser Capabilities', cat: 'Technology', tags: ['Wasm', 'Performance', 'Web'] },
  { title: 'The Evolution of Neural Network Hardware', cat: 'Technology', tags: ['Hardware', 'AI', 'Silicon'] },
  { title: 'Autonomous Agents and the Shift in Software Architecture', cat: 'Technology', tags: ['Agents', 'AI', 'Architecture'] },
  { title: 'Next-Generation Battery Technology in Consumer Devices', cat: 'Technology', tags: ['Hardware', 'Energy', 'Innovation'] },
  { title: 'Spatial Computing Beyond the Hype: Practical Enterprise Applications', cat: 'Technology', tags: ['VR', 'AR', 'Spatial'] },
  { title: 'The Geopolitics of Semiconductor Manufacturing', cat: 'Technology', tags: ['Chips', 'SupplyChain', 'Tech'] },
  { title: 'Decentralized Identity Protocols and Sovereign Data', cat: 'Technology', tags: ['Identity', 'Decentralization', 'Security'] },
  { title: 'Zero-Knowledge Proofs: Practical Use Cases in 2025', cat: 'Technology', tags: ['Cryptography', 'Privacy', 'Security'] },

  // Development
  { title: 'Mastering React Hooks: Advanced Patterns', cat: 'Development', tags: ['React', 'JavaScript', 'Hooks'] },
  { title: 'Building Scalable APIs with Node.js and Express', cat: 'Development', tags: ['Nodejs', 'Express', 'API'] },
  { title: 'Getting Started with TypeScript in 2025', cat: 'Development', tags: ['TypeScript', 'JavaScript', 'Types'] },
  { title: 'Effective State Management with Redux Toolkit and RTK Query', cat: 'Development', tags: ['Redux', 'StateManagement', 'React'] },
  { title: 'Optimizing Core Web Vitals for Editorial Platforms', cat: 'Development', tags: ['LCP', 'Performance', 'SEO'] },
  { title: 'Micro-Frontends in Practice: Architecture and Pitfalls', cat: 'Development', tags: ['Architecture', 'Frontend', 'Scale'] },
  { title: 'The Developer Guide to Modern CSS Grid and Subgrid', cat: 'Development', tags: ['CSS', 'WebDesign', 'Layout'] },
  { title: 'Understanding Event Loop Nuances in Modern JavaScript', cat: 'Development', tags: ['JavaScript', 'Async', 'Nodejs'] },
  { title: 'Test-Driven Development with Vitest and React Testing Library', cat: 'Development', tags: ['Testing', 'TDD', 'Quality'] },
  { title: 'Clean Architecture Patterns for TypeScript Backends', cat: 'Development', tags: ['Architecture', 'DesignPatterns', 'CleanCode'] },
  { title: 'Database Indexing Strategies for High-Volume Queries', cat: 'Development', tags: ['Databases', 'MongoDB', 'Performance'] },

  // Design
  { title: 'UI/UX Design Trends That Will Dominate 2025', cat: 'Design', tags: ['UI/UX', 'Design', 'Trends'] },
  { title: 'The Psychology of Color in Web Design', cat: 'Design', tags: ['Design', 'Psychology', 'Color'] },
  { title: 'Designing for Accessibility: Practical WCAG 2.2 Guidelines', cat: 'Design', tags: ['A11y', 'Accessibility', 'UX'] },
  { title: 'Typography as the Interface: Editorial Design Fundamentals', cat: 'Design', tags: ['Typography', 'Editorial', 'Design'] },
  { title: 'Creating Fluid Motion Design with Framer Motion', cat: 'Design', tags: ['Motion', 'Animation', 'FramerMotion'] },
  { title: 'Design Tokens: Bridging the Figma-to-Code Chasm', cat: 'Design', tags: ['DesignTokens', 'DesignSystems', 'CSS'] },
  { title: 'Micro-Interactions that Delight Users Without Becoming Annoying', cat: 'Design', tags: ['Interactions', 'UX', 'Product'] },
  { title: 'The Return of Tactile Skeuomorphism in Dark Mode UIs', cat: 'Design', tags: ['UI', 'DarkMode', 'Skeuomorphism'] },
  { title: 'Visual Hierarchy in Data-Dense Dashboards', cat: 'Design', tags: ['DataViz', 'Dashboards', 'UX'] },
  { title: 'User Research on a Shoestring Budget: Tactics for Founders', cat: 'Design', tags: ['Research', 'UserTesting', 'Product'] },
  { title: 'Designing Clean Error States and Empty Views', cat: 'Design', tags: ['UXWriting', 'UI', 'States'] },

  // Artificial Intelligence
  { title: 'Understanding Retrieval-Augmented Generation (RAG)', cat: 'Artificial Intelligence', tags: ['RAG', 'AI', 'Search'] },
  { title: 'Fine-Tuning Open Source LLMs on Commodity GPUs', cat: 'Artificial Intelligence', tags: ['OpenSource', 'LLM', 'FineTuning'] },
  { title: 'Prompt Engineering vs Prompt Caching: Latency Optimization', cat: 'Artificial Intelligence', tags: ['Prompting', 'Performance', 'AI'] },
  { title: 'Vector Embeddings Explained with Visual Intuition', cat: 'Artificial Intelligence', tags: ['Vectors', 'Embeddings', 'Math'] },
  { title: 'Multimodal AI: Architectures Connecting Vision and Voice', cat: 'Artificial Intelligence', tags: ['Vision', 'Audio', 'Multimodal'] },
  { title: 'Evaluating LLM Hallucinations in High-Stakes Domains', cat: 'Artificial Intelligence', tags: ['Safety', 'Evaluation', 'AI'] },
  { title: 'Local AI: Running Powerful Quantized Models on Apple Silicon', cat: 'Artificial Intelligence', tags: ['Mac', 'LocalAI', 'Hardware'] },
  { title: 'AI-Assisted Code Refactoring: Patterns and Guardrails', cat: 'Artificial Intelligence', tags: ['DevTools', 'Refactoring', 'AI'] },
  { title: 'Synthetic Data Generation for Training Robust Models', cat: 'Artificial Intelligence', tags: ['Data', 'MachineLearning', 'AI'] },
  { title: 'The Ethical Dilemmas of Automated Decision Systems', cat: 'Artificial Intelligence', tags: ['Ethics', 'Policy', 'Society'] },
  { title: 'Agentic Workflows with Function Calling and Tool Use', cat: 'Artificial Intelligence', tags: ['Agents', 'Tools', 'Automation'] },

  // Business
  { title: 'Bootstrapping a SaaS to $100k ARR in 2025', cat: 'Business', tags: ['SaaS', 'Bootstrapping', 'Growth'] },
  { title: 'The Product-Led Growth Playbook for Developer Tools', cat: 'Business', tags: ['PLG', 'DevTools', 'Marketing'] },
  { title: 'Managing Asynchronous Remote Engineering Teams Across 12 Timezones', cat: 'Business', tags: ['RemoteWork', 'Management', 'Culture'] },
  { title: 'Pricing Strategies for API and Usage-Based Products', cat: 'Business', tags: ['Pricing', 'Monetization', 'APIs'] },
  { title: 'Why Founders Should Write: The Compounding Power of Thought Leadership', cat: 'Business', tags: ['Writing', 'Branding', 'Leadership'] },
  { title: 'Navigating Venture Capital Cycles in the Post-ZIRP Era', cat: 'Business', tags: ['VC', 'Startups', 'Finance'] },
  { title: 'Customer Churn Analysis: Metrics That Actually Predict Retention', cat: 'Business', tags: ['Analytics', 'Retention', 'Metrics'] },
  { title: 'Open Core vs Proprietary SaaS: Strategic Tradeoffs', cat: 'Business', tags: ['OpenSource', 'Business', 'Strategy'] },
  { title: 'Building defensibility when AI makes code cheaper to produce', cat: 'Business', tags: ['Moats', 'Strategy', 'AI'] },
  { title: 'Scaling Customer Success for High-Touch Enterprise Clients', cat: 'Business', tags: ['CustomerSuccess', 'Enterprise', 'B2B'] },
  { title: 'The Fractional Executive Trend in Tech Startups', cat: 'Business', tags: ['Hiring', 'Startups', 'Leadership'] },

  // Lifestyle
  { title: 'Deep Work for Software Engineers: Protecting Your Flow State', cat: 'Lifestyle', tags: ['Productivity', 'Focus', 'Habits'] },
  { title: 'Digital Minimalism: Curating an Information Diet in an Attention Economy', cat: 'Lifestyle', tags: ['Minimalism', 'Mindfulness', 'Wellness'] },
  { title: 'Preventing Developer Burnout: Early Warning Signs and Remedies', cat: 'Lifestyle', tags: ['MentalHealth', 'Wellness', 'Career'] },
  { title: 'The Ergonomics of Long Coding Sessions: Physical Setup Guide', cat: 'Lifestyle', tags: ['Ergonomics', 'Health', 'Workspace'] },
  { title: 'Continuous Learning Strategies in an Industry Moving at Breakneck Speed', cat: 'Lifestyle', tags: ['Learning', 'Career', 'Growth'] },
  { title: 'The Art of the Daily Log: How Journaling Sharpens Problem Solving', cat: 'Lifestyle', tags: ['Journaling', 'Thinking', 'Productivity'] },
  { title: 'Walking Meetings and Cognitive Clarity', cat: 'Lifestyle', tags: ['Health', 'Habits', 'Creativity'] },
  { title: 'Sleep Optimization for Knowledge Workers', cat: 'Lifestyle', tags: ['Sleep', 'Science', 'Recovery'] },
  { title: 'Managing Context Switching in Interrupt-Driven Engineering Roles', cat: 'Lifestyle', tags: ['Focus', 'TimeManagement', 'Work'] },
  { title: 'Sabbaticals for Engineers: Returning with Renewed Perspective', cat: 'Lifestyle', tags: ['Career', 'Rest', 'Growth'] },
  { title: 'Designing Your Home Office for Peak Creative Resonance', cat: 'Lifestyle', tags: ['Workspace', 'Interior', 'Productivity'] },

  // Culture
  { title: 'The Death of the Algorithm-Driven Feed: The Rise of Curated Communities', cat: 'Culture', tags: ['SocialMedia', 'Communities', 'Internet'] },
  { title: 'Open Source as a Cultural Commons: History and Preservation', cat: 'Culture', tags: ['OpenSource', 'Culture', 'History'] },
  { title: 'The Evolution of Hacker Ethos in Modern Silicon Valley', cat: 'Culture', tags: ['Hacking', 'SiliconValley', 'Culture'] },
  { title: 'Digital Archiving: How to Preserve Ephemeral Internet History', cat: 'Culture', tags: ['Archiving', 'History', 'Web'] },
  { title: 'Remix Culture and Intellectual Property in the AI Generation', cat: 'Culture', tags: ['Copyright', 'Art', 'Remix'] },
  { title: 'The Solitary Coder vs The Hyper-Collaborative Streamer', cat: 'Culture', tags: ['Streaming', 'Collaboration', 'Community'] },
  { title: 'Why Online Niches are Outperforming Mainstream Media', cat: 'Culture', tags: ['Media', 'Publishing', 'Journalism'] },
  { title: 'The Aesthetics of Cyberpunk and Why It Still Captivates Engineers', cat: 'Culture', tags: ['SciFi', 'Cyberpunk', 'Aesthetics'] },
  { title: 'How Code Became the Universal Language of Global Cooperation', cat: 'Culture', tags: ['Globalization', 'Code', 'Society'] },
  { title: 'The Philosophy of Toolmakers: Why We Build What We Build', cat: 'Culture', tags: ['Philosophy', 'Tools', 'Makers'] },
  { title: 'The Lost Art of the Personal Website and Webrings', cat: 'Culture', tags: ['IndieWeb', 'PersonalSites', 'Nostalgia'] },

  // Science
  { title: 'Information Theory: Shannon’s Entropy and Modern Cryptography', cat: 'Science', tags: ['Math', 'InformationTheory', 'Science'] },
  { title: 'The Computational Limits of Silicon: Physics at 2 Nanometers', cat: 'Science', tags: ['Physics', 'Semiconductors', 'Chips'] },
  { title: 'Complex Adaptive Systems: Applying Chaos Theory to Microservices', cat: 'Science', tags: ['Complexity', 'ChaosTheory', 'Systems'] },
  { title: 'Neuroscience of Code Comprehension: What fMRI Scans Reveal', cat: 'Science', tags: ['Neuroscience', 'Cognition', 'Brain'] },
  { title: 'Graph Theory Foundations for Distributed Consensus', cat: 'Science', tags: ['GraphTheory', 'Consensus', 'Algorithms'] },
  { title: 'Thermodynamics of Computation: Landauer’s Principle Explained', cat: 'Science', tags: ['Thermodynamics', 'Physics', 'Computing'] },
  { title: 'Mathematical Beauty in Cellular Automata and Conway’s Game of Life', cat: 'Science', tags: ['Automata', 'Math', 'Simulations'] },
  { title: 'Quantum Teleportation of Information: Myth vs Scientific Reality', cat: 'Science', tags: ['Quantum', 'Physics', 'Research'] },
  { title: 'Probabilistic Data Structures: Bloom Filters and HyperLogLog', cat: 'Science', tags: ['Algorithms', 'DataStructures', 'Math'] },
  { title: 'Bio-Computing: DNA Storage and Molecular Logic Gates', cat: 'Science', tags: ['Biotech', 'DNA', 'Storage'] },
  { title: 'Cosmic Ray Bit Flips: ECC Memory and Atmospheric Radiation', cat: 'Science', tags: ['Hardware', 'Radiation', 'Space'] },

  // Architecture
  { title: 'Designing Resilient Event-Driven Architectures with Kafka and RabbitMQ', cat: 'Architecture', tags: ['Kafka', 'EventDriven', 'Microservices'] },
  { title: 'The Database Dilemma: Relational vs Document vs Graph at Scale', cat: 'Architecture', tags: ['Databases', 'SQL', 'NoSQL'] },
  { title: 'Zero Trust Network Architecture for Modern Cloud Infrastructure', cat: 'Architecture', tags: ['Security', 'ZeroTrust', 'Cloud'] },
  { title: 'Edge Computing Patterns: Bringing Execution Closer to Users', cat: 'Architecture', tags: ['Edge', 'CDNs', 'Latency'] },
  { title: 'Disaster Recovery and High Availability: Testing Chaos in Production', cat: 'Architecture', tags: ['Reliability', 'ChaosEng', 'DevOps'] },
  { title: 'CQRS and Event Sourcing: Real-World Lessons After 3 Years in Production', cat: 'Architecture', tags: ['CQRS', 'EventSourcing', 'Patterns'] },
  { title: 'Designing Multi-Tenant SaaS Architectures: Isolation Models', cat: 'Architecture', tags: ['MultiTenancy', 'SaaS', 'Security'] },
  { title: 'API Gateway Design: Routing, Rate Limiting, and Telemetry', cat: 'Architecture', tags: ['APIGateway', 'Networking', 'APIs'] },
  { title: 'Service Mesh: Is the Complexity Worth the Observability?', cat: 'Architecture', tags: ['ServiceMesh', 'Kubernetes', 'Istio'] },
  { title: 'Graceful Degradation and Circuit Breakers in High-Concurrency Services', cat: 'Architecture', tags: ['CircuitBreakers', 'Resilience', 'Scale'] },
  { title: 'Immutable Infrastructure with Terraform and GitOps Pipelines', cat: 'Architecture', tags: ['Terraform', 'GitOps', 'DevOps'] },

  // Programming
  { title: 'Rust for JavaScript Developers: Memory Safety Without Garbage Collection', cat: 'Programming', tags: ['Rust', 'MemorySafety', 'Languages'] },
  { title: 'Go Concurrency Patterns: Channels, Goroutines, and Worker Pools', cat: 'Programming', tags: ['Golang', 'Concurrency', 'Backend'] },
  { title: 'Python 3.13 and the Free-Threaded GIL: Performance Implications', cat: 'Programming', tags: ['Python', 'Performance', 'Multithreading'] },
  { title: 'Functional Programming Concepts That Will Make You a Better Developer', cat: 'Programming', tags: ['Functional', 'CodeQuality', 'Immutability'] },
  { title: 'Writing Your Own Lisp Interpreter from Scratch', cat: 'Programming', tags: ['Compilers', 'Lisp', 'Interpreters'] },
  { title: 'Type-Level Programming in TypeScript: Generics and Conditional Types', cat: 'Programming', tags: ['TypeScript', 'Generics', 'Advanced'] },
  { title: 'Understanding Pointer Arithmetic and Memory Layouts in C', cat: 'Programming', tags: ['C', 'Memory', 'LowLevel'] },
  { title: 'Metaprogramming and Decorators in Modern Frameworks', cat: 'Programming', tags: ['Metaprogramming', 'Design', 'Patterns'] },
  { title: 'Profiling Memory Leaks in High-Throughput Node.js Services', cat: 'Programming', tags: ['Nodejs', 'MemoryLeaks', 'Debugging'] },
  { title: 'Asynchronous Programming Models: Promises vs Coroutines vs Observables', cat: 'Programming', tags: ['Async', 'Reactive', 'RxJS'] },
  { title: 'Writing Idempotent Webhooks and Resilient Consumer Workers', cat: 'Programming', tags: ['Webhooks', 'Queue', 'Reliability'] },
];

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function generateRichContent(title, categoryName, authorName) {
  return `
    <p class="lead text-xl text-dark-300 dark:text-light-300 mb-6 leading-relaxed font-serif">
      In the rapidly advancing arena of <strong>${categoryName}</strong>, thoughtful design and sound architecture are the cornerstones of lasting impact. This exploration examines the core principles and practical applications behind <em>${title}</em>.
    </p>

    <h2 class="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 mt-8 mb-4">
      1. Conceptual Foundations and Emerging Paradigms
    </h2>
    <p class="mb-4 text-dark-300 dark:text-light-300 leading-relaxed font-serif">
      The trajectory of modern digital systems is defined by the tension between simplicity and expressive power. When engineers and creators prioritize clarity, software ceases to be a fragile web of dependencies and becomes an enduring medium for thought and expression.
    </p>
    <p class="mb-4 text-dark-300 dark:text-light-300 leading-relaxed font-serif">
      Consider how early iterations solved fundamental constraints: raw compute was scarce, bandwidth was constrained, and human interfaces were rigid. Today, our challenges have inverted. We operate in an era of boundless resources, where the chief scarcity is coherence, ergonomic clarity, and disciplined focus.
    </p>

    <blockquote class="my-8 border-l-4 border-primary-500 pl-6 py-2 italic text-lg text-dark-200 dark:text-light-200 font-serif bg-light-200/50 dark:bg-dark-200/50 rounded-r-lg">
      "Simplicity is prerequisite for reliability. Complex mechanisms fail in complex, unanticipatable ways; elegant abstractions illuminate their own failure modes."
    </blockquote>

    <h2 class="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 mt-8 mb-4">
      2. Practical Implementation and Architecture
    </h2>
    <p class="mb-4 text-dark-300 dark:text-light-300 leading-relaxed font-serif">
      To translate high-level design philosophies into durable workflows, developers must standardize on clear interfaces and declarative structures. Here is an illustrative implementation showcasing how these design patterns integrate smoothly:
    </p>

    <pre class="bg-dark-100 text-light-100 p-6 rounded-xl overflow-x-auto my-6 font-mono text-sm leading-relaxed border border-dark-300 shadow-md"><code>// Declarative configuration for resilient systems
interface SystemConfig {
  pipeline: string;
  concurrencyLimit: number;
  retryStrategy: 'exponential' | 'linear';
  telemetryEnabled: boolean;
}

export async function orchestrateWorkflow(config: SystemConfig): Promise&lt;WorkflowResult&gt; {
  const logger = createTelemetryLogger(config.pipeline);
  logger.info("Initializing workflow pipeline with config", { config });

  try {
    const stream = await initDataStream({ retries: config.retryStrategy });
    return await processBatches(stream, config.concurrencyLimit);
  } catch (error) {
    logger.error("Workflow failed gracefully", { error });
    throw new ResilientPipelineException(error);
  }
}</code></pre>

    <h2 class="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 mt-8 mb-4">
      3. Strategic Takeaways and Future Trajectory
    </h2>
    <p class="mb-4 text-dark-300 dark:text-light-300 leading-relaxed font-serif">
      As practitioners across ${categoryName} refine their practices, several foundational rules continue to stand out:
    </p>
    <ul class="list-disc list-inside space-y-2 mb-6 text-dark-300 dark:text-light-300 font-serif">
      <li><strong>Decouple intent from execution:</strong> Build clean boundary layers between state definitions and side-effect consumers.</li>
      <li><strong>Prioritize measurable observability:</strong> Systems that cannot be inspected in production cannot be reliably improved.</li>
      <li><strong>Cultivate deep ergonomics:</strong> Both end-users and codebase maintainers thrive when cognitive friction is eliminated.</li>
    </ul>

    <p class="mt-6 text-dark-400 dark:text-light-400 italic text-sm border-t border-light-300 dark:border-dark-300 pt-4">
      Written by <strong>${authorName}</strong> for the KBlog Community. All insights reflect active production benchmarks and peer-reviewed editorial standards.
    </p>
  `;
}

async function seed() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    console.log('Purging existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Submission.deleteMany({}),
      Comment.deleteMany({}),
      Interaction.deleteMany({}),
    ]);
    console.log('Existing collections cleared.');

    console.log('Seeding Categories...');
    const createdCategories = await Category.insertMany(categoriesList);
    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.name] = cat;
      categoryMap[cat.slug] = cat;
    });
    console.log(`Created ${createdCategories.length} categories.`);

    console.log('Seeding Users / Authors...');
    const createdUsers = [];
    for (const u of seedUsers) {
      const user = await User.create({
        ...u,
        password: 'Password@8', // User schema pre-save hashes this with bcrypt
      });
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} authors.`);

    console.log('Seeding 110+ Rich Submissions (Articles)...');
    const createdSubmissions = [];

    // Helper random date between 1 and 180 days ago
    const getRandomPastDate = (maxDaysAgo = 180) => {
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * maxDaysAgo));
      d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
      return d;
    };

    for (let i = 0; i < articlesCatalog.length; i++) {
      const item = articlesCatalog[i];
      const author = createdUsers[i % createdUsers.length];
      const category = categoryMap[item.cat] || createdCategories[0];
      const coverImage = coverImages[i % coverImages.length];
      const slug = `${generateSlug(item.title)}-${i + 1}`;
      const abstract = `An in-depth analysis of ${item.title.toLowerCase()}. We examine architectural tradeoffs, core patterns, and production lessons in modern ${category.name}.`;
      const content = generateRichContent(item.title, category.name, author.name);
      
      const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
      const readMinutes = Math.max(3, Math.ceil(words / 200));

      const createdAt = getRandomPastDate(150);

      const submission = new Submission({
        title: item.title,
        slug,
        abstract,
        content,
        author: author._id,
        category: category._id,
        tags: item.tags,
        image: coverImage,
        readTime: `${readMinutes} min read`,
        status: 'PUBLISHED',
        isDraft: false,
        createdAt,
        updatedAt: createdAt,
      });

      await submission.save();
      createdSubmissions.push(submission);
    }
    console.log(`Created ${createdSubmissions.length} published articles.`);

    console.log('Seeding Comments and Interactions (Likes/Bookmarks)...');
    const commentTemplates = [
      'This is an exceptionally lucid explanation! Bookmarking this for my team.',
      'Completely agree with the architectural point made in section 2. We ran into this exact pitfall last quarter.',
      'The code sample is clean and practical. Thanks for writing this!',
      'Fascinating insights! Would love to see a follow-up piece diving deeper into telemetry and benchmarking.',
      'Great article! KBlog continues to deliver top-notch editorial content.',
      'Well articulated. The perspective on simplicity versus accidental complexity is spot on.',
    ];

    let totalComments = 0;
    let totalInteractions = 0;

    for (const sub of createdSubmissions) {
      // Add 2-6 likes per submission
      const likeCount = Math.floor(Math.random() * 5) + 2;
      const shuffledUsers = [...createdUsers].sort(() => 0.5 - Math.random());
      
      for (let j = 0; j < likeCount; j++) {
        await Interaction.create({
          submission: sub._id,
          user: shuffledUsers[j]._id,
          type: 'LIKE',
        });
        totalInteractions++;
      }

      // Add 1-3 bookmarks
      const bookmarkCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < bookmarkCount; j++) {
        await Interaction.create({
          submission: sub._id,
          user: shuffledUsers[(j + 3) % shuffledUsers.length]._id,
          type: 'BOOKMARK',
        });
        totalInteractions++;
      }

      // Add 1-4 comments
      const numComments = Math.floor(Math.random() * 4) + 1;
      for (let k = 0; k < numComments; k++) {
        const commenter = shuffledUsers[(k + 1) % shuffledUsers.length];
        const commentText = commentTemplates[(k + sub.title.length) % commentTemplates.length];
        await Comment.create({
          submission: sub._id,
          user: commenter._id,
          content: commentText,
          createdAt: new Date(sub.createdAt.getTime() + (k + 1) * 3600000),
        });
        totalComments++;
      }
    }

    console.log(`Created ${totalInteractions} interactions and ${totalComments} comments.`);

    console.log('\n========================================');
    console.log('✅ DATABASE SUCCESSFULLY SEEDED WITH:');
    console.log(`- ${createdCategories.length} Categories`);
    console.log(`- ${createdUsers.length} Real Authors / Users`);
    console.log(`- ${createdSubmissions.length} Published Articles with Rich HTML & Images`);
    console.log(`- ${totalInteractions} Likes and Bookmarks`);
    console.log(`- ${totalComments} Real Comments`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
