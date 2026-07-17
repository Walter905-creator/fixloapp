'use strict';

/**
 * FGA Scheduler Service
 *
 * A consolidated scheduler for all FGA automation jobs.
 * Avoids duplicate cron jobs by tracking active schedules in memory.
 *
 * Supported intervals:
 *   immediate | 5m | 30m | 1h | 24h | 3d | 7d | 30d | cron
 *
 * Usage:
 *   const scheduler = require('./schedulerService');
 *   scheduler.register({
 *     name: 'daily-analytics-rollup',
 *     schedule: '24h',
 *     handler: async () => { ... },
 *   });
 *   scheduler.start();
 */

const cron = require('node-cron');

// ── Interval → cron expression map ────────────────────────────────────────────
const SCHEDULE_MAP = {
  immediate: null,           // run once immediately on registration
  '5m':   '*/5 * * * *',
  '30m':  '*/30 * * * *',
  '1h':   '0 * * * *',
  '24h':  '0 2 * * *',      // 2 AM daily
  '3d':   '0 3 */3 * *',    // 3 AM every 3 days
  '7d':   '0 4 * * 0',      // 4 AM every Sunday
  '30d':  '0 5 1 * *',      // 5 AM first of each month
};

// ── Registry ─────────────────────────────────────────────────────────────────
const _jobs = new Map();   // name → { task, opts }
let _started = false;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function _execute(name, handler, payload = {}) {
  const start = Date.now();
  console.log(`[FGA:Scheduler] ▶  Running job "${name}"`);
  try {
    await handler(payload);
    const ms = Date.now() - start;
    console.log(`[FGA:Scheduler] ✅ Job "${name}" completed in ${ms}ms`);
  } catch (err) {
    console.error(`[FGA:Scheduler] ❌ Job "${name}" failed: ${err.message}`);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Register a new scheduled job.
 * No-ops if a job with the same name is already registered.
 *
 * @param {object}   opts
 * @param {string}    opts.name        - Unique job name
 * @param {string}    opts.schedule    - Interval key or 'cron'
 * @param {Function}  opts.handler     - Async function to run
 * @param {string}    [opts.cronExpr]  - Cron expression (required when schedule === 'cron')
 * @param {object}    [opts.payload]   - Passed to handler on each invocation
 * @param {string}    [opts.timezone]  - Cron timezone (default: America/New_York)
 */
function register(opts = {}) {
  const { name, schedule, handler, cronExpr, payload = {}, timezone = 'America/New_York' } = opts;

  if (!name || !schedule || typeof handler !== 'function') {
    console.warn('[FGA:Scheduler] ⚠️ register() requires name, schedule, and handler');
    return;
  }

  if (_jobs.has(name)) {
    console.log(`[FGA:Scheduler] ℹ️  Job "${name}" already registered — skipping`);
    return;
  }

  _jobs.set(name, { opts, cronTask: null });
  console.log(`[FGA:Scheduler] ✅ Job registered: "${name}" (schedule: ${schedule})`);

  // If already started, activate immediately
  if (_started) _activate(name);
}

/**
 * Activate (start) a registered job's cron task.
 */
function _activate(name) {
  const entry = _jobs.get(name);
  if (!entry) return;
  const { opts } = entry;
  const { schedule, handler, cronExpr, payload = {}, timezone = 'America/New_York' } = opts;

  if (schedule === 'immediate') {
    _execute(name, handler, payload);
    return;
  }

  const expr = schedule === 'cron' ? cronExpr : SCHEDULE_MAP[schedule];
  if (!expr) {
    console.warn(`[FGA:Scheduler] ⚠️ Unknown schedule "${schedule}" for job "${name}"`);
    return;
  }

  const task = cron.schedule(expr, () => _execute(name, handler, payload), {
    scheduled: true,
    timezone,
  });

  entry.cronTask = task;
  console.log(`[FGA:Scheduler] ⏱  Job "${name}" scheduled (${expr})`);
}

/**
 * Start all registered jobs.
 * Must be called after MongoDB connects.
 */
function start() {
  if (_started) {
    console.log('[FGA:Scheduler] ℹ️  Already started');
    return;
  }
  _started = true;
  for (const name of _jobs.keys()) {
    _activate(name);
  }
  console.log(`[FGA:Scheduler] 🚀 Started — ${_jobs.size} job(s) activated`);
}

/**
 * Stop all active cron tasks (e.g. for graceful shutdown).
 */
function stop() {
  for (const [name, entry] of _jobs.entries()) {
    if (entry.cronTask) {
      entry.cronTask.destroy();
      console.log(`[FGA:Scheduler] 🛑 Job "${name}" stopped`);
    }
  }
  _started = false;
}

/**
 * List all registered job names.
 */
function list() {
  return [..._jobs.keys()];
}

module.exports = { register, start, stop, list };
