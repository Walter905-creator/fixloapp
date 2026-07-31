'use strict';

/**
 * Automatically repairs missing Meta Pro lead follow-up dates.
 *
 * The normal scheduler only selects leads whose next follow-up date is due.
 * Older/manual imports can have null scheduling fields, so MongoDB never
 * returns them. This lightweight worker repairs only active, unregistered,
 * reachable leads. The existing scheduler then sends the messages using the
 * production delivery and idempotency logic.
 */

const cron = require('node-cron');
const mongoose = require('mongoose');

const STAGE_COUNT = 4;
let repairRunning = false;

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function nextDate(base, step, timings) {
  if (!base || step < 0 || step >= STAGE_COUNT) return null;
  const hours = Number(timings[step]);
  if (!Number.isFinite(hours)) return null;
  return new Date(new Date(base).getTime() + hours * 60 * 60 * 1000);
}

async function repairMissingProFollowUpSchedules() {
  if (repairRunning || mongoose.connection.readyState !== 1) return { repaired: 0, skipped: true };
  repairRunning = true;

  try {
    const MetaLead = require('../models/MetaLead');
    const { getSettings, normalizePhone } = require('./metaLeadAutomationService');
    const settings = await getSettings();

    if (!settings.enabled || !settings.automaticReminders) {
      return { repaired: 0, skipped: true, reason: 'automation_disabled' };
    }

    const timings = settings.followUpTimingsHours || [24, 72, 168, 336];
    const leads = await MetaLead.find({
      'followUp.status': 'active',
      registrationStatus: 'not_registered',
      leadStatus: { $nin: ['closed', 'registered', 'subscribed'] },
      $or: [
        { 'followUp.nextSmsFollowUpAt': null },
        { 'followUp.nextSmsFollowUpAt': { $exists: false } },
        { 'followUp.nextEmailFollowUpAt': null },
        { 'followUp.nextEmailFollowUpAt': { $exists: false } },
        { 'followUp.nextFollowUpAt': null },
        { 'followUp.nextFollowUpAt': { $exists: false } }
      ]
    }).limit(250);

    let repaired = 0;

    for (const lead of leads) {
      let changed = false;
      const smsStep = Math.max(0, Number(lead.followUp?.smsStep || 0));
      const emailStep = Math.max(0, Number(lead.followUp?.emailStep || 0));
      const smsAvailable = Boolean(normalizePhone(lead.phone)) && !lead.smsOptOut && smsStep < STAGE_COUNT;
      const emailAvailable = validEmail(lead.email)
        && String(lead.emailStatus || '').toLowerCase() !== 'unsubscribed'
        && emailStep < STAGE_COUNT;

      if (lead.followUp.smsEnabled !== smsAvailable) {
        lead.followUp.smsEnabled = smsAvailable;
        changed = true;
      }
      if (lead.followUp.emailEnabled !== emailAvailable) {
        lead.followUp.emailEnabled = emailAvailable;
        changed = true;
      }

      if (smsAvailable && !lead.followUp.nextSmsFollowUpAt) {
        const base = lead.followUp.initialSmsSentAt || lead.createdAt;
        const scheduled = nextDate(base, smsStep, timings);
        if (scheduled) {
          lead.followUp.smsStep = smsStep;
          lead.followUp.nextSmsFollowUpAt = scheduled;
          changed = true;
        }
      }

      if (emailAvailable && !lead.followUp.nextEmailFollowUpAt) {
        const base = lead.followUp.initialEmailSentAt || lead.createdAt;
        const scheduled = nextDate(base, emailStep, timings);
        if (scheduled) {
          lead.followUp.emailStep = emailStep;
          lead.followUp.nextEmailFollowUpAt = scheduled;
          changed = true;
        }
      }

      const dates = [lead.followUp.nextSmsFollowUpAt, lead.followUp.nextEmailFollowUpAt]
        .filter(Boolean)
        .map((date) => new Date(date))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => a - b);
      const unified = dates[0] || null;
      const currentTime = lead.followUp.nextFollowUpAt ? new Date(lead.followUp.nextFollowUpAt).getTime() : null;
      const unifiedTime = unified ? unified.getTime() : null;

      if (currentTime !== unifiedTime) {
        lead.followUp.nextFollowUpAt = unified;
        changed = true;
      }

      if (!smsAvailable && !emailAvailable) continue;
      if (changed) {
        await lead.save();
        repaired += 1;
      }
    }

    if (repaired > 0) {
      console.log(`[PRO_FOLLOWUP_REPAIR] Repaired ${repaired} lead schedule(s); normal follow-up scheduler will process them.`);
    }
    return { repaired, scanned: leads.length };
  } catch (error) {
    console.error(`[PRO_FOLLOWUP_REPAIR] Failed: ${error.message}`);
    return { repaired: 0, error: error.message };
  } finally {
    repairRunning = false;
  }
}

// Run shortly after startup, once MongoDB has had time to connect.
const startupTimer = setTimeout(() => {
  repairMissingProFollowUpSchedules().catch(() => {});
}, 30000);
startupTimer.unref?.();

// Run two minutes before the existing five-minute follow-up cycle.
cron.schedule('2-59/5 * * * *', () => {
  repairMissingProFollowUpSchedules().catch(() => {});
}, { scheduled: true, timezone: 'America/New_York' });

module.exports = { repairMissingProFollowUpSchedules };
