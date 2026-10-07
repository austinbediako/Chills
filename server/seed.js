import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Category from './models/Category.js';
import Submission from './models/Submission.js';
import Comment from './models/Comment.js';

// Setup env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chills';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Submission.deleteMany({}),
      Comment.deleteMany({}),
    ]);

    console.log('Seeding Categories...');
    const categoriesData = [
      { name: 'Technology', slug: 'technology', description: 'Tech news and essays' },
      { name: 'Design', slug: 'design', description: 'UI/UX and product design' },
      { name: 'Programming', slug: 'programming', description: 'Software engineering' },
      { name: 'Culture', slug: 'culture', description: 'Society and modern culture' },
      { name: 'Artificial Intelligence', slug: 'ai', description: 'AI and machine learning' }
    ];
    const categories = await Category.insertMany(categoriesData);

    console.log('Seeding Users...');
    // Create standard password for all test accounts
    // Password@8 is already hashed or handled by pre-save? 
    // Yes, User model has a pre('save') hook that hashes password.
    // InsertMany bypasses pre('save') hooks! We must use create() instead.
    
    const usersData = [
      {
        name: 'Admin User', email: 'admin@kblog.com', username: 'admin', password: 'Password@8', role: 'admin', gender: 'other', bio: 'I am the admin.'
      },
      {
        name: 'Reviewer One', email: 'reviewer@kblog.com', username: 'reviewer1', password: 'Password@8', role: 'reviewer', gender: 'other'
      },
      {
        name: 'Austin Bediako', email: 'austin@kblog.com', username: 'austin', password: 'Password@8', role: 'admin', gender: 'male', bio: 'Creator of KBlog.'
      },
      {
        name: 'Sarah Connor', email: 'sarah@kblog.com', username: 'sarah_c', password: 'Password@8', role: 'student', gender: 'female', bio: 'AI researcher and survivalist.'
      },
      {
        name: 'David Bowman', email: 'david@kblog.com', username: 'davidb', password: 'Password@8', role: 'student', gender: 'male'
      }
    ];

    const users = [];
    for (const u of usersData) {
      users.push(await User.create(u));
    }

    console.log('Seeding Submissions (Posts)...');
    
    // Helper to get random item from array
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    // Helper to create dates in the past
    const getRandomDate = (daysAgo) => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
      return date;
    };

    const dummyAbstract = "This is a brief abstract summarizing the core idea of the essay. It provides just enough context to make you want to read more without giving away the entire premise.";
    const dummyContent = `<p>This is the main body of the article. It contains <strong>rich text formatting</strong> and elaborate descriptions of the topic at hand.</p><p>As we delve deeper into the subject, we realize the importance of structural integrity in our writing.</p><h3>Key Takeaways</h3><ul><li>First important point</li><li>Second critical insight</li><li>A final thought to ponder</li></ul><p>In conclusion, the discourse around this topic continues to evolve, and we must remain vigilant in our understanding of these core principles.</p>`;

    const postsData = [
      { title: 'The Future of Web Development in 2027', category: 'Programming', author: 'austin' },
      { title: 'Why Minimalist Design is Failing Us', category: 'Design', author: 'sarah_c' },
      { title: 'Understanding LLMs: A Primer', category: 'Artificial Intelligence', author: 'davidb' },
      { title: 'The Cultural Impact of Remote Work', category: 'Culture', author: 'reviewer1' },
      { title: 'Building Scalable React Applications', category: 'Programming', author: 'austin' },
      { title: 'The Psychology of Typography', category: 'Design', author: 'sarah_c' },
      { title: 'Ethical Dilemmas in AI', category: 'Artificial Intelligence', author: 'admin' },
      { title: 'Is the Tech Industry Slowing Down?', category: 'Technology', author: 'davidb' },
      { title: 'How to Write Better Code Reviews', category: 'Programming', author: 'reviewer1' },
      { title: 'Digital Nomadism: Myth vs Reality', category: 'Culture', author: 'sarah_c' },
      { title: 'My Unpublished Draft', category: 'Technology', author: 'austin', status: 'DRAFT' },
      { title: 'Waiting for Approval', category: 'Design', author: 'sarah_c', status: 'PENDING_REVIEW' },
    ];

    const submissions = [];
    for (const p of postsData) {
      const authorObj = users.find(u => u.username === p.author);
      const categoryObj = categories.find(c => c.name === p.category);
      
      const sub = await Submission.create({
        title: p.title,
        slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        abstract: dummyAbstract,
        content: dummyContent,
        author: authorObj._id,
        category: categoryObj._id,
        status: p.status || 'PUBLISHED',
        tags: ['insight', p.category.toLowerCase()],
        image: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?q=80&w=800&auto=format&fit=crop`,
        createdAt: getRandomDate(60),
      });
      submissions.push(sub);
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
