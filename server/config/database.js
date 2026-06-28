const dbConnect = require('../lib/dbConnect');

async function connectDB() {
  if (!process.env.MONGODB_URI?.trim()) {
    console.error('❌ MONGODB_URI is not configured.');
    process.exit(1);
  }

  const connection = await dbConnect();

  if (!connection) {
    console.error('❌ MongoDB is unavailable with the configured MONGODB_URI.');
    process.exit(1);
  }

  return connection;
}

module.exports = { connectDB };
