/**
 * FGE Queue Service
 *
 * MongoDB-backed job queue. Workers poll for pending jobs and process them.
 * Supports priorities, retries, and dead-letter logging.
 *
 * Architecture: each job type has a dedicated processor function registered
 * via `registerProcessor`. The queue worker runs on a cron schedule and
 * dispatches jobs to the matching processor.
 */

'use strict';

const cron = require('node-cron');
const crypto = require('crypto');
const MarketingQueue = require('../models/MarketingQueue');

// ─── Registry ─────────────────────────────────────────────────────────────────

/** @type {Map<string, (job: object) => Promise<any>>} */
const processors = new Map();

/**
 * Register a job processor for a given type.
 * @param {string} type       - Job type (must match MarketingQueue.type enum).
 * @param {Function} handler  - async (job) => result
 */
function registerProcessor(type, handler) {
  processors.set(type, handler);
}

// ─── Enqueue ─────────────────────────────────────────────────────────────────

/**
 * Add a job to the queue.
 * @param {object} opts
 * @param {string}  opts.type         - Job type.
 * @param {object}  [opts.payload]    - Job data.
 * @param {number}  [opts.priority=5] - 1 (high) – 10 (low).
 * @param {Date}    [opts.runAt]      - Optional scheduled time.
 * @returns {Promise<MarketingQueue document>}
 */
async function enqueue({ type, payload = {}, priority = 5, runAt }) {
  return MarketingQueue.create({
    type,
    payload,
    priority,
    runAt: runAt || new Date(),
  });
}

// ─── Worker ──────────────────────────────────────────────────────────────────

const WORKER_ID = `worker-${crypto.randomBytes(4).toString('hex')}`;
let workerRunning = false;

/**
 * Process the next batch of pending jobs.
 * Locks jobs to prevent concurrent processing.
 */
async function processBatch(batchSize = 5) {
  if (workerRunning) return;
  workerRunning = true;

  try {
    const now = new Date();
    const lockUntil = new Date(now.getTime() + 5 * 60 * 1000); // 5-minute lock

    // Claim a batch of pending/retrying jobs
    const jobs = await MarketingQueue.find({
      status: { $in: ['pending', 'retrying'] },
      runAt: { $lte: now },
      $or: [{ lockedUntil: null }, { lockedUntil: { $lte: now } }],
    })
      .sort({ priority: 1, runAt: 1 })
      .limit(batchSize)
      .lean();

    for (const job of jobs) {
      // Atomically claim the job
      const claimed = await MarketingQueue.findOneAndUpdate(
        { _id: job._id, status: { $in: ['pending', 'retrying'] } },
        {
          status: 'processing',
          startedAt: now,
          lockedUntil: lockUntil,
          workerId: WORKER_ID,
          $inc: { attempts: 1 },
        },
        { new: true }
      );

      if (!claimed) continue; // another worker got it

      const processor = processors.get(job.type);
      if (!processor) {
        await MarketingQueue.findByIdAndUpdate(job._id, {
          status: 'failed',
          error: `No processor registered for type "${job.type}"`,
          completedAt: new Date(),
        });
        continue;
      }

      try {
        const result = await processor(claimed);
        await MarketingQueue.findByIdAndUpdate(job._id, {
          status: 'completed',
          result,
          completedAt: new Date(),
          lockedUntil: null,
        });
      } catch (err) {
        const nextAttempt = claimed.attempts + 1;
        if (nextAttempt >= claimed.maxAttempts) {
          await MarketingQueue.findByIdAndUpdate(job._id, {
            status: 'failed',
            error: err.message,
            completedAt: new Date(),
            lockedUntil: null,
          });
        } else {
          // Exponential back-off: 2^attempt minutes
          const retryAt = new Date(Date.now() + Math.pow(2, nextAttempt) * 60 * 1000);
          await MarketingQueue.findByIdAndUpdate(job._id, {
            status: 'retrying',
            error: err.message,
            runAt: retryAt,
            lockedUntil: null,
          });
        }
      }
    }
  } catch (err) {
    console.error('[FGE Queue] Worker error:', err.message);
  } finally {
    workerRunning = false;
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

let workerTask = null;

/**
 * Start the queue worker cron (every minute by default).
 */
function startWorker(cronExpression = '* * * * *') {
  if (workerTask) return; // already started
  workerTask = cron.schedule(cronExpression, () => {
    processBatch().catch((err) => console.error('[FGE Queue] Batch error:', err.message));
  });
  console.log('[FGE Queue] Worker started —', cronExpression);
}

/**
 * Stop the queue worker.
 */
function stopWorker() {
  if (workerTask) {
    workerTask.stop();
    workerTask = null;
    console.log('[FGE Queue] Worker stopped.');
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Returns queue depth per type. */
async function getQueueStats() {
  return MarketingQueue.aggregate([
    { $group: { _id: { type: '$type', status: '$status' }, count: { $sum: 1 } } },
  ]);
}

module.exports = {
  registerProcessor,
  enqueue,
  processBatch,
  startWorker,
  stopWorker,
  getQueueStats,
};
