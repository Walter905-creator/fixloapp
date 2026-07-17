'use strict';

/**
 * FGA Admin Auth Middleware
 *
 * Requires a valid JWT (via Authorization: ****** AND
 * admin privileges (role === 'admin' || isAdmin === true).
 *
 * Reuses the existing JWT utility and requireAdmin pattern.
 */

const requireAuth  = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');

// Chain both middleware into a single array for use in routes:
// router.get('/path', fgaAuth, handler);
const fgaAuth = [requireAuth, requireAdmin];

module.exports = fgaAuth;
