const dbConnect = require('../lib/dbConnect');

async function connectDB() {
  const connection = await dbConnect();

  if (!connection) {
    console.error('❌ MONGODB_URI is not configured or MongoDB is unavailable.');
    process.exit(1);
  }

  return connection;
}

module.exports = { connectDB };
