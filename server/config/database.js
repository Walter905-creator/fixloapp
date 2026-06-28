const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI missing');
  }

  console.log(
    'Mongo Host:',
    uri.replace(/\/\/.*?:.*?@/, '//****:****@')
  );

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
  });

  console.log('MongoDB connected');
}

module.exports = connectDB;
module.exports.connectDB = connectDB;
