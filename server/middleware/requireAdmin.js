/**
 * requireAdmin middleware
 * Must be used AFTER requireAuth (which attaches req.user).
 * Grants access only to users with role === 'admin' OR isAdmin === true.
 */
module.exports = function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  const hasAdminAccess = req.user.role === 'admin' || req.user.isAdmin === true;
  if (!hasAdminAccess) {
    return res.status(403).json({ ok: false, error: 'Admin access required' });
  }
  next();
};
