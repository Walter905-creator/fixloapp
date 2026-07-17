'use strict';

/**
 * FGACRMProfile — Unified CRM Profile
 *
 * One CRM profile per person, regardless of their role (homeowner, professional,
 * recruiter).  Links all activity, messages, jobs, referrals, and payments
 * to a single entity for 360° visibility.
 */

const mongoose = require('mongoose');

const FGACRMProfileSchema = new mongoose.Schema(
  {
    // ── Person type + linked platform record ──────────────────────────────────
    profileType: {
      type: String,
      enum: ['homeowner', 'professional', 'recruiter'],
      required: true,
      index: true,
    },
    linkedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    linkedModel: {
      type: String,
      enum: ['Homeowner', 'Pro', 'RecruiterProfile'],
      required: true,
    },

    // ── Contact snapshot (denormalised for fast CRM queries) ─────────────────
    name:  { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '', index: true },
    phone: { type: String, trim: true, default: '' },
    city:  { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },

    // ── FGA Lead reference ───────────────────────────────────────────────────
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FGALead',
      default: null,
    },

    // ── Classification ───────────────────────────────────────────────────────
    tags:  { type: [String], default: [] },
    notes: { type: [String], default: [] },

    // ── Status ───────────────────────────────────────────────────────────────
    lifetimeValue: { type: Number, default: 0 },
    jobCount:      { type: Number, default: 0 },
    reviewCount:   { type: Number, default: 0 },
    referralCount: { type: Number, default: 0 },

    // ── Activity summary ─────────────────────────────────────────────────────
    lastActivityAt: { type: Date, default: null },
    lastMessageAt:  { type: Date, default: null },
    lastJobAt:      { type: Date, default: null },

    // ── Metadata ─────────────────────────────────────────────────────────────
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: 'fga_crm_profiles',
  }
);

// Compound unique index: one profile per linked record
FGACRMProfileSchema.index({ profileType: 1, linkedId: 1 }, { unique: true });
FGACRMProfileSchema.index({ email: 1, profileType: 1 });
FGACRMProfileSchema.index({ lastActivityAt: -1 });

module.exports = mongoose.model('FGACRMProfile', FGACRMProfileSchema);
