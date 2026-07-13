const mongoose = require('mongoose');

const leadAssignmentSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRequest',
    required: true,
    index: true
  },
  proId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pro',
    required: true,
    index: true
  },
  assignmentType: {
    type: String,
    enum: ['premium_exclusive', 'regular_broadcast'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'declined', 'released'],
    default: 'pending',
    index: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  exclusiveUntil: {
    type: Date,
    default: null
  },
  respondedAt: {
    type: Date,
    default: null
  },
  secureAccessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeadAccess',
    default: null
  },
  smsSentAt: {
    type: Date,
    default: null
  },
  smsDeliveredAt: {
    type: Date,
    default: null
  },
  firstOpenedAt: {
    type: Date,
    default: null
  },
  lastViewedAt: {
    type: Date,
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  declinedAt: {
    type: Date,
    default: null
  },
  askedLaterAt: {
    type: Date,
    default: null
  },
  openedCount: {
    type: Number,
    default: 0
  },
  declinedReason: {
    type: String,
    trim: true,
    maxLength: 500
  },
  acceptanceOrder: {
    type: Number,
    default: null
  },
  firstAcceptedProfessional: {
    type: Boolean,
    default: false
  },
  responseTimeMs: {
    type: Number,
    default: null
  },
  openTimeMs: {
    type: Number,
    default: null
  },
  acceptanceDelayMs: {
    type: Number,
    default: null
  },
  distanceMiles: {
    type: Number,
    default: null
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

leadAssignmentSchema.index({ leadId: 1, proId: 1, assignmentType: 1 }, { unique: true });
leadAssignmentSchema.index({ proId: 1, status: 1, exclusiveUntil: 1 });
leadAssignmentSchema.index({ leadId: 1, status: 1, exclusiveUntil: 1 });

module.exports = mongoose.model('LeadAssignment', leadAssignmentSchema);
