const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  step: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'paused', 'stopped', 'completed'],
    default: 'active',
    index: true
  },
  lastFollowUpAt: { type: Date, default: null },
  nextFollowUpAt: { type: Date, default: null },
  pausedAt: { type: Date, default: null },
  pausedReason: { type: String, default: null },
  stoppedReason: { type: String, default: null }
}, { _id: false });

const smsHistorySchema = new mongoose.Schema({
  messageSid: { type: String, index: true },
  direction: { type: String, enum: ['outbound', 'inbound'], default: 'outbound' },
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'failed', 'undelivered', 'received', 'stop_received', 'start_received'],
    default: 'queued'
  },
  body: { type: String, default: '' },
  templateKey: { type: String, default: '' },
  sentAt: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now },
  errorCode: { type: String, default: null },
  errorMessage: { type: String, default: null }
}, { _id: false });

const emailHistorySchema = new mongoose.Schema({
  messageId: { type: String, index: true },
  status: {
    type: String,
    enum: ['queued', 'processed', 'delivered', 'open', 'click', 'bounce', 'dropped', 'deferred', 'unsubscribe'],
    default: 'queued'
  },
  subject: { type: String, default: '' },
  templateKey: { type: String, default: '' },
  sentAt: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now },
  reason: { type: String, default: null },
  clickUrl: { type: String, default: null }
}, { _id: false });

const campaignSchema = new mongoose.Schema({
  campaignId: { type: String, default: '' },
  campaignName: { type: String, default: '' },
  adSetId: { type: String, default: '' },
  adSetName: { type: String, default: '' },
  adId: { type: String, default: '' },
  adName: { type: String, default: '' },
  formId: { type: String, default: '' },
  formName: { type: String, default: '' }
}, { _id: false });

const metaLeadSchema = new mongoose.Schema({
  leadUniqueId: { type: String, unique: true, required: true, index: true },
  metaLeadId: { type: String, unique: true, required: true, index: true },
  source: {
    type: String,
    enum: ['instagram', 'facebook', 'meta_unknown', 'manual_meta_import'],
    default: 'meta_unknown',
    index: true
  },
  manualImport: { type: Boolean, default: false, index: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  phone: { type: String, default: '', index: true },
  email: { type: String, default: '', lowercase: true, trim: true, index: true },
  trade: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zipCode: { type: String, default: '' },
  campaign: { type: campaignSchema, default: () => ({}) },
  submissionTimestamp: { type: Date, default: Date.now, index: true },
  utm: {
    source: { type: String, default: '' },
    medium: { type: String, default: '' },
    campaign: { type: String, default: '' },
    term: { type: String, default: '' },
    content: { type: String, default: '' }
  },
  invitationCode: { type: String, default: '', index: true },
  invitationCodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'InviteCode', default: null },
  invitationExpiresAt: { type: Date, default: null },
  invitationRedeemedAt: { type: Date, default: null },
  invitationRedeemedByProId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pro', default: null },
  leadStatus: {
    type: String,
    enum: ['new', 'in_progress', 'registered', 'subscribed', 'closed'],
    default: 'new',
    index: true
  },
  registrationStatus: {
    type: String,
    enum: ['not_registered', 'registered', 'subscribed'],
    default: 'not_registered',
    index: true
  },
  registrationProId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pro', default: null },
  smsStatus: {
    type: String,
    enum: ['pending', 'queued', 'sent', 'delivered', 'failed', 'undelivered', 'opted_out'],
    default: 'pending',
    index: true
  },
  emailStatus: {
    type: String,
    enum: ['pending', 'queued', 'processed', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'],
    default: 'pending',
    index: true
  },
  smsOptOut: { type: Boolean, default: false, index: true },
  smsOptOutAt: { type: Date, default: null },
  smsOptInAt: { type: Date, default: null },
  followUp: { type: followUpSchema, default: () => ({}) },
  assignedRecruiter: { type: String, default: '' },
  notes: { type: String, default: '' },
  smsHistory: { type: [smsHistorySchema], default: [] },
  emailHistory: { type: [emailHistorySchema], default: [] }
}, { timestamps: true });

metaLeadSchema.index({ createdAt: -1 });
metaLeadSchema.index({ 'followUp.nextFollowUpAt': 1, 'followUp.status': 1 });
metaLeadSchema.index({ leadStatus: 1, registrationStatus: 1, createdAt: -1 });
metaLeadSchema.index({ 'campaign.campaignId': 1, source: 1, createdAt: -1 });

module.exports = mongoose.model('MetaLead', metaLeadSchema);
