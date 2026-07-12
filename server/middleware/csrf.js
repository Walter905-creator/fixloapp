/**
 * CSRF Protection Middleware
 *
 * Uses the `csurf` package (synchronizer token / double-submit cookie pattern).
 * Reference: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 *
 * How it works:
 *   1. `csurf` sets a signed `_csrf` cookie on the first GET request.
 *   2. Clients obtain the token via GET /api/csrf-token and include it in
 *      the `x-csrf-token` header (or `_csrf` body field) for state-changing
 *      requests (POST, PUT, PATCH, DELETE).
 *   3. `csurf` validates the header/body token against the signed cookie.
 *
 * Routes excluded from CSRF token checks:
 *   - /webhook/*   — applied via regex path in index.js; webhooks carry their
 *                    own cryptographic proof of origin (Stripe-Signature, etc.)
 *   - Requests with `Authorization: ****** — JWT bearer auth is
 *     architecturally immune to CSRF because the browser cannot auto-attach
 *     an Authorization header in a cross-site request.
 *   - Public authentication path prefixes — pre-auth endpoints (login,
 *     register, forgot-password, reset-password, signup) issue JWT tokens
 *     rather than operate on existing session credentials.  There is no
 *     existing session for an attacker to hijack, so CSRF provides no
 *     meaningful protection.  After successful auth, every subsequent
 *     state-changing request carries a JWT ****** that already
 *     bypasses CSRF (see above).
 *   - GET, HEAD, OPTIONS — safe / idempotent methods (csurf default)
 */

const csurf = require('csurf');

// CSRF token validation middleware (csurf, cookie-based storage).
const _csrfCheck = csurf({
  cookie: {
    key: '_csrf',
    httpOnly: true,                                              // Not readable by JS — server verifies only
    secure: process.env.NODE_ENV === 'production',             // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    // Rationale: the frontend (fixloapp.com / Vercel) and the backend
    // (fixloapp.onrender.com) are on different origins.  With SameSite=Strict
    // the browser would never send the _csrf cookie in cross-origin requests,
    // making CSRF protection impossible for any non-JWT public route.
    // SameSite=None is required for cross-origin credentialed requests and is
    // only enabled in production (where Secure=true enforces HTTPS).
    // Cross-origin access is already restricted by the CORS allowedOrigins
    // list in index.js, so only trusted domains can make credentialed requests.
    path: '/',
  },
});

/**
 * Public authentication path prefixes that are exempt from CSRF validation.
 *
 * These are all pre-authentication endpoints: the client has no session yet,
 * so there are no existing credentials an attacker could force the browser
 * to use.  Exempting them avoids the need for an explicit CSRF-token fetch
 * before every login / register / password-reset page load.
 *
 * All authenticated (post-login) state-changing requests are already covered
 * by the JWT ****** below, so CSRF protection remains complete for
 * every route that actually operates on authenticated state.
 */
const CSRF_EXEMPT_PREFIXES = [
  '/api/auth/',            // login, register, signup/*, forgot-password, reset-password, refresh
  '/api/pro-auth/',        // pro login, forgot-password, reset-password (SMS flow)
  '/api/recruiter-auth/',  // recruiter login, register, forgot-password, reset-password
];

/**
 * Express middleware that enforces CSRF token validation for state-changing
 * requests, with exemptions for JWT Bearer-authenticated requests and the
 * public authentication path prefixes listed above.
 *
 * JWT ****** must be set explicitly in JavaScript — a cross-site
 * attacker cannot inject them through an HTML form or img tag — so those
 * requests carry no CSRF risk.
 *
 * Webhook exemption is handled at the mount level in index.js via
 * a regex path so csurf never runs for /webhook/* paths at all.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function csrfProtection(req, res, next) {
  // JWT Bearer-authenticated requests are immune to CSRF — skip.
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return next();

  // Public pre-authentication endpoints — no existing session to protect.
  if (CSRF_EXEMPT_PREFIXES.some(prefix => req.path.startsWith(prefix))) {
    return next();
  }

  // All other state-changing requests must carry a valid CSRF token.
  // (GET / HEAD / OPTIONS are skipped by csurf itself.)
  return _csrfCheck(req, res, next);
}

/**
 * Error handler for CSRF token validation failures.
 * Returns structured JSON instead of csurf's default plain-text 403.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function csrfErrorHandler(err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  console.warn(`[CSRF] Token validation failed: ${req.method} ${req.path}`);
  return res.status(403).json({ error: 'Invalid or missing CSRF token' });
}

module.exports = { csrfProtection, csrfErrorHandler };



