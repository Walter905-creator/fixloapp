const mongoose = require('mongoose');

/**
 * MetaReconciliationRun — audit record for each full Meta→Fixlo reconciliation.
 *
 * One document is written per run.  The scheduler (every 15 min) and the
 * admin-triggered endpoint both create run records so the dashboard can surface
 * the last result and next scheduled time.
 */
const reconciliationResultSchema = new mongoose.Schema({
  metaLeadId: { type: String, default: '' },
  leadId: { type: String, default: null },
  name: { type: String, default: '' },
  classification: {
    type: String,
    enum: ['ALREADY_COMPLETE', 'EXISTING_INCOMPLETE', 'MISSING_FROM_FIXLO', 'UNREACHABLE', 'FAILED', 'SKIPPED_DUPLICATE'],
    default: 'FAILED'
  },
  recoveryMethod: { type: String, default: null },
  inviteCode: { type: String, default: null },
  phoneAvailable: { type: Boolean, default: false },
  emailAvailable: { type: Boolean, default: false },
  twilioSid: { type: String, default: null },
  twilioStatus: { type: String, default: null },
  sendGridMessageId: { type: String, default: null },
  sendGridStatus: { type: String, default: null },
  smsFollowUpsEnabled: { type: Boolean, default: false },
  emailFollowUpsEnabled: { type: Boolean, default: false },
  nextFollowUpAt: { type: Date, default: null },
  nextSmsFollowUpAt: { type: Date, default: null },
  nextEmailFollowUpAt: { type: Date, default: null },
  signupUrl: { type: String, default: 'https://fixloapp.com/pros' },
  reason: { type: String, default: null },
  submittedAt: { type: Date, default: null },
  profileIncomplete: { type: Boolean, default: false },
  missingFields: { type: [String], default: [] }
}, { _id: false });

const metaReconciliationRunSchema = new mongoose.Schema({
  formId: { type: String, required: true, index: true },
  triggeredBy: {
    type: String,
    enum: ['scheduled', 'admin', 'api'],
    default: 'scheduled'
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'failed'],
    default: 'running',
    index: true
  },
  startedAt: { type: Date, default: Date.now, index: true },
  completedAt: { type: Date, default: null },
  graphError: { type: String, default: null },
  totalFromMeta: { type: Number, default: 0 },
  alreadyComplete: { type: Number, default: 0 },
  existingIncomplete: { type: Number, default: 0 },
  newlyRecovered: { type: Number, default: 0 },
  duplicatesSkipped: { type: Number, default: 0 },
  unreachable: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  lastError: { type: String, default: null },
  // Store up to 200 individual lead results without splitting into a separate collection.
  results: { type: [reconciliationResultSchema], default: [] }
}, {
  timestamps: true
});

metaReconciliationRunSchema.index({ formId: 1, startedAt: -1 });

module.exports = mongoose.model('MetaReconciliationRun', metaReconciliationRunSchema);
