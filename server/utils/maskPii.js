/**
 * maskPii
 *
 * Masks personally identifiable information (PII) for the Meta App Review
 * administrator account so that real customer data is never exposed to
 * third-party reviewers.
 *
 * Usage:
 *   const { maskPii, shouldMaskPii } = require('../utils/maskPii');
 *
 *   // In a route handler:
 *   if (shouldMaskPii(req)) {
 *     doc = maskPii(doc);
 *   }
 *
 * Only objects returned from database queries or other data sources need
 * to be masked.  Static / configuration data does not contain PII and can
 * be returned as-is.
 */

/**
 * Returns true when the current request is issued by the Meta App Review
 * admin and PII masking should therefore be applied.
 *
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function shouldMaskPii(req) {
  return !!(req.user && req.user.isReviewAdmin === true);
}

/**
 * Replaces PII fields in a plain-object representation of a database
 * document with masked placeholders.
 *
 * Handles both plain objects and arrays of objects.
 *
 * @param {object|object[]} data
 * @returns {object|object[]}
 */
function maskPii(data) {
  if (Array.isArray(data)) {
    return data.map(maskObject);
  }
  if (data !== null && typeof data === 'object') {
    return maskObject(data);
  }
  return data;
}

// Fields that contain personally identifiable information.
// Keys are matched case-insensitively against the document keys.
const PII_FIELD_PATTERNS = [
  /^email$/i,
  /^phone$/i,
  /^phoneNumber$/i,
  /^mobile$/i,
  /^address$/i,
  /^streetAddress$/i,
  /^fullAddress$/i,
  /^firstName$/i,
  /^lastName$/i,
  /^fullName$/i,
  /^customerName$/i,
  /^homeownerName$/i,
  /^ssn$/i,
  /^dob$/i,
  /^dateOfBirth$/i,
  /^ipAddress$/i,
  /^userAgent$/i,
];

function isPiiField(key) {
  return PII_FIELD_PATTERNS.some((pattern) => pattern.test(key));
}

function maskValue(value) {
  if (value === null || value === undefined) return value;
  const str = String(value);
  if (str.includes('@')) {
    // email: user@example.com → u****@e******.***
    // Use indexOf to safely handle the (technically invalid) case of multiple '@'.
    const atIdx = str.indexOf('@');
    const local = str.slice(0, atIdx);
    const domain = str.slice(atIdx + 1);
    return local.charAt(0) + '****@' + (domain ? domain.replace(/[^.]/g, '*') : '***');
  }
  // phone or other: keep first 3 chars and mask the rest
  if (str.length <= 3) return '***';
  return str.slice(0, 3) + '*'.repeat(Math.min(str.length - 3, 6));
}

function maskObject(obj) {
  if (obj === null || typeof obj !== 'object') return obj;

  // Handle Mongoose documents — convert to plain object first.
  const plain = typeof obj.toObject === 'function' ? obj.toObject() : { ...obj };

  const result = {};
  for (const [key, value] of Object.entries(plain)) {
    if (isPiiField(key)) {
      result[key] = typeof value === 'string' && value.length > 0 ? maskValue(value) : value;
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item !== null && typeof item === 'object' ? maskObject(item) : item
      );
    } else if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      result[key] = maskObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

module.exports = { shouldMaskPii, maskPii };
