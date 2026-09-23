const sgMail = require('@sendgrid/mail');
const { logNotificationFailure } = require('./auditLogger');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid initialized');
} else {
  console.warn('⚠️ SENDGRID_API_KEY not found - email notifications disabled');
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'notifications@fixloapp.com';
const REPLY_TO_EMAIL = 'support@fixloapp.com';

// Email templates
const EMAIL_TEMPLATES = {
  REQUEST_SUBMITTED: (name) => ({
    subject: 'Fixlo: Your Service Request Received',
    html: `
      <h2>Hi ${name},</h2>
      <p>Thank you for submitting your service request with Fixlo.</p>
      <p>We've received your request and will contact you shortly to confirm your visit.</p>
      <p>If you have any questions, please contact us at <a href="mailto:support@fixloapp.com">support@fixloapp.com</a>.</p>
      <p>Best regards,<br>The Fixlo Team</p>
    `
  }),
  
  VISIT_SCHEDULED: (date, time) => ({
    subject: 'Fixlo: Your Visit is Scheduled',
    html: `
      <h2>Your Fixlo service visit is scheduled</h2>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p>A technician will arrive at your location at the scheduled time.</p>
      <p>If you need to reschedule, please contact us at <a href="mailto:support@fixloapp.com">support@fixloapp.com</a>.</p>
      <p>Best regards,<br>The Fixlo Team</p>
    `
  }),
  
  TECHNICIAN_ARRIVED: () => ({
    subject: 'Fixlo: Technician Has Arrived',
    html: `
      <h2>Your technician has arrived</h2>
      <p>Your Fixlo technician has arrived at your location and started work.</p>
      <p>If you have any concerns, please contact us at <a href="mailto:support@fixloapp.com">support@fixloapp.com</a>.</p>
      <p>Best regards,<br>The Fixlo Team</p>
    `
  }),
  
  JOB_COMPLETED: () => ({
    subject: 'Fixlo: Service Complete',
    html: `
      <h2>Your service is complete</h2>
      <p>Thank you for choosing Fixlo! Your service has been completed.</p>
      <p>Your invoice has been sent and payment will be processed according to your payment method.</p>
      <p>We'd love to hear about your experience. Please leave us a review!</p>
      <p>Best regards,<br>The Fixlo Team</p>
    `
  }),
  
  JOB_ASSIGNED: (technicianName) => ({
    subject: 'Fixlo: Job Assigned',
    html: `
      <h2>Your job has been assigned</h2>
      <p>Your job has been assigned to ${technicianName}.</p>
      <p>They will contact you soon to confirm the visit details.</p>
      <p>If you have any questions, please contact us at <a href="mailto:support@fixloapp.com">support@fixloapp.com</a>.</p>
      <p>Best regards,<br>The Fixlo Team</p>
    `
  })
};

/**
 * Send email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise<object>} - SendGrid response
 */
async function sendEmail(to, subject, html) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('⚠️ Email not sent - SendGrid not configured');
    return { disabled: true };
  }

  try {
    const msg = {
      to,
      from: FROM_EMAIL,
      replyTo: REPLY_TO_EMAIL,
      subject,
      html
    };

    const result = await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}: ${subject}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    
    // Log the failure
    await logNotificationFailure({
      notificationType: 'email',
      recipientEmail: to,
      errorMessage: error.message,
      metadata: { subject }
    });
    
    throw error;
  }
}

/**
 * Send email notification for job event
 * @param {string} email - Customer email address
 * @param {string} eventType - Type of event
 * @param {object} data - Additional data for template
 * @returns {Promise<object>} - SendGrid result
 */
async function sendJobEmailNotification(email, eventType, data = {}) {
  if (!email) {
    console.log('📧 Email not sent: no email address provided');
    return { disabled: true, reason: 'No email address' };
  }

  let template;
  
  switch (eventType) {
    case 'submitted':
      template = EMAIL_TEMPLATES.REQUEST_SUBMITTED(data.name);
      break;
    case 'scheduled':
      template = EMAIL_TEMPLATES.VISIT_SCHEDULED(data.date, data.time);
      break;
    case 'arrived':
    case 'clock-in':
      template = EMAIL_TEMPLATES.TECHNICIAN_ARRIVED();
      break;
    case 'completed':
      template = EMAIL_TEMPLATES.JOB_COMPLETED();
      break;
    case 'assigned':
      template = EMAIL_TEMPLATES.JOB_ASSIGNED(data.technicianName || 'a technician');
      break;
    default:
      console.warn(`⚠️ Unknown email event type: ${eventType}`);
      return { disabled: true, reason: 'Unknown event type' };
  }

  return sendEmail(email, template.subject, template.html);
}


function money(value) {
  return '$' + Number(value || 0).toFixed(2);
}

