'use strict';

/**
 * FGA Analytics Service
 *
 * Atomically increments counters on the daily FGAAnalytics document.
 * All callers should use this module — never write to FGAAnalytics directly.
 *
 * Usage:
 *   const analytics = require('./analyticsService');
 *   analytics.increment('leadsTotal');
 *   analytics.increment({ emailsSent: 1, smsSent: 1 });
 */

const FGAAnalytics = require('../models/FGAAnalytics');

/**
 * Get today's date key (YYYY-MM-DD) in UTC.
 */
function _todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Atomically increment one or more counters for today's snapshot.
 *
 * @param {string|object} fieldOrMap
 *   - string: field name to increment by 1
 *   - object: map of { fieldName: incrementAmount }
 * @returns {Promise<void>}
 */
async function increment(fieldOrMap) {
  let inc;
  if (typeof fieldOrMap === 'string') {
    inc = { [fieldOrMap]: 1 };
  } else if (typeof fieldOrMap === 'object' && fieldOrMap !== null) {
    inc = fieldOrMap;
  } else {
    return;
  }

  const dateKey = _todayKey();
  try {
    await FGAAnalytics.findOneAndUpdate(
      { date: dateKey },
      { $inc: inc },
      { upsert: true }
    );
  } catch (err) {
    console.error('[FGA:Analytics] ❌ increment error:', err.message);
  }
}

/**
 * Update the rolling average response time for today.
 *
 * @param {number} durationMs  - Response time of one sample in ms
 */
async function recordResponseTime(durationMs) {
  const dateKey = _todayKey();
  try {
    // Use a two-pass approach: fetch current values then compute new avg
    const doc = await FGAAnalytics.findOneAndUpdate(
      { date: dateKey },
      { $inc: { responseTimeSamples: 1 } },
      { upsert: true, new: true }
    );

    const samples = doc.responseTimeSamples;
    const currentAvg = doc.avgResponseTimeMs || 0;
    const newAvg = currentAvg + (durationMs - currentAvg) / samples;

    await FGAAnalytics.findOneAndUpdate(
      { date: dateKey },
      { $set: { avgResponseTimeMs: Math.round(newAvg) } }
    );
  } catch (err) {
    console.error('[FGA:Analytics] ❌ recordResponseTime error:', err.message);
  }
}

/**
 * Retrieve analytics for a date range.
 *
 * @param {string} [fromDate]  - YYYY-MM-DD (inclusive), defaults to today
 * @param {string} [toDate]    - YYYY-MM-DD (inclusive), defaults to today
 * @returns {Promise<FGAAnalytics[]>}
 */
async function getRange(fromDate, toDate) {
  const from = fromDate || _todayKey();
  const to   = toDate   || _todayKey();
  return FGAAnalytics.find({ date: { $gte: from, $lte: to } })
    .sort({ date: 1 })
    .lean();
}

/**
 * Retrieve today's snapshot.
 *
 * @returns {Promise<FGAAnalytics|null>}
 */
async function getToday() {
  return FGAAnalytics.findOne({ date: _todayKey() }).lean();
}

module.exports = { increment, recordResponseTime, getRange, getToday };
