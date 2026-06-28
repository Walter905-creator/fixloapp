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
