'use strict';

/**
 * Automatically enrolls and repairs manually imported Meta Pro leads so the
 * existing production follow-up scheduler can send SMS and email reminders.
 */

const cron = require('node-cron');
const mongoose = require('mongoose');

const STAGE_COUNT = 4;
const IMMEDIATE_DUE_OFFSET_MS = 60 * 1000;
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

function isFutureDate(value, now) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > now.getTime();
}

async function repairMissingProFollowUpSchedules() {
  if (repairRunning || mongoose.connection.readyState !== 1) {
    return { repaired: 0, enrolled: 0, forcedDue: 0, skipped: true };
  }

  repairRunning = true;

  try {
    const MetaLead = require('../models/MetaLead');
    const { getSettings, normalizePhone } = require('./metaLeadAutomationService');
    const settings = await getSettings();

    if (!settings.enabled || !settings.automaticReminders) {
      return {
        repaired: 0,
        enrolled: 0,
        forcedDue: 0,
        skipped: true,
        reason: 'automation_disabled'
      };
    }

    const timings = settings.followUpTimingsHours || [24, 72, 168, 336];
    const leads = await MetaLead.find({
      registrationStatus: { $in: ['not_registered', null, ''] },
      leadStatus: { $nin: ['closed', 'registered', 'subscribed'] },
      $or: [
        { manualImport: true },
        { 'followUp.nextSmsFollowUpAt': null },
        { 'followUp.nextSmsFollowUpAt': { $exists: false } },
        { 'followUp.nextEmailFollowUpAt': null },
        { 'followUp.nextEmailFollowUpAt': { $exists: false } },
        { 'followUp.nextFollowUpAt': null },
        { 'followUp.nextFollowUpAt': { $exists: false } }
      ]
    }).limit(500);

    let repaired = 0;
    let enrolled = 0;
    let forcedDue = 0;

    for (const lead of leads) {
      const followUpStatus = String(lead.followUp?.status || '').toLowerCase();
      if (['stopped', 'paused', 'completed'].includes(followUpStatus)) continue;

      let changed = false;

      if (!lead.followUp || Array.isArray(lead.followUp) || typeof lead.followUp !== 'object') {
        lead.followUp = {};
        changed = true;
      }

      if (!followUpStatus) {
        lead.followUp.status = 'active';
        enrolled += 1;
        changed = true;
      }

      if (!lead.registrationStatus) {
        lead.registrationStatus = 'not_registered';
        changed = true;
      }

      const smsStep = Math.max(0, Number(lead.followUp.smsStep || 0));
      const emailStep = Math.max(0, Number(lead.followUp.emailStep || 0));
      const smsAvailable = Boolean(normalizePhone(lead.phone))
        && !lead.smsOptOut
        && smsStep < STAGE_COUNT;
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
        const base = lead.followUp.initialSmsSentAt || lead.createdAt || new Date();
        const scheduled = nextDate(base, smsStep, timings);
        if (scheduled) {
          lead.followUp.smsStep = smsStep;
          lead.followUp.nextSmsFollowUpAt = scheduled;
          changed = true;
        }
      }

      if (emailAvailable && !lead.followUp.nextEmailFollowUpAt) {
        const base = lead.followUp.initialEmailSentAt || lead.createdAt || new Date();
        const scheduled = nextDate(base, emailStep, timings);
        if (scheduled) {
          lead.followUp.emailStep = emailStep;
          lead.followUp.nextEmailFollowUpAt = scheduled;
          changed = true;
        }
      }

      // Existing manually imported leads were already initialized with future
      // dates, so the normal scheduler kept returning Candidates: 0. Make each
      // eligible manual lead due once, then persist a marker so later repair
      // cycles never keep forcing the schedule backward.
      if (lead.manualImport === true && !lead.followUp.manualImportImmediateEnrollmentAt) {
        const now = new Date();
        const dueAt = new Date(now.getTime() - IMMEDIATE_DUE_OFFSET_MS);
        let madeDue = false;

        if (smsAvailable && (!lead.followUp.nextSmsFollowUpAt || isFutureDate(lead.followUp.nextSmsFollowUpAt, now))) {
          lead.followUp.nextSmsFollowUpAt = dueAt;
          madeDue = true;
        }

        if (emailAvailable && (!lead.followUp.nextEmailFollowUpAt || isFutureDate(lead.followUp.nextEmailFollowUpAt, now))) {
          lead.followUp.nextEmailFollowUpAt = dueAt;
          madeDue = true;
        }

        lead.followUp.manualImportImmediateEnrollmentAt = now;
        changed = true;

        if (madeDue) forcedDue += 1;
      }

      const dates = [lead.followUp.nextSmsFollowUpAt, lead.followUp.nextEmailFollowUpAt]
        .filter(Boolean)
        .map((date) => new Date(date))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => a - b);

      const unified = dates[0] || null;
      const currentTime = lead.followUp.nextFollowUpAt
        ? new Date(lead.followUp.nextFollowUpAt).getTime()
        : null;
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

    console.log(
      `[PRO_FOLLOWUP_REPAIR] Scanned ${leads.length}; enrolled ${enrolled}; `
      + `forced due ${forcedDue}; repaired ${repaired}.`
    );

    return { repaired, enrolled, forcedDue, scanned: leads.length };
  } catch (error) {
    console.error(`[PRO_FOLLOWUP_REPAIR] Failed: ${error.message}`);
    return { repaired: 0, enrolled: 0, forcedDue: 0, error: error.message };
  } finally {
    repairRunning = false;
  }
}

const startupTimer = setTimeout(() => {
  repairMissingProFollowUpSchedules().catch(() => {});
}, 30000);
startupTimer.unref?.();

cron.schedule('2-59/5 * * * *', () => {
  repairMissingProFollowUpSchedules().catch(() => {});
}, { scheduled: true, timezone: 'America/New_York' });

module.exports = { repairMissingProFollowUpSchedules };
