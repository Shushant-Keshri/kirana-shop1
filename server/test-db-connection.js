require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_URL;

if (!uri) {
  console.error('Error: MONGODB_URI not set. Please set it in environment or .env file.');
  process.exit(1);
}

(async () => {
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connection successful:', conn.connection.host);
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
})();
