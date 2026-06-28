const mongoose = require('mongoose');

const CONNECTION_OPTIONS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
};

if (!globalThis.__mongoClientPromise) {
  globalThis.__mongoClientPromise = null;
}

if (!globalThis.__mongoClient) {
  globalThis.__mongoClient = null;
}

function getMongoUri() {
  return process.env.MONGODB_URI?.trim() || '';
}

function logMongoHost() {
  console.log(
    'Mongo host:',
    process.env.MONGODB_URI?.replace(/\/\/.*?:.*?@/, '//****:****@')
  );
}

async function dbConnect() {
  if (globalThis.__mongoClient && mongoose.connection.readyState === 1) {
    return globalThis.__mongoClient;
  }

  if (globalThis.__mongoClientPromise) {
    try {
      await globalThis.__mongoClientPromise;
      if (mongoose.connection.readyState === 1) {
        globalThis.__mongoClient = mongoose.connection;
        return globalThis.__mongoClient;
      }
    } catch (error) {
      globalThis.__mongoClientPromise = null;
      globalThis.__mongoClient = null;
    }
  }

  if (!getMongoUri()) {
    console.error('[dbConnect] MONGODB_URI is not configured');
    return null;
  }

  mongoose.set('strictQuery', true);
  logMongoHost();

  globalThis.__mongoClientPromise = mongoose
    .connect(process.env.MONGODB_URI, CONNECTION_OPTIONS)
    .then(() => {
      globalThis.__mongoClient = mongoose.connection;
      console.log('[dbConnect] MongoDB connected');
      return mongoose.connection;
    })
    .catch((error) => {
      console.error('[dbConnect] MongoDB connection failed:', error.message);
      globalThis.__mongoClientPromise = null;
      globalThis.__mongoClient = null;
      throw error;
    });

  try {
    await globalThis.__mongoClientPromise;
    return globalThis.__mongoClient;
  } catch (error) {
    return null;
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  globalThis.__mongoClientPromise = null;
  globalThis.__mongoClient = null;
}

function getConnectionState() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  };

  return states[mongoose.connection.readyState] || 'unknown';
}

function isDatabaseAvailable() {
  return mongoose.connection.readyState === 1;
}

module.exports = dbConnect;
module.exports.connectDB = dbConnect;
module.exports.disconnectDB = disconnectDB;
module.exports.getConnectionState = getConnectionState;
module.exports.isDatabaseAvailable = isDatabaseAvailable;
module.exports.CONNECTION_OPTIONS = CONNECTION_OPTIONS;
