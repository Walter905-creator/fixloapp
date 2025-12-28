let client = null;

function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  if (!client) {
    // Lazy-init to avoid crashes in local without creds
    // eslint-disable-next-line global-require
    client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return client;
}

function normalizeE164(phone) {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.startsWith('+')) return digits;
  return `+${digits}`;
}

/**
 * Send SMS via Twilio
 * COMPLIANCE: SMS is used for USA professionals only
 * @param {string} to - Phone number in E.164 format
 * @param {string} body - Message body (plain text)
 * @returns {Promise<object>} Twilio response or error object
 */
async function sendSms(to, body) {
  const from = process.env.TWILIO_PHONE;
  const cli = getTwilioClient();
  if (!cli || !from) {
    console.warn('SMS disabled: missing Twilio env vars');
    return { sid: null, disabled: true };
  }
  const toE164 = normalizeE164(to);
  
  try {
    const message = await cli.messages.create({ to: toE164, from, body });
    console.log(`✅ SMS sent to ${toE164}: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(`❌ SMS failed to ${toE164}:`, error.message);
    throw error;
  }
}

/**
 * Send WhatsApp message via Twilio
 * COMPLIANCE: WhatsApp is used ONLY for non-US countries with explicit opt-in
 * TRANSACTIONAL ONLY: Job lead notifications only, no marketing
 * @param {string} to - Phone number in E.164 format
 * @param {object} templateData - Template variables {service, location, budget}
 * @returns {Promise<object>} Twilio response or error object
 */
async function sendWhatsAppMessage(to, templateData) {
  const from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
  const cli = getTwilioClient();
  
  if (!cli) {
    console.warn('WhatsApp disabled: missing Twilio credentials');
    return { sid: null, disabled: true };
  }
  
  const toE164 = normalizeE164(to);
  const toWhatsApp = `whatsapp:${toE164}`;
  
  // Build message body using template
  // Template: new_lead_alert
  const body = `🔔 New job lead on Fixlo

Service: ${templateData.service || 'N/A'}
Location: ${templateData.location || 'N/A'}
Budget: ${templateData.budget || 'Contact for details'}

Log in to your Fixlo account to view details and contact the customer.`;

  try {
    const message = await cli.messages.create({
      to: toWhatsApp,
      from: from,
      body: body
    });
    console.log(`✅ WhatsApp sent to ${toWhatsApp}: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(`❌ WhatsApp failed to ${toWhatsApp}:`, error.message);
    throw error;
  }
}

/**
 * Determine if a phone number is from the USA
 * @param {string} phone - Phone number (any format)
 * @returns {boolean} True if US number
 */
function isUSPhoneNumber(phone) {
  const e164 = normalizeE164(phone);
  return e164.startsWith('+1');
}

module.exports = { 
  sendSms, 
  sendWhatsAppMessage,
  normalizeE164,
  isUSPhoneNumber
};