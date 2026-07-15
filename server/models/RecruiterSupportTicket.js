const mongoose = require('mongoose');

const recruiterSupportTicketSchema = new mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruiterProfile',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['support', 'issue', 'feature', 'billing', 'other'],
    default: 'support'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
    index: true
  }
}, {
  timestamps: true
});

recruiterSupportTicketSchema.index({ recruiterId: 1, createdAt: -1 });

module.exports = mongoose.model('RecruiterSupportTicket', recruiterSupportTicketSchema);
