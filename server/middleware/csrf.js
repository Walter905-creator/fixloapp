/**
 * CSRF Protection Middleware
 *
 * Uses the double-submit cookie pattern via the `csrf-csrf` package.
 * Reference: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie
 *
 * How it works:
 *   1. On any GET /api/csrf-token request the server sets a signed `_csrf_token`
 *      cookie and returns the corresponding token value.
 *   2. Clients include that value in the `x-csrf-token` header on every
 *      state-changing request (POST, PUT, PATCH, DELETE).
 *   3. The middleware validates the header token against the signed cookie.
 *
 * Axios automatic XSRF support:
 *   Axios reads the `XSRF-TOKEN` cookie and sends `X-XSRF-TOKEN` automatically.
 *   This is handled by setting the cookie name to `XSRF-TOKEN` and configuring
 *   csrf-csrf to also accept the `x-xsrf-token` header.
 *
 * Routes excluded from CSRF checks (they use their own cryptographic auth):
 *   - /webhook/*   — all webhook endpoints (Stripe-Signature, Checkr, etc.)
 *   - GET, HEAD, OPTIONS — safe / idempotent methods per RFC 7231 §4.2.1
 *
 * JWT ******
 *   Because this API uses JWT ****** in Authorization headers (not
 *   cookies) for all authenticated endpoints, those calls are architecturally
 *   immune to CSRF. Requests that carry a valid `Authorization: ******
 *   header bypass the CSRF token check so that existing API clients continue
 *   to work unmodified.  The cookie-based country-detection data is the only
 *   session artefact where CSRF is a theoretical concern, and it is already
 *   guarded by `sameSite: lax` on the cookie itself.
 */

const { doubleCsrf } = require('csrf-csrf');

// Webhook paths that carry their own cryptographic proof of origin.
// Must be exempt so Stripe/Checkr/Twilio server IPs (which send no
// browser-style Origin header) can reach them.
const CSRF_EXEMPT_PREFIXES = [
  '/webhook/', // /webhook/stripe, /webhook/checkr, etc.
];

/**
 * Returns true if the request path is exempt from CSRF token checks.
 * @param {string} path - Express req.path
 */
function isCsrfExempt(path) {
  return CSRF_EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix));
}

// Configure csrf-csrf with the double-submit cookie pattern.
// Cookie is named XSRF-TOKEN so that axios sends it automatically as
// the X-XSRF-TOKEN header (axios built-in XSRF support).
const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.COOKIE_SECRET || process.env.JWT_SECRET || 'fixlo-csrf-secret',
  cookieName: 'XSRF-TOKEN',
  cookieOptions: {
    httpOnly: false,       // Must be readable by client-side JS (axios picks it up)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  },
  // Accept either the standard header name or the axios default
  getTokenFromRequest: (req) =>
    req.headers['x-csrf-token'] || req.headers['x-xsrf-token'],
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // safe methods never checked
});

/**
 * Wraps doubleCsrfProtection with additional exemptions:
 *   - Webhook routes (carry own cryptographic auth)
 *   - Requests with Authorization: ****** (JWT ****** CSRF immune)
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function csrfMiddleware(req, res, next) {
  // Safe methods are never CSRF targets (also handled by csrf-csrf itself).
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  // Webhook routes authenticate via cryptographic signatures — skip.
  if (isCsrfExempt(req.path)) return next();

  // JWT Bearer-authenticated requests are immune to CSRF:
  // the browser cannot auto-attach an Authorization header, so a cross-site
  // attacker cannot forge a credentialed request even without CSRF protection.
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return next();

  // All other state-changing requests must carry a valid CSRF token.
  return doubleCsrfProtection(req, res, next);
}

module.exports = { csrfMiddleware, generateCsrfToken, isCsrfExempt };

