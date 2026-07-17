'use strict';

/**
 * FGAActivity — Activity Logger
 *
 * Tracks every meaningful user action: useful for analytics, debugging,
 * security auditing, and compliance.
 */

const mongoose = require('mongoose');

const FGAActivitySchema = new mongoose.Schema(
  {
    // ── Actor ────────────────────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    userType: {
      type: String,
      enum: ['homeowner', 'professional', 'recruiter', 'admin', 'system', 'anonymous'],
      default: 'anonymous',
      index: true,
    },

    // ── Session ──────────────────────────────────────────────────────────────
    sessionId: { type: String, default: '', index: true },

    // ── Action ───────────────────────────────────────────────────────────────
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resource:   { type: String, trim: true, default: '' },
    resourceId: { type: String, trim: true, default: '' },

    // ── Request context ───────────────────────────────────────────────────────
    ip:        { type: String, default: '' },
    userAgent: { type: String, default: '' },
    browser:   { type: String, default: '' },
    os:        { type: String, default: '' },
    device:    { type: String, default: '' },
    country:   { type: String, default: '' },
    city:      { type: String, default: '' },

    // ── Outcome ───────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['success', 'failure', 'error'],
      default: 'success',
    },
    errorMessage: { type: String, default: '' },

    // ── Metadata ─────────────────────────────────────────────────────────────
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: 'fga_activities',
  }
);

FGAActivitySchema.index({ userId: 1, timestamp: -1 });
FGAActivitySchema.index({ action: 1, timestamp: -1 });
FGAActivitySchema.index({ userType: 1, timestamp: -1 });
// TTL: auto-expire activity logs after 365 days
FGAActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model('FGAActivity', FGAActivitySchema);
