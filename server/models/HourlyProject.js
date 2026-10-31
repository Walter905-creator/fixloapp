const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 300 },
  completed: { type: Boolean, default: false },
  completedAt: Date,
  notes: { type: String, maxlength: 2000 },
  photoUrls: [{ type: String }],
  createdBy: String
}, { timestamps: true });

const sessionSchema = new mongoose.Schema({
  startedAt: { type: Date, required: true },
  endedAt: Date,
  minutes: { type: Number, min: 0 },
  hourlyRateCents: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['running', 'draft', 'invoiced'], default: 'running' },
  completedTaskIds: [{ type: mongoose.Schema.Types.ObjectId }],
  materials: [{
    description: { type: String, required: true },
    amountCents: { type: Number, required: true, min: 0 },
    receiptUrl: String
  }],
  notes: { type: String, maxlength: 5000 },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  reviewedAt: Date,
  reviewedBy: String
}, { timestamps: true });

const schema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequest', required: true, unique: true },
  hourlyRateCents: { type: Number, required: true, min: 0 },
  tasks: [taskSchema],
  sessions: [sessionSchema],
  audit: [{
    action: { type: String, required: true },
    actor: String,
    detail: mongoose.Schema.Types.Mixed,
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('HourlyProject', schema);
