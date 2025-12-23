// Email utility for sending transactional emails via SendGrid
const sendgrid = require('@sendgrid/mail');

let sendgridClient = null;
let isEnabled = false;

// Initialize SendGrid client if API key is available
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@fixloapp.com';

if (SENDGRID_API_KEY) {
  try {
    // SendGrid uses HTTP API
    sendgridClient = sendgrid;
    sendgridClient.setApiKey(SENDGRID_API_KEY);
    isEnabled = true;
    console.log('✅ SendGrid email client initialized');
  } catch (error) {
    console.warn('⚠️ SendGrid not available:', error.message);
    console.warn('⚠️ Email features will be disabled. Install @sendgrid/mail to enable.');
  }
} else {
  console.warn('⚠️ SENDGRID_API_KEY not set - email features disabled');
}

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetToken - Password reset token
 * @returns {Promise<void>}
 * 
 * Security Note: Reset tokens in URLs are exposed in browser history and server logs.
 * For production, ensure:
 * 1. HTTPS is enforced to prevent interception
 * 2. Tokens expire quickly (1 hour)
 * 3. Tokens are single-use (cleared after reset)
 * 4. Server logs sanitize URLs with tokens
 * 5. Rate limiting prevents brute force
 */
async function sendPasswordResetEmail(to, resetToken) {
  if (!isEnabled) {
    console.log('📧 Email disabled - would send reset to:', to);
    console.log('🔗 Reset token:', resetToken);
    return;
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'https://www.fixloapp.com'}/pro/reset-password?token=${resetToken}`;
  
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'Reset Your Fixlo Pro Password',
    text: `You requested a password reset for your Fixlo Pro account.\n\nClick this link to reset your password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reset Your Fixlo Pro Password</h2>
        <p>You requested a password reset for your Fixlo Pro account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 12px;">Fixlo - Connecting homeowners with trusted professionals</p>
      </div>
    `
  };

  try {
    await sendgridClient.send(msg);
    console.log('✅ Password reset email sent to:', to);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

/**
 * Check if email service is enabled
 * @returns {boolean}
 */
function isEmailEnabled() {
  return isEnabled;
}

module.exports = {
  sendPasswordResetEmail,
  isEmailEnabled
};