async function sendInvoiceEmail(email, invoice, job) {
  if (!email) return { disabled: true, reason: 'No email address' };

  const materials = Array.isArray(invoice.materials) && invoice.materials.length
    ? invoice.materials.map((item) =>
        `<tr><td style="padding:6px 0;">${item.description || 'Material'}</td><td style="padding:6px 0;text-align:right;">${money(item.cost)}</td></tr>`
      ).join('')
    : '<tr><td style="padding:6px 0;">Materials</td><td style="padding:6px 0;text-align:right;">$0.00</td></tr>';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827;">
      <h2 style="margin-bottom:4px;">Fixlo Invoice ${invoice.invoiceNumber || ''}</h2>
      <p style="margin-top:0;color:#6b7280;">Your service is complete. Here is your detailed receipt.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:6px 0;"><strong>Service</strong></td><td style="padding:6px 0;text-align:right;">${job.trade || invoice.serviceType || 'Home service'}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Clock in</strong></td><td style="padding:6px 0;text-align:right;">${job.clockInTime ? new Date(job.clockInTime).toLocaleString('en-US') : '—'}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Clock out</strong></td><td style="padding:6px 0;text-align:right;">${job.clockOutTime ? new Date(job.clockOutTime).toLocaleString('en-US') : '—'}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Hours</strong></td><td style="padding:6px 0;text-align:right;">${Number(invoice.laborHours || 0).toFixed(2)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Hourly rate</strong></td><td style="padding:6px 0;text-align:right;">${money(invoice.laborRate)}/hr</td></tr>
        <tr><td style="padding:6px 0;"><strong>Labor</strong></td><td style="padding:6px 0;text-align:right;">${money(invoice.laborCost)}</td></tr>
        ${materials}
        <tr><td style="padding:10px 0;border-top:1px solid #e5e7eb;"><strong>First-hour payment / credit</strong></td><td style="padding:10px 0;border-top:1px solid #e5e7eb;text-align:right;">-${money(invoice.prepaidAmount)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Charged at clock-out</strong></td><td style="padding:6px 0;text-align:right;">${money(invoice.amountChargedAtCompletion)}</td></tr>
        <tr><td style="padding:12px 0;border-top:2px solid #111827;font-size:18px;"><strong>Total service amount</strong></td><td style="padding:12px 0;border-top:2px solid #111827;text-align:right;font-size:18px;"><strong>${money(invoice.total)}</strong></td></tr>
      </table>
      <p><strong>Payment status:</strong> ${invoice.status === 'paid' ? 'Paid' : 'Payment pending'}</p>
      <p>If you have questions, contact <a href="mailto:support@fixloapp.com">support@fixloapp.com</a>.</p>
      <p>Thank you for choosing Fixlo.</p>
    </div>
  `;

  return sendEmail(email, `Fixlo receipt — ${invoice.invoiceNumber || 'completed service'}`, html);
}

/**
 * Send notification with email fallback
 * Tries SMS first, falls back to email if SMS fails
 * @param {object} job - Job object with phone and email
 * @param {string} eventType - Type of event
 * @param {object} data - Additional data for templates
 * @returns {Promise<object>} - Notification result
 */
async function sendNotificationWithFallback(job, eventType, data = {}) {
  const { sendJobNotification } = require('./smsService');
  const result = { sms: { sent: false }, email: { sent: false }, method: null };
  if (job.phone && job.smsConsent && !job.smsOptOut) {
    try {
      const smsResult = await sendJobNotification(job.phone, eventType, data, job.smsConsent, job.smsOptOut);
      if (!smsResult.disabled) {
        result.sms = { sent: true, ...smsResult };
        result.method = 'sms';
        console.log(`✅ SMS notification sent successfully for ${eventType}`);
        return result;
      }
    } catch (smsError) {
      console.error(`❌ SMS failed for ${eventType}:`, smsError.message);
      result.sms = { sent: false, error: smsError.message };
      await logNotificationFailure({ notificationType: 'sms', recipientId: job._id?.toString(), recipientEmail: job.email, errorMessage: smsError.message, metadata: { eventType, phone: job.phone } });
    }
  }
  if (job.email) {
    try {
      console.log(`📧 Falling back to email notification for ${eventType}`);
      const emailResult = await sendJobEmailNotification(job.email, eventType, data);
      if (!emailResult.disabled) {
        result.email = { sent: true, ...emailResult };
        result.method = 'email_fallback';
        console.log(`✅ Email fallback successful for ${eventType}`);
        return result;
      }
    } catch (emailError) {
      console.error(`❌ Email fallback also failed for ${eventType}:`, emailError.message);
      result.email = { sent: false, error: emailError.message };
    }
  }
  console.error(`❌ All notification methods failed for ${eventType}`);
  result.method = 'failed';
  return result;
}

module.exports = {
  sendEmail,
  sendJobEmailNotification,
  sendInvoiceEmail,
  sendNotificationWithFallback
};
