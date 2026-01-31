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
 * @param {object} options - Optional settings { statusCallback: URL }
 * @returns {Promise<object>} - Twilio message response
 */
async function sendSms(to, body, options = {}) {
  const cli = getTwilioClient();
  // Support both TWILIO_PHONE_NUMBER and TWILIO_PHONE for backward compatibility
  const from = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE;
  const isDemoMode = process.env.NODE_ENV !== 'production';

  // Validate SMS configuration
  if (!cli) {
    console.error('❌ SMS configuration invalid: Twilio client not initialized');
    console.error('   Missing: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
    throw new Error('SMS_CONFIGURATION_INVALID: Twilio credentials not configured');
  }

  if (!from) {
    console.error('❌ SMS configuration invalid: No phone number configured');
    console.error('   Missing: TWILIO_PHONE_NUMBER or TWILIO_PHONE');
    throw new Error('SMS_CONFIGURATION_INVALID: Twilio phone number not configured');
  }

  // Validate E.164 format
  if (!from.startsWith('+')) {
    console.error('❌ SMS configuration invalid: Phone number not in E.164 format');
    console.error(`   Value: ${from}`);
    throw new Error('SMS_CONFIGURATION_INVALID: Twilio phone number must be in E.164 format (e.g., +12564881814)');
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
    const messageParams = {
      to: toE164,
      from,
      body,
    };

    // Add status callback if provided
    if (options.statusCallback) {
      messageParams.statusCallback = options.statusCallback;
      console.log(`   Status callback URL: ${options.statusCallback}`);
    }

    const message = await cli.messages.create(messageParams);

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
 * @param {object} options - Optional settings { statusCallback: URL }
 * @returns {Promise<object>} - Twilio message response
 */
async function sendWhatsAppMessage(to, templateDataOrMessage = {}, options = {}) {
  const cli = getTwilioClient();
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  const isDemoMode = process.env.NODE_ENV !== 'production';

  // Validate WhatsApp configuration
  if (!cli) {
    console.error('❌ WhatsApp configuration invalid: Twilio client not initialized');
    console.error('   Missing: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
    throw new Error('WHATSAPP_CONFIGURATION_INVALID: Twilio credentials not configured');
  }

  if (!whatsappNumber) {
    console.error('❌ WhatsApp configuration invalid: No WhatsApp number configured');
    console.error('   Missing: TWILIO_WHATSAPP_NUMBER');
    throw new Error('WHATSAPP_CONFIGURATION_INVALID: Twilio WhatsApp number not configured');
  }

  // Validate E.164 format
  if (!whatsappNumber.startsWith('+')) {
    console.error('❌ WhatsApp configuration invalid: Phone number not in E.164 format');
    console.error(`   Value: ${whatsappNumber}`);
    throw new Error('WHATSAPP_CONFIGURATION_INVALID: Twilio WhatsApp number must be in E.164 format (e.g., +14155238886)');
  }

  const from = `whatsapp:${whatsappNumber}`;

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
  console.log(`   WhatsApp format: ${toWhatsApp}`);
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
    const messageParams = {
      to: toWhatsApp,
      from,
      body,
    };

    // Add status callback if provided
    if (options.statusCallback) {
      messageParams.statusCallback = options.statusCallback;
      console.log(`   Status callback URL: ${options.statusCallback}`);
    }

    const message = await cli.messages.create(messageParams);

    console.log(`✅ WhatsApp sent successfully to ${toWhatsApp}`);
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
    return message;
  } catch (err) {
    console.error(`❌ WhatsApp delivery failed to ${toWhatsApp}`);
    console.error(`   Error: ${err.message}`);
    console.error(`   Twilio Error Code: ${err.code || 'N/A'}`);
    console.error(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
    throw err;
  }
}

module.exports = {
  sendSms,
  sendWhatsAppMessage,
  normalizeE164,
  isUSPhoneNumber,
  getTwilioClient,
};
