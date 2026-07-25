const JobRequest = require('../models/JobRequest');
const { sendOwnerNotification } = require('../utils/smsSender');
const { notify: ownerNotify } = require('./ownerNotificationService');

function getStagePaymentLabel(stage) {
  return stage === 'paid' ? 'Paid' : 'Unpaid';
}

function getAdminDashboardUrl() {
  const clientUrl = process.env.CLIENT_URL || 'https://fixloapp.com';
  return process.env.OWNER_DASHBOARD_URL || `${clientUrl}/admin`;
}

function safeFirstName(name) {
  const first = String(name || '').trim().split(/\s+/)[0] || 'Customer';
  return first.replace(/[^\w.'-]/g, '');
}

async function notifyOwnerForLead(leadOrId, { stage = 'standard', amountPaidCents = 0 } = {}) {
  const lead = typeof leadOrId === 'string'
    ? await JobRequest.findById(leadOrId)
    : leadOrId;

  if (!lead) {
    return { success: false, reason: 'lead_not_found' };
  }

  const ownerPhone = String(process.env.FIXLO_OWNER_PHONE || process.env.OWNER_PHONE || '').trim();
  const ownerEmail = String(process.env.OWNER_EMAIL || '').trim().toLowerCase();
  const paymentStatusLabel = getStagePaymentLabel(stage);
  const adminDashboardUrl = getAdminDashboardUrl();

  const smsConfigured = Boolean(ownerPhone);
  const emailConfigured = Boolean(ownerEmail);

  const alreadyFinalized = lead.ownerNotificationStage === stage
    && ['sent', 'skipped'].includes(lead.ownerSmsStatus)
    && ['sent', 'skipped'].includes(lead.ownerEmailStatus);

  if (alreadyFinalized) {
    return { success: true, skipped: true, reason: 'already_notified' };
  }

  let ownerSmsStatus = smsConfigured ? 'failed' : 'skipped';
  let ownerSmsSentAt = lead.ownerSmsSentAt || null;
  let ownerSmsProviderId = lead.ownerSmsProviderId || '';

  let ownerEmailStatus = emailConfigured ? 'failed' : 'skipped';
  let ownerEmailSentAt = lead.ownerEmailSentAt || null;
  let ownerEmailProviderId = lead.ownerEmailProviderId || '';

  let ownerNotificationLastError = '';

  if (smsConfigured) {
    const smsResult = await sendOwnerNotification(ownerPhone, lead, {
      stage,
      paymentStatus: paymentStatusLabel,
      amountPaidCents,
      adminDashboardUrl
    });

    if (smsResult?.success || smsResult?.idempotent) {
      ownerSmsStatus = 'sent';
      ownerSmsSentAt = ownerSmsSentAt || new Date();
      ownerSmsProviderId = smsResult?.messageId || ownerSmsProviderId || '';
    } else {
      ownerSmsStatus = 'failed';
      ownerNotificationLastError = smsResult?.reason || smsResult?.error || 'owner_sms_failed';
    }
  }

  if (emailConfigured) {
    const emailResult = await ownerNotify('service_request', {
      service: lead.trade || lead.serviceType || 'Service Request',
      homeownerName: lead.name || safeFirstName(lead.name),
      email: lead.email || 'N/A',
      phone: lead.phone || 'N/A',
      address: lead.address || 'N/A',
      city: lead.city || 'N/A',
      state: lead.state || 'N/A',
      projectSummary: String(lead.description || '').slice(0, 2000),
      paymentStatus: paymentStatusLabel,
      amountPaid: amountPaidCents > 0 ? `$${(amountPaidCents / 100).toFixed(2)}` : '$0.00',
      requestedDate: lead.createdAt?.toISOString() || new Date().toISOString(),
      leadId: String(lead._id),
      adminDashboardUrl
    });

    if (emailResult?.success) {
      ownerEmailStatus = 'sent';
      ownerEmailSentAt = ownerEmailSentAt || new Date();
      ownerEmailProviderId = emailResult?.providerId || ownerEmailProviderId || '';
    } else if (emailResult?.skipped) {
      ownerEmailStatus = 'skipped';
    } else {
      ownerEmailStatus = 'failed';
      ownerNotificationLastError = emailResult?.error || ownerNotificationLastError || 'owner_email_failed';
    }
  }

  lead.ownerSmsStatus = ownerSmsStatus;
  lead.ownerSmsSentAt = ownerSmsSentAt;
  lead.ownerSmsProviderId = ownerSmsProviderId;
  lead.ownerEmailStatus = ownerEmailStatus;
  lead.ownerEmailSentAt = ownerEmailSentAt;
  lead.ownerEmailProviderId = ownerEmailProviderId;
  lead.ownerNotificationStage = stage;
  lead.ownerNotificationLastError = ownerNotificationLastError || undefined;
  await lead.save();

  return {
    success: ['sent', 'skipped'].includes(ownerSmsStatus) && ['sent', 'skipped'].includes(ownerEmailStatus),
    ownerSmsStatus,
    ownerEmailStatus
  };
}

module.exports = {
  notifyOwnerForLead
};
