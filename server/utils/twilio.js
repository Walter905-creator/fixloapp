// services/twilio.js

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
 */
function normalizeE164(phone) {
  if (!phone) return null;

  const digits = String(phone).replace(/[^\d]/g, '');

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.startsWith('+')) return digits;

  return `+${digits}`;
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
 */
async function sendSms(to, body) {
  const cli = getTwilioClient();
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!cli || !from) {
    console.warn('⚠️ SMS disabled: missing Twilio configuration');
    return { sid: null, disabled: true };
  }

  const toE164 = normalizeE164(to);
  if (!toE164) throw new Error('Invalid phone number');

  try {
    const message = await cli.messages.create({
      to: toE164,
      from,
      body,
    });

    console.log(`✅ SMS sent to ${toE164}: ${message.sid}`);
    return message;
  } catch (err) {
    console.error(`❌ SMS failed to ${toE164}:`, err.message);
    throw err;
  }
}

/**
 * Send WhatsApp message (NON-USA ONLY)
 * Uses approved transactional template format
 */
async function sendWhatsAppMessage(to, templateDataOrMessage = {}) {
  const cli = getTwilioClient();
  const from = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

  if (!cli || !process.env.TWILIO_WHATSAPP_NUMBER) {
    console.warn('⚠️ WhatsApp disabled: missing Twilio configuration');
    return { sid: null, disabled: true };
  }

  const toE164 = normalizeE164(to);
  if (!toE164) throw new Error('Invalid phone number');

  const toWhatsApp = `whatsapp:${toE164}`;

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

    console.log(`✅ WhatsApp sent to ${toWhatsApp}: ${message.sid}`);
    return message;
  } catch (err) {
    console.error(`❌ WhatsApp failed to ${toWhatsApp}:`, err.message);
    throw err;
  }
}

module.exports = {
  sendSms,
  sendWhatsAppMessage,
  normalizeE164,
  isUSPhoneNumber,
};
