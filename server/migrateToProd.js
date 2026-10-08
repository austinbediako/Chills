import mongoose from 'mongoose';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/chills_blog';
const PROD_URI = 'mongodb+srv://kblog_admin:KBlogProd2026SecureDbPass99@kblogcluster.prqftm8.mongodb.net/kblog?retryWrites=true&w=majority&appName=KBlogCluster';

const COLLECTIONS = [
  'categories',
  'users',
  'submissions',
  'comments',
  'interactions',
  'reviewnotes',
];

async function migrateData() {
  console.log('🔄 Starting data sync from local to production Atlas...');

  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('✅ Connected to local MongoDB.');

  const prodConn = await mongoose.createConnection(PROD_URI).asPromise();
  console.log('✅ Connected to MongoDB Atlas production.');

  try {
    for (const colName of COLLECTIONS) {
      console.log(`\n📦 Processing collection: ${colName}`);
      const localCol = localConn.collection(colName);
      const prodCol = prodConn.collection(colName);

      const docs = await localCol.find({}).toArray();
      console.log(`   Found ${docs.length} documents locally.`);

      if (docs.length > 0) {
        // Clear existing in prod before seeding
        await prodCol.deleteMany({});
        
        // Insert all documents with preserved _id and timestamps
        const result = await prodCol.insertMany(docs);
        console.log(`   ✅ Seeded ${result.insertedCount} documents to production.`);
      } else {
        console.log(`   Skipping empty collection.`);
      }

      // Recreate indexes if any exist
      try {
        const indexes = await localCol.indexes();
        for (const idx of indexes) {
          if (idx.name === '_id_') continue;
          const { key, name, unique, sparse, ...options } = idx;
          await prodCol.createIndex(key, { unique, sparse, name, ...options });
        }
      } catch (idxErr) {
        console.log(`   (Note on indexes for ${colName}: ${idxErr.message})`);
      }
    }

    console.log('\n📊 Verifying production database contents:');
    for (const colName of COLLECTIONS) {
      const count = await prodConn.collection(colName).countDocuments();
      console.log(`   - ${colName}: ${count} documents in Atlas production`);
    }

    console.log('\n🎉 Production database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await localConn.close();
    await prodConn.close();
    console.log('🔒 Connections closed.');
  }
}

migrateData();
