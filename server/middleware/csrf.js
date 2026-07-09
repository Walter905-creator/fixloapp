/**
 * CSRF Protection Middleware
 *
 * Implements OWASP's "Verifying Origin with Standard Headers" technique.
 * Reference: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#verifying-origin-with-standard-headers
 *
 * This API uses JWT ****** in Authorization headers for authentication
 * (not cookies), which largely eliminates CSRF risk for authenticated endpoints.
 * The country-detection cookie uses sameSite: 'lax' which also mitigates CSRF.
 * Origin-header validation provides defence-in-depth for all state-changing routes.
 *
 * Routes excluded from CSRF checks (they use their own cryptographic verification):
 *   - /webhook/stripe   — validated via Stripe-Signature header (HMAC)
 *   - /webhook/checkr   — validated via Checkr webhook secret
 *   - /webhook/*        — all other webhook integrations
 *
 * Safe HTTP methods (GET, HEAD, OPTIONS) are never checked — they must not
 * cause side-effects per HTTP spec (RFC 7231 §4.2.1).
 */

// Webhook paths that carry their own cryptographic proof of origin.
// They must be exempt so Stripe/Checkr/Twilio server IPs (which send no
// browser-style Origin header) can reach them.
const CSRF_EXEMPT_PREFIXES = [
  '/webhook/', // All webhook endpoints: /webhook/stripe, /webhook/checkr, etc.
];

/**
 * Returns true if the request path is exempt from CSRF origin checks.
 * @param {string} path - Express req.path
 */
function isCsrfExempt(path) {
  return CSRF_EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Factory that returns an Express CSRF-protection middleware.
 *
 * @param {function(string): boolean} isOriginAllowed - Predicate that returns
 *   true when an origin string is on the allow-list.  Pass the same function
 *   used for CORS so the two lists stay in sync.
 */
function csrfProtection(isOriginAllowed) {
  return function csrfMiddleware(req, res, next) {
    // GET / HEAD / OPTIONS are safe (idempotent) methods — skip.
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    // Webhook routes authenticate via cryptographic signatures — skip.
    if (isCsrfExempt(req.path)) return next();

    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // Requests with no Origin and no Referer header are allowed.
    // These originate from non-browser clients (mobile apps, server-to-server
    // calls, cURL) that are not vulnerable to CSRF.  Because authentication
    // uses JWT ****** — not cookies — a cross-site attacker cannot
    // inject credentials into such requests anyway.
    if (!origin && !referer) return next();

    // Derive an origin string from the Referer header when Origin is absent.
    let requestOrigin = origin;
    if (!requestOrigin && referer) {
      try {
        requestOrigin = new URL(referer).origin;
      } catch {
        // Malformed Referer — reject to be safe.
        console.warn(`[CSRF] Rejected ${req.method} ${req.path} — malformed Referer: ${referer}`);
        return res.status(403).json({ error: 'CSRF validation failed: malformed referer' });
      }
    }

    if (!isOriginAllowed(requestOrigin)) {
      console.warn(`[CSRF] Rejected ${req.method} ${req.path} from disallowed origin: ${requestOrigin}`);
      return res.status(403).json({ error: 'CSRF validation failed: origin not allowed' });
    }

    return next();
  };
}

module.exports = { csrfProtection, isCsrfExempt };
