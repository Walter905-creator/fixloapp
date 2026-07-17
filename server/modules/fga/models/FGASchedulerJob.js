'use strict';

/**
 * FGASchedulerJob — Persistent Scheduler Job Record
 *
 * Records every scheduled task so the system can:
 *   - avoid creating duplicate cron jobs on restart
 *   - track execution history
 *   - detect and alert on missed / failed runs
 */

const mongoose = require('mongoose');

const FGASchedulerJobSchema = new mongoose.Schema(
  {
    // ── Identity ─────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: { type: String, default: '' },

    // ── Schedule ─────────────────────────────────────────────────────────────
    schedule: {
      type: String,
      enum: ['immediate', '5m', '30m', '1h', '24h', '3d', '7d', '30d', 'cron'],
      required: true,
    },
    cronExpression: { type: String, default: '' }, // only used when schedule === 'cron'

    // ── Payload ───────────────────────────────────────────────────────────────
    handler: { type: String, required: true }, // module path relative to FGA root
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },

    // ── State ────────────────────────────────────────────────────────────────
    isActive:  { type: Boolean, default: true, index: true },
    lastRunAt: { type: Date, default: null },
    nextRunAt: { type: Date, default: null, index: true },

    // ── Execution history (last 20 runs) ──────────────────────────────────────
    history: {
      type: [
        {
          runAt:    { type: Date },
          status:   { type: String, enum: ['success', 'failure', 'skipped'] },
          durationMs: { type: Number, default: 0 },
          error:    { type: String, default: '' },
        },
      ],
      default: [],
    },

    // ── Stats ─────────────────────────────────────────────────────────────────
    totalRuns:    { type: Number, default: 0 },
    failedRuns:   { type: Number, default: 0 },
    successRuns:  { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'fga_scheduler_jobs',
  }
);

module.exports = mongoose.model('FGASchedulerJob', FGASchedulerJobSchema);
