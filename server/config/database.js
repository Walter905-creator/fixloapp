const mongoose = require('mongoose');

const MONGO_ENV_KEYS = ['MONGODB_URI', 'MONGO_URI', 'DATABASE_URL'];
const LOCAL_SANDBOX_WARNING = 'MongoDB URI missing or invalid in local/sandbox environment. Skipping database connection.';
const SUPPORTED_MONGO_PROTOCOLS = new Set(['mongodb:', 'mongodb+srv:']);

function getConfiguredMongoUri() {
  for (const key of MONGO_ENV_KEYS) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return { key, uri: value.trim() };
    }
  }

  return { key: null, uri: '' };
}

function getMongoUriValidationDetails(uri) {
  if (!uri) {
    return { valid: false, reason: 'missing URI value' };
  }

  try {
    const parsed = new URL(uri);
    const isMongoProtocol = SUPPORTED_MONGO_PROTOCOLS.has(parsed.protocol);
    // Reject template placeholders like <cluster-host> so sandbox/example values do not attempt a real connection.
    const hasHostname = Boolean(parsed.hostname && !/[<>]/.test(parsed.hostname));
    const hasDatabasePath = parsed.pathname && parsed.pathname !== '/';

    if (!isMongoProtocol) {
      return { valid: false, reason: `unsupported protocol: ${parsed.protocol || 'none'}` };
    }
    if (!hasHostname) {
      return { valid: false, reason: 'missing or placeholder hostname' };
    }
    if (!hasDatabasePath) {
      return { valid: false, reason: 'missing database name in path' };
    }

    return { valid: true, reason: 'ok' };
  } catch {
    return { valid: false, reason: 'unparseable connection string' };
  }
}

function isMongoUriValid(uri) {
  return getMongoUriValidationDetails(uri).valid;
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
  const validation = getMongoUriValidationDetails(uri);
  const validUri = validation.valid;

  if (!validUri) {
    if (isProduction()) {
      console.error(`MongoDB URI validation failed. Checked: ${MONGO_ENV_KEYS.join(', ')}. Reason: ${validation.reason}`);
      throw new Error('MongoDB URI is missing or invalid.');
    }

    console.warn(LOCAL_SANDBOX_WARNING);
    console.warn(`MongoDB URI validation reason: ${validation.reason}`);
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
module.exports.getMongoUriValidationDetails = getMongoUriValidationDetails;
module.exports.isMongoUriValid = isMongoUriValid;
module.exports.isDatabaseAvailable = isDatabaseAvailable;
module.exports.getDatabaseUnavailableResponse = getDatabaseUnavailableResponse;
module.exports.requireDatabase = requireDatabase;
module.exports.LOCAL_SANDBOX_WARNING = LOCAL_SANDBOX_WARNING;
