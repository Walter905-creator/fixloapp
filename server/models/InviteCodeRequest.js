/**
 * InviteCodeRequest Model
 *
 * Recruiters can submit a request asking admin to generate a promotional
 * invitation code on their behalf. Admins can approve or reject each request.
 * Only an approved request allows an admin to generate the code.
 */
const mongoose = require('mongoose');

const inviteCodeRequestSchema = new mongoose.Schema({
  // ── Requester ────────────────────────────────────────────────────────────────
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruiterProfile',
    required: true
  },
  requesterName: { type: String, trim: true },
  requesterEmail: { type: String, lowercase: true, trim: true },

  // ── Request details ──────────────────────────────────────────────────────────
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  // Suggested membership duration the recruiter is requesting
  requestedDuration: {
    type: String,
    enum: ['30days', '90days', '6months', '12months', 'unlimited'],
    default: '12months'
  },
  // Optional target (who the recruiter wants the code for)
  targetName: { type: String, trim: true },
  targetEmail: { type: String, lowercase: true, trim: true },
  targetPhone: { type: String, trim: true },
  targetState: { type: String, trim: true },
  targetTrade: { type: String, trim: true },

  // ── Admin review ─────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: { type: String, trim: true, default: '' },
  reviewedBy: { type: String, trim: true, default: null }, // admin email
  reviewedAt: { type: Date, default: null },

  // ── Generated code (set after admin approves and generates the code) ─────────
  generatedCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InviteCode',
    default: null
  },
  generatedCode: { type: String, default: null }
}, {
  timestamps: true
});

// Indexes for admin list / recruiter list queries
inviteCodeRequestSchema.index({ status: 1, createdAt: -1 });
inviteCodeRequestSchema.index({ requestedBy: 1, createdAt: -1 });

module.exports = mongoose.model('InviteCodeRequest', inviteCodeRequestSchema);
