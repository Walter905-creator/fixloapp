// services/twilio.js
const { normalizePhoneToE164, isValidE164Format } = require('./phoneNormalizer');

let client = null;

/**
 * Lazily initialize Twilio client
 * Prevents crashes in environments without credentials
 */
function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return null;
  }

  if (!client) {
    // eslint-disable-next-line global-require
    client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  return client;
}

/**
 * Normalize phone number to E.164 format
 * 
 * @deprecated Use normalizePhoneToE164 from phoneNormalizer.js for better error handling
 * This wrapper maintains backward compatibility and will be kept for existing code.
 * New code should use the phoneNormalizer module directly for structured error handling.
 */
function normalizeE164(phone) {
  const result = normalizePhoneToE164(phone);
  return result.success ? result.phone : null;
}

/**
 * Determine if phone number is US-based
 */
function isUSPhoneNumber(phone) {
  const e164 = normalizeE164(phone);
  return !!e164 && e164.startsWith('+1');
}

/**
 * Send SMS (USA ONLY)
 * COMPLIANCE: Transactional messages only
 * 
 * @param {string} to - Phone number (will be normalized to E.164)
 * @param {string} body - SMS message body (DO NOT include verification codes in logs)
 * @returns {Promise<object>} - Twilio message response
 */
async function sendSms(to, body) {
  const cli = getTwilioClient();
  const from = process.env.TWILIO_PHONE_NUMBER;
  const isDemoMode = process.env.NODE_ENV !== 'production';

  if (!cli || !from) {
    console.warn('⚠️ SMS disabled: missing Twilio configuration');
    return { sid: null, disabled: true };
  }

  // Normalize phone number to E.164 format
  const normalizationResult = normalizePhoneToE164(to);
  
  if (!normalizationResult.success) {
    console.error('❌ SMS normalization failed');
    console.error(`   Original phone: ${normalizationResult.original}`);
    console.error(`   Error: ${normalizationResult.error}`);
    console.error(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
    throw new Error(`Phone normalization failed: ${normalizationResult.error}`);
  }

  const toE164 = normalizationResult.phone;
  
  // Log phone normalization (without exposing message content)
  console.log('📱 SMS phone normalization:');
  console.log(`   Original: ${normalizationResult.original}`);
  console.log(`   Normalized E.164: ${toE164}`);
  console.log(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);

  try {
    const message = await cli.messages.create({
      to: toE164,
      from,
      body,
    });

    console.log(`✅ SMS sent successfully to ${toE164}`);
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
    return message;
  } catch (err) {
    console.error(`❌ SMS delivery failed to ${toE164}`);
    console.error(`   Error: ${err.message}`);
    console.error(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
    throw err;
  }
}

/**
 * Send WhatsApp message (NON-USA ONLY)
 * Uses approved transactional template format
 * 
 * @param {string} to - Phone number (will be normalized to E.164)
 * @param {string|object} templateDataOrMessage - Message body or template data
 * @returns {Promise<object>} - Twilio message response
 */
async function sendWhatsAppMessage(to, templateDataOrMessage = {}) {
  const cli = getTwilioClient();
  const from = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
  const isDemoMode = process.env.NODE_ENV !== 'production';

  if (!cli || !process.env.TWILIO_WHATSAPP_NUMBER) {
    console.warn('⚠️ WhatsApp disabled: missing Twilio configuration');
    return { sid: null, disabled: true };
  }

  // Normalize phone number to E.164 format
  const normalizationResult = normalizePhoneToE164(to);
  
  if (!normalizationResult.success) {
    console.error('❌ WhatsApp normalization failed');
    console.error(`   Original phone: ${normalizationResult.original}`);
    console.error(`   Error: ${normalizationResult.error}`);
    console.error(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
    throw new Error(`Phone normalization failed: ${normalizationResult.error}`);
  }

  const toE164 = normalizationResult.phone;
  const toWhatsApp = `whatsapp:${toE164}`;

  // Log phone normalization
  console.log('📱 WhatsApp phone normalization:');
  console.log(`   Original: ${normalizationResult.original}`);
  console.log(`   Normalized E.164: ${toE164}`);
  console.log(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);

  // If a string is passed, use it as the body directly
  let body;
  if (typeof templateDataOrMessage === 'string') {
    body = templateDataOrMessage;
  } else {
    // Otherwise, use template format for job leads
    const templateData = templateDataOrMessage;
    body = `🔔 New job lead on Fixlo

Service: ${templateData.service || 'N/A'}
Location: ${templateData.location || 'N/A'}
Budget: ${templateData.budget || 'Contact for details'}

Log in to your Fixlo account to view details and contact the customer.`;
  }

  try {
    const message = await cli.messages.create({
      to: toWhatsApp,
      from,
      body,
    });

    console.log(`✅ WhatsApp sent successfully to ${toWhatsApp}`);
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
    return message;
  } catch (err) {
    console.error(`❌ WhatsApp delivery failed to ${toWhatsApp}`);
    console.error(`   Error: ${err.message}`);
    console.error(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
    throw err;
  }
}

module.exports = {
  sendSms,
  sendWhatsAppMessage,
  normalizeE164,
  isUSPhoneNumber,
};
