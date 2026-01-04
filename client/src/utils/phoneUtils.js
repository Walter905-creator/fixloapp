/**
 * Phone number utilities for Fixlo
 * Ensures consistent E.164 formatting for Twilio SMS
 */

/**
 * Normalize US phone number to E.164 format
 * @param {string} input - Raw phone number input
 * @returns {string|null} - E.164 formatted phone (+1XXXXXXXXXX) or null if invalid
 */
export function normalizeUSPhone(input) {
  if (!input) return null;

  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');

  // Handle 10-digit number (missing country code)
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Handle 11-digit number starting with 1 (has country code)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Invalid format
  return null;
}

/**
 * Validate E.164 phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid E.164 format
 */
export function isValidE164(phone) {
  if (!phone) return false;
  return /^\+\d{10,15}$/.test(phone);
}

/**
 * Format phone number for display (US format)
 * @param {string} phone - E.164 formatted phone number
 * @returns {string} - Formatted phone number for display
 */
export function formatPhoneDisplay(phone) {
  if (!phone) return '';

  // Remove + prefix and country code for US numbers
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 11 && digits.startsWith('1')) {
    const usDigits = digits.slice(1); // Remove country code
    return `(${usDigits.slice(0, 3)}) ${usDigits.slice(3, 6)}-${usDigits.slice(6)}`;
  }

  return phone; // Return as-is for non-US numbers
}
