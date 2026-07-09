/**
 * FGE Input Sanitization Helpers
 *
 * Prevent NoSQL injection by validating enum values and
 * escaping user-supplied strings used in regex queries.
 *
 * All admin-guarded routes are already protected by requireAuth + requireAdmin,
 * but defence-in-depth requires sanitization at the query level too.
 */

'use strict';

/**
 * Validate a value against an allowed list.
 * Returns the value if valid, undefined otherwise.
 * @param {*} value
 * @param {string[]} allowed
 * @returns {string|undefined}
 */
function allowedEnum(value, allowed) {
  if (typeof value !== 'string') return undefined;
  return allowed.includes(value) ? value : undefined;
}

/**
 * Cast to a safe string (strips objects/arrays that could be $operators).
 * Returns undefined if the value is not a plain string.
 * @param {*} value
 * @returns {string|undefined}
 */
function safeString(value) {
  if (typeof value !== 'string') return undefined;
  return value;
}

/**
 * Escape special regex characters in a string for use in $regex queries.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a safe case-insensitive regex filter for a field.
 * Returns undefined if value is not a plain string.
 * @param {*} value
 * @returns {{ $regex: string, $options: string }|undefined}
 */
function regexFilter(value) {
  const s = safeString(value);
  if (!s) return undefined;
  return { $regex: escapeRegex(s), $options: 'i' };
}

/**
 * Safe positive integer for pagination.
 * @param {*} value
 * @param {number} defaultVal
 * @returns {number}
 */
function posInt(value, defaultVal = 1) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultVal;
}

module.exports = { allowedEnum, safeString, escapeRegex, regexFilter, posInt };
