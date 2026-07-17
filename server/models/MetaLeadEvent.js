const mongoose = require('mongoose');

const metaLeadEventSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'MetaLead', required: true, index: true },
  eventType: { type: String, required: true, index: true },
  channel: {
    type: String,
    enum: ['meta', 'sms', 'email', 'system', 'admin', 'registration', 'invitation', 'webhook'],
    default: 'system',
    index: true
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  occurredAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

metaLeadEventSchema.index({ leadId: 1, occurredAt: -1 });

module.exports = mongoose.model('MetaLeadEvent', metaLeadEventSchema);
