'use strict';

/**
 * FGATimeline — Growth Timeline Entry
 *
 * Every Lead accumulates a permanent timeline of every event that touched it.
 * Entries are append-only — nothing is deleted or mutated.
 */

const mongoose = require('mongoose');

const FGATimelineSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FGALead',
      required: true,
      index: true,
    },

    // ── Event classification ─────────────────────────────────────────────────
    eventType: {
      type: String,
      required: true,
      index: true,
    },

    // ── Actor ────────────────────────────────────────────────────────────────
    actor: {
      type: {
        type: String,
        enum: ['system', 'admin', 'pro', 'homeowner', 'recruiter', 'automation'],
        default: 'system',
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      label: {
        type: String,
        default: 'System',
      },
    },

    // ── Free-form metadata ───────────────────────────────────────────────────
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
    collection: 'fga_timeline',
  }
);

FGATimelineSchema.index({ leadId: 1, timestamp: -1 });
FGATimelineSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model('FGATimeline', FGATimelineSchema);
