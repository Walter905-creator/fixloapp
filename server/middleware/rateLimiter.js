// Rate limiting middleware for Fixlo backend
const rateLimit = require('express-rate-limit');

// General rate limiting for all requests
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin-endpoint rate limiting — intentionally generous so that protected
// diagnostic and reconciliation endpoints do not exhaust the budget after
// only a handful of requests.  The handler enriches the response with the
// standard RateLimit headers so callers know exactly when to retry.
const adminRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 200, // 200 requests per hour per IP — covers diagnostics + reconciliation runs
  standardHeaders: true,  // Return RateLimit-* headers (draft-6)
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    const resetMs = req.rateLimit?.resetTime
      ? req.rateLimit.resetTime.getTime()
      : Date.now() + options.windowMs;
    const retryAfterSec = Math.ceil((resetMs - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfterSec);
    return res.status(429).json({
      error: 'ADMIN_RATE_LIMIT_EXCEEDED',
      message: 'Too many admin requests — please retry after the window resets.',
      limit: options.max,
      remaining: req.rateLimit?.remaining ?? 0,
      resetAt: new Date(resetMs).toISOString(),
      retryAfterSeconds: retryAfterSec
    });
  }
});

module.exports = {
  generalRateLimit,
  authRateLimit,
  adminRateLimit
};
