/**
 * FGE Scheduler Service
 *
 * Registers node-cron jobs for background growth engine tasks:
 *  - Daily AI report (06:00)
 *  - Sitemap refresh (02:00)
 *  - Queue processing (every minute)
 *  - Seasonal campaign check (every Monday 07:00)
 *
 * All jobs are guarded by FGE_ENABLED. Jobs enqueue work items into the
 * MarketingQueue rather than performing heavy operations inline.
 */

'use strict';

const cron = require('node-cron');
const { enqueue } = require('./queue');

let started = false;

function initialize() {
  if (started) return;
  if (process.env.FGE_ENABLED !== 'true') {
    console.log('[FGE Scheduler] Skipped — FGE_ENABLED is not set.');
    return;
  }

  // ── Daily AI growth report — 06:00 every day ──────────────────────────────
  cron.schedule('0 6 * * *', async () => {
    console.log('[FGE Scheduler] Queuing daily AI report...');
    try {
      await enqueue({ type: 'ai_report', priority: 2 });
    } catch (e) {
      console.error('[FGE Scheduler] ai_report enqueue failed:', e.message);
    }
  });

  // ── Sitemap refresh — 02:00 every day ────────────────────────────────────
  cron.schedule('0 2 * * *', async () => {
    console.log('[FGE Scheduler] Queuing sitemap update...');
    try {
      await enqueue({ type: 'sitemap_update', priority: 3 });
    } catch (e) {
      console.error('[FGE Scheduler] sitemap_update enqueue failed:', e.message);
    }
  });

  // ── Seasonal campaign check — every Monday 07:00 ─────────────────────────
  cron.schedule('0 7 * * 1', async () => {
    console.log('[FGE Scheduler] Queuing seasonal campaign check...');
    try {
      await enqueue({ type: 'ai_content', priority: 5, payload: { task: 'seasonal_check' } });
    } catch (e) {
      console.error('[FGE Scheduler] seasonal_check enqueue failed:', e.message);
    }
  });

  // ── Newsletter digest — every Sunday 08:00 ────────────────────────────────
  cron.schedule('0 8 * * 0', async () => {
    console.log('[FGE Scheduler] Queuing newsletter...');
    try {
      await enqueue({ type: 'newsletter', priority: 6 });
    } catch (e) {
      console.error('[FGE Scheduler] newsletter enqueue failed:', e.message);
    }
  });

  started = true;
  console.log('[FGE Scheduler] All growth engine cron jobs registered.');
}

module.exports = { initialize };
