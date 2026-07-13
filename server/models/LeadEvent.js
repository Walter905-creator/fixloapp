const mongoose = require('mongoose');

const leadEventSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRequest',
    required: true,
    index: true
  },
  proId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pro',
    index: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeadAssignment',
    index: true
  },
  accessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeadAccess',
    index: true
  },
  eventType: {
    type: String,
    enum: [
      'lead_created',
      'sms_sent',
      'sms_delivered',
      'link_opened',
      'lead_viewed',
      'accepted',
      'declined',
      'ask_later',
      'expired',
      'homeowner_contacted',
      'job_scheduled',
      'job_completed',
      'cancelled'
    ],
    required: true,
    index: true
  },
  actorType: {
    type: String,
    enum: ['system', 'pro', 'admin', 'twilio', 'homeowner'],
    default: 'system'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ipAddress: String,
  userAgent: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: false
});

leadEventSchema.index({ leadId: 1, timestamp: -1 });
leadEventSchema.index({ proId: 1, timestamp: -1 });
leadEventSchema.index({ assignmentId: 1, eventType: 1, timestamp: -1 });

module.exports = mongoose.model('LeadEvent', leadEventSchema);
