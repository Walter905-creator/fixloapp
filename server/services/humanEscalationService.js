const Notification = require('../models/Notification');
const Pro = require('../models/Pro');

async function createHumanEscalation({
  lead,
  channel,
  reason,
  originalMessage,
  intent,
  confidence
}) {
  if (!lead) return { created: false };
  const title = `Follow-up escalation (${channel.toUpperCase()})`;
  const message = `${lead.firstName || 'Lead'} ${lead.lastName || ''} needs human review: ${reason}`;

  const admins = await Pro.find({ role: 'admin' }).select('_id').limit(100);
  if (admins.length) {
    await Notification.insertMany(
      admins.map((admin) => ({
        userId: admin._id,
        userRole: 'admin',
        type: 'lead_escalation',
        title,
        message,
        relatedId: lead._id,
        relatedType: 'MetaLead',
        actionUrl: `/dashboard/admin/lead-automation/${lead._id}`,
        metadata: {
          channel,
          reason,
          intent,
          confidence,
          originalMessage: String(originalMessage || '').slice(0, 500)
        }
      }))
    );
  }

  return { created: true, adminCount: admins.length };
}

module.exports = {
  createHumanEscalation
};
