const mongoose = require('mongoose');

const projectTimelineSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRequest',
    required: true
  },
  homeownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Homeowner'
  },
  proId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pro'
  },
  event: {
    type: String,
    enum: [
      'created',
      'assigned',
      'viewed',
      'accepted',
      'customer_contacted',
      'appointment_scheduled',
      'in_progress',
      'completed',
      'reviewed',
      'closed',
      'cancelled',
      'invoice_generated',
      'payment_received'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdBy: {
    type: String,
    default: 'system'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

projectTimelineSchema.index({ jobId: 1, createdAt: 1 });
projectTimelineSchema.index({ homeownerId: 1, createdAt: -1 });
projectTimelineSchema.index({ proId: 1, createdAt: -1 });

module.exports = mongoose.model('ProjectTimeline', projectTimelineSchema);

