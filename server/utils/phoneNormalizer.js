/**
 * Phone Number E.164 Normalization Utility
 * 
 * Ensures all phone numbers are properly formatted for Twilio SMS delivery.
 * 
 * E.164 Format: +[country code][subscriber number]
 * Example: +12025551234 (US number)
 * 
 * Valid E.164 Pattern: /^\+[1-9]\d{1,14}$/
 * - Must start with '+'
 * - First digit after '+' must be 1-9 (country codes don't start with 0)
 * - Total length: 2-16 characters (+ sign + 1-15 digits)
 */

/**
 * Normalize phone number to E.164 format
 * 
 * @param {string} phone - Raw phone number input
 * @returns {Object} - { success: boolean, phone: string|null, error: string|null, original: string }
 * 
 * Rules:
 * 1. Remove all non-numeric characters except leading '+'
 * 2. If number starts with "1" and length === 11 → prefix "+"
 * 3. If length === 10 → assume US, prefix "+1"
 * 4. If already starts with "+" → validate and keep as-is
 * 5. Validate final format against E.164 regex
 */
function normalizePhoneToE164(phone) {
  const original = phone;

  // Handle null/undefined/empty
  if (!phone) {
    return {
      success: false,
      phone: null,
      error: 'Phone number is required',
      original: phone
    };
  }

  // Convert to string and trim
  let normalized = String(phone).trim();

  // Handle already E.164 formatted numbers (starts with +)
  if (normalized.startsWith('+')) {
    // Validate the E.164 format
    if (isValidE164Format(normalized)) {
      return {
        success: true,
        phone: normalized,
        error: null,
        original: original
      };
    } else {
      return {
        success: false,
        phone: null,
        error: 'Invalid E.164 format',
        original: original
      };
    }
  }

  // Remove all non-numeric characters
  const digitsOnly = normalized.replace(/[^\d]/g, '');

  // Handle different digit lengths
  if (digitsOnly.length === 10) {
    // Assume US number - prefix with +1
    normalized = `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    // US number with country code - just add +
    normalized = `+${digitsOnly}`;
  } else if (digitsOnly.length > 0) {
    // Try as international number - add +
    normalized = `+${digitsOnly}`;
  } else {
    return {
      success: false,
      phone: null,
      error: 'No digits found in phone number',
      original: original
    };
  }

  // Final validation
  if (isValidE164Format(normalized)) {
    return {
      success: true,
      phone: normalized,
      error: null,
      original: original
    };
  } else {
    return {
      success: false,
      phone: null,
      error: `Invalid phone number format. Must be E.164 compliant (e.g., +12025551234)`,
      original: original
    };
  }
}

/**
 * Validate E.164 phone number format
 * 
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid E.164 format
 * 
 * E.164 Requirements:
 * - Must start with '+'
 * - First digit must be 1-9 (country codes don't start with 0)
 * - Total digits: 1-15 (per ITU-T E.164 standard)
 * - Total length: 2-16 characters (+ sign + digits)
 * 
 * Note: This pattern /^\+[1-9]\d{1,14}$/ is more accurate than simpler patterns
 * like /^\+\d{10,15}$/ because it enforces the ITU-T E.164 requirement that
 * country codes cannot start with 0. This prevents invalid numbers like
 * "+02025551234" from being accepted.
 */
function isValidE164Format(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // E.164 regex: + followed by 1-9, then 1-14 more digits
  // More precise than /^\+\d{10,15}$/ as it rejects leading zeros
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Normalize phone and log the transformation
 * 
 * @param {string} phone - Raw phone number
 * @param {string} context - Context for logging (e.g., 'verification', 'notification')
 * @returns {Object} - Normalization result
 */
function normalizeAndLog(phone, context = 'general') {
  const result = normalizePhoneToE164(phone);
  const isDemoMode = process.env.NODE_ENV !== 'production';
  
  if (result.success) {
    console.log(`📱 [${context}] Phone normalized successfully`);
    console.log(`   Original: ${result.original}`);
    console.log(`   E.164: ${result.phone}`);
    console.log(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
  } else {
    console.error(`❌ [${context}] Phone normalization failed`);
    console.error(`   Original: ${result.original}`);
    console.error(`   Error: ${result.error}`);
    console.error(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
  }

  return result;
}

module.exports = {
  normalizePhoneToE164,
  isValidE164Format,
  normalizeAndLog
};
