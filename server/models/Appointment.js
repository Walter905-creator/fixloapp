const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  homeownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Homeowner',
    required: true
  },
  proId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pro'
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRequest'
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
  scheduledAt: {
    type: Date,
    required: true
  },
  endAt: Date,
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['estimate', 'service', 'follow_up', 'inspection'],
    default: 'service'
  },
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  confirmedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelReason: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

appointmentSchema.index({ homeownerId: 1, scheduledAt: 1 });
appointmentSchema.index({ proId: 1, scheduledAt: 1 });
appointmentSchema.index({ jobId: 1 });
appointmentSchema.index({ scheduledAt: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

