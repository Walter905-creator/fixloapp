const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['homeowner', 'pro', 'recruiter', 'admin'],
    required: true
  },
  type: {
    type: String,
    enum: [
      'new_lead',
      'lead_accepted',
      'appointment_scheduled',
      'job_completed',
      'invoice_ready',
      'payment_received',
      'review_requested',
      'subscription_renewal',
      'commission_paid',
      'background_check_approved',
      'message_received',
      'system'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  relatedId: mongoose.Schema.Types.ObjectId,
  relatedType: String,
  actionUrl: String,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

