const mongoose = require('mongoose');

const MONGO_ENV_KEYS = ['MONGODB_URI', 'MONGO_URI', 'DATABASE_URL'];
const LOCAL_SANDBOX_WARNING = 'MongoDB URI missing or invalid in local/sandbox environment. Skipping database connection.';

function getConfiguredMongoUri() {
  for (const key of MONGO_ENV_KEYS) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return { key, uri: value.trim() };
    }
  }

  return { key: null, uri: '' };
}

function isMongoUriValid(uri) {
  if (!uri) return false;

  try {
    const parsed = new URL(uri);
    const isMongoProtocol = parsed.protocol === 'mongodb:' || parsed.protocol === 'mongodb+srv:';
    const hasHostname = Boolean(parsed.hostname && !/[<>]/.test(parsed.hostname));
    const hasDatabasePath = parsed.pathname && parsed.pathname !== '/';

    return isMongoProtocol && hasHostname && hasDatabasePath;
  } catch {
    return false;
  }
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function isDatabaseAvailable() {
  return mongoose.connection.readyState === 1;
}

function getDatabaseUnavailableResponse() {
  return {
    error: 'DATABASE_UNAVAILABLE',
    message: 'Database is unavailable in this environment. Please try again later.'
  };
}

function requireDatabase(req, res, next) {
  if (isDatabaseAvailable()) {
    return next();
  }

  return res.status(503).json(getDatabaseUnavailableResponse());
}

async function connectDB() {
  const { key, uri } = getConfiguredMongoUri();
  const validUri = isMongoUriValid(uri);

  if (!validUri) {
    if (isProduction()) {
      console.error(`MongoDB URI validation failed. Checked: ${MONGO_ENV_KEYS.join(', ')}`);
      throw new Error('MongoDB URI is missing or invalid.');
    }

    console.warn(LOCAL_SANDBOX_WARNING);
    return { connected: false, skipped: true, reason: 'missing_or_invalid_uri' };
  }

  console.log(
    `Mongo Host (${key}):`,
    uri.replace(/\/\/.*?:.*?@/, '//****:****@')
  );

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log('MongoDB connected');
    return { connected: true, skipped: false };
  } catch (error) {
    if (isProduction()) {
      throw error;
    }

    console.warn(LOCAL_SANDBOX_WARNING);
    console.warn('MongoDB connection error:', error.message);
    return { connected: false, skipped: true, reason: 'connection_failed', error };
  }
}

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.getConfiguredMongoUri = getConfiguredMongoUri;
module.exports.isMongoUriValid = isMongoUriValid;
module.exports.isDatabaseAvailable = isDatabaseAvailable;
module.exports.getDatabaseUnavailableResponse = getDatabaseUnavailableResponse;
module.exports.requireDatabase = requireDatabase;
module.exports.LOCAL_SANDBOX_WARNING = LOCAL_SANDBOX_WARNING;
