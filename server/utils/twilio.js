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

async function sendSms(to, body) {
  const from = process.env.TWILIO_PHONE;
  const cli = getTwilioClient();
  if (!cli || !from) {
    console.warn('SMS disabled: missing Twilio env vars');
    return { sid: null, disabled: true };
  }
  const toE164 = normalizeE164(to);
  return cli.messages.create({ to: toE164, from, body });
}

module.exports = { sendSms, normalizeE164 };