'use strict';

/**
 * FGA Utility: Input Sanitization
 *
 * Shared sanitization helpers for use across FGA routes and services.
 */

/**
 * Escape a string for safe use as a MongoDB $regex pattern.
 * Prevents NoSQL injection via malformed regex characters.
 *
 * @param {string} str  - User-supplied string
 * @returns {string}    - Escaped string safe for use in $regex
 */
function escapeRegex(str) {
  return typeof str === 'string'
    ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    : '';
}

module.exports = { escapeRegex };
