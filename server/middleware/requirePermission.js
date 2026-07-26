/**
 * requirePermission middleware factory
 *
 * Usage:
 *   router.use(requirePermission('dashboard'))
 *   router.get('/some-route', requirePermission('meta_integration'), handler)
 *
 * Behaviour:
 *  - Regular admin accounts (isReviewAdmin === undefined/false) pass through
 *    unconditionally — this middleware only restricts the review admin account.
 *  - Review admin accounts (isReviewAdmin === true) must have the requested
 *    permission listed in their JWT `permissions` array; otherwise 403.
 *  - Must be used AFTER requireAuth (which attaches req.user).
 */
module.exports = function requirePermission(permission) {
  return function checkPermission(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    // Regular admins have unrestricted access.
    if (!req.user.isReviewAdmin) {
      return next();
    }

    // Review admin: validate against their scoped permissions.
    const perms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    if (perms.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      ok: false,
      error: `Access denied: '${permission}' permission required`,
    });
  };
};
