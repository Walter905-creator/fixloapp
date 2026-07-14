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
 *   - /webhook/*   — webhook paths carry their own cryptographic proof of
 *                    origin (Stripe-Signature, Checkr webhook secret, etc.).
 *                    NOTE: this exclusion is handled INSIDE csrfProtection so
 *                    that req.path is always the full path.  The previous
 *                    pattern app.use(/regex/, fn) caused Express to strip the
 *                    entire matched URL before calling fn, making req.path='/'
 *                    for every route and breaking all prefix-based exemptions.
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
 * Path prefixes that are exempt from CSRF validation.
 *
 * Two categories:
 *
 * 1. Pre-authentication endpoints (login, register, forgot-password, etc.)
 *    These operate before any session exists, so there are no existing
 *    credentials an attacker could force the browser to use.
 *
 * 2. Public, unauthenticated form submissions (free quote, service request,
 *    contact form, homeowner lead capture).
 *    These routes have no authenticated session to hijack — the submitter is
 *    an anonymous visitor.  The CSRF threat model requires an existing
 *    credentialed session; with no session, CSRF provides no protection and
 *    the token requirement only blocks legitimate public traffic.
 *    These are equivalent in risk profile to the auth endpoints above.
 *
 * All authenticated (post-login) state-changing requests are already covered
 * by the JWT ****** below, so CSRF protection remains complete for
 * every route that actually operates on authenticated state.
 */
const CSRF_EXEMPT_PREFIXES = [
  // ── Pre-auth / identity endpoints ─────────────────────────────────────────
  '/api/auth/',              // login, register, signup/*, forgot-password, reset-password, refresh
  '/api/pro-auth/',          // pro login, forgot-password, reset-password (SMS flow)
  '/api/recruiter-auth/',    // recruiter login, register, forgot-password, reset-password

  // ── Public form submissions (unauthenticated visitors) ────────────────────
  '/api/requests',           // homeowner free-quote / service request form
  '/api/service-request/',   // legacy service request form
  '/api/service-intake/',    // Charlotte multi-step intake form (may include photo uploads)
  '/api/homeowner-lead/',    // homeowner lead capture
  '/api/contact/',           // public contact / enquiry form

  // ── Third-party delivery callbacks ────────────────────────────────────────
  '/api/lead-access/twilio/', // Twilio SMS delivery status callbacks
];

/**
 * Express middleware that enforces CSRF token validation for state-changing
 * requests, with exemptions for webhook paths, JWT Bearer-authenticated
 * requests, and the public authentication path prefixes listed above.
 *
 * IMPORTANT: Register this middleware WITHOUT a path pattern:
 *   app.use(csrfProtection)           ✓ correct — req.path is the full URL path
 *   app.use(/regex/, csrfProtection)  ✗ WRONG  — Express strips the entire
 *     regex match from req.url before calling the middleware, making
 *     req.path === '/' for every route and preventing prefix-based exemptions
 *     from ever matching.
 *
 * Webhook exclusion is therefore handled explicitly inside this function where
 * req.path is reliably the full path.
 *
 * JWT ****** must be set explicitly in JavaScript — a cross-site
 * attacker cannot inject them through an HTML form or img tag — so those
 * requests carry no CSRF risk.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function csrfProtection(req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // ── Webhooks ──────────────────────────────────────────────────────────────────
  // Webhook paths carry their own cryptographic proof of origin
  // (Stripe-Signature, Checkr webhook secret, etc.) and must not be asked for
  // a CSRF token.  Previously this was handled by mounting this middleware with
  // a regex path exclusion in index.js, but that caused Express to strip
  // req.path to '/' inside the middleware and broke all prefix-based exemptions.
  if (req.path.startsWith('/webhook')) {
    if (isDev) console.log(`[CSRF] SKIP webhook     | ${req.method} ${req.path}`);
    return next();
  }

  // ── JWT ****** ─────────────────────────────────────────────────────────────────
  // JWT bearer tokens must be set explicitly in JavaScript — a cross-site
  // attacker cannot inject them via an HTML form — so these requests carry no
  // CSRF risk.
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    if (isDev) console.log(`[CSRF] SKIP jwt-bearer  | ${req.method} ${req.path}`);
    return next();
  }

  // ── Public / pre-auth endpoints ───────────────────────────────────────────────
  // Includes pre-authentication routes (login, register, forgot-password) AND
  // public unauthenticated form submissions (free-quote, service request,
  // contact form).  Neither category has an authenticated session for an
  // attacker to hijack.  See CSRF_EXEMPT_PREFIXES above for the full list.
  if (CSRF_EXEMPT_PREFIXES.some(prefix => req.path.startsWith(prefix))) {
    if (isDev) console.log(`[CSRF] SKIP public      | ${req.method} ${req.path}`);
    return next();
  }

  // ── CSRF token validation ─────────────────────────────────────────────────────
  // All other state-changing requests (POST, PUT, PATCH, DELETE) must carry a
  // valid CSRF token.  GET / HEAD / OPTIONS are safe methods and are skipped
  // by csurf automatically.
  if (isDev) {
    const hasCookie = !!(req.headers.cookie && req.headers.cookie.includes('_csrf'));
    const hasToken  = !!req.headers['x-csrf-token'];
    console.log(
      `[CSRF] ENFORCE          | ${req.method} ${req.path} | _csrf: ${hasCookie ? 'yes' : 'NO'} | x-csrf-token: ${hasToken ? 'yes' : 'NO'}`
    );
  }
  return _csrfCheck(req, res, next);
}

/**
 * Error handler for CSRF token validation failures.
 * Returns structured JSON instead of csurf's default plain-text 403.
 * In development mode, logs detailed diagnostics to help identify the cause.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function csrfErrorHandler(err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const cookieHeader = req.headers.cookie || '';
    const hasCsrfCookie = cookieHeader.includes('_csrf');
    console.warn('[CSRF] ─── VALIDATION FAILED ───────────────────────────────');
    console.warn(`[CSRF]   route          : ${req.method} ${req.path}`);
    console.warn(`[CSRF]   middleware      : csurf (_csrfCheck)`);
    console.warn(`[CSRF]   x-csrf-token   : ${req.headers['x-csrf-token'] || '(missing)'}`);
    console.warn(`[CSRF]   _csrf cookie    : ${hasCsrfCookie ? 'present' : '(missing)'}`);
    console.warn(`[CSRF]   origin          : ${req.headers.origin || '(none)'}`);
    console.warn(`[CSRF]   referer         : ${req.headers.referer || '(none)'}`);
    console.warn('[CSRF] ─────────────────────────────────────────────────────');
  } else {
    console.warn(`[CSRF] Token validation failed: ${req.method} ${req.path}`);
  }

  return res.status(403).json({ error: 'Invalid or missing CSRF token' });
}

module.exports = { csrfProtection, csrfErrorHandler };


