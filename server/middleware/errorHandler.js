// Global error handler middleware for Fixlo backend
// CRITICAL: Always returns JSON, never exposes raw 500 errors to frontend
const errorHandler = (err, req, res, next) => {
  console.error('❌ Unhandled error caught by global handler:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let status = err.statusCode || err.status || 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'Something went wrong. Please try again.';

  // Handle specific error types with user-friendly messages
  if (err.name === 'ValidationError') {
    status = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Invalid input provided';
  } else if (err.name === 'CastError') {
    status = 400;
    errorCode = 'INVALID_FORMAT';
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    status = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'This entry already exists';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Authentication failed';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Session expired. Please sign in again.';
  } else if (err.message === 'Not allowed by CORS') {
    status = 403;
    errorCode = 'CORS_VIOLATION';
    message = 'Access denied';
  } else if (status === 500) {
    // Generic 500 errors - sanitize for production
    errorCode = 'INTERNAL_ERROR';
    message = 'Something went wrong. Please try again.';
  }

  // Always send structured JSON error response
  // NEVER expose internal error details to frontend in production
  const response = {
    error: errorCode,
    message: message,
    timestamp: new Date().toISOString()
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err.message;
  }

  res.status(status).json(response);
};

module.exports = errorHandler;
