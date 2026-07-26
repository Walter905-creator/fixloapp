#!/usr/bin/env node
'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const mongoose = require('mongoose');

const LINE = '─'.repeat(100);
const DLINE = '═'.repeat(100);
const STAGE_KEYS = ['24h', '72h', '7d', '14d'];

function section(title) {
  console.log(`\n${DLINE}`);
  console.log(title);
  console.log(DLINE);
}

function sub(title) {
  console.log(`\n${LINE}`);
  console.log(title);
  console.log(LINE);
}

function pad(str, len) {
  return String(str || '').slice(0, len).padEnd(len);
}

function isValidEmail(email) {
  const value = String(email || '').trim();
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasSuccessfulHistory(history = []) {
  return (history || []).some((item) => {
    const status = String(item?.status || '').toLowerCase();
    return ['sent', 'queued', 'accepted', 'delivered', 'processed'].includes(status);
  });
}

function hasDuplicateHistory(history = []) {
  return (history || []).some((item) => String(item?.status || '').toLowerCase() === 'duplicate_attempt');
}

function buildName(lead) {
  return `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email || String(lead._id);
}

function computeNextAt(baseTime, step, timings) {
  if (!baseTime || step < 0 || step >= timings.length) return null;
  const offset = timings[step];
  if (offset === undefined) return null;
  return new Date(new Date(baseTime).getTime() + offset * 60 * 60 * 1000);
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set in server/.env');
    process.exit(1);
  }

  const dbName = mongoUri.split('/').pop().split('?')[0];

  section('FIXLO — SEND EXISTING PRO FOLLOW-UPS');
  console.log(`Database: ${dbName}`);
  console.log(`Run time: ${new Date().toISOString()}`);

  await mongoose.connect(mongoUri);
  console.log('\n✅ Connected to MongoDB');

  const MetaLead = require('../server/models/MetaLead');
  const {
    getSettings,
    processFollowUpCycle,
    normalizePhone
  } = require('../server/services/metaLeadAutomationService');

  const settings = await getSettings();
  const timings = settings.followUpTimingsHours || [24, 72, 168, 336];

  const now = new Date();
  const includeNonManual = String(process.env.INCLUDE_NON_MANUAL || '').toLowerCase() === 'true';
  const query = includeNonManual ? {} : { manualImport: true };

  const allLeads = await MetaLead.find(query).sort({ createdAt: -1 }).limit(Number(process.env.FOLLOWUP_LIMIT || 1000));

  if (!allLeads.length) {
    section('NO PRO LEADS FOUND');
    console.log(`Query: ${JSON.stringify(query)}`);
    await mongoose.disconnect();
    process.exit(0);
  }

  function isSmsAvailable(lead) {
    return Boolean(normalizePhone(lead.phone)) && !lead.smsOptOut;
  }

  function isEmailAvailable(lead) {
    return isValidEmail(lead.email) && String(lead.emailStatus || '').toLowerCase() !== 'unsubscribed';
  }

  function isDueOrUninitialized(lead, channel) {
    const nextField = channel === 'sms' ? lead.followUp?.nextSmsFollowUpAt : lead.followUp?.nextEmailFollowUpAt;
    const stepField = channel === 'sms' ? 'smsStep' : 'emailStep';
    const step = Math.max(0, Number(lead.followUp?.[stepField] || 0));
    if (step >= STAGE_KEYS.length) return false;
    if (!nextField) return true;
    return new Date(nextField) <= now;
  }

  function getSkipReasons(lead) {
    const reasons = [];
    const registrationStatus = String(lead.registrationStatus || '').toLowerCase();
    const followUpStatus = String(lead.followUp?.status || '').toLowerCase();

    if (registrationStatus && registrationStatus !== 'not_registered') reasons.push('already registered');
    if (registrationStatus === 'subscribed') reasons.push('membership active');
    if (String(lead.leadStatus || '').toLowerCase() === 'closed') reasons.push('closed');
    if (followUpStatus === 'completed') reasons.push('follow-up completed');
    if (followUpStatus === 'stopped') reasons.push('stopped');
    if (followUpStatus === 'paused') reasons.push('paused');

    const phoneRaw = String(lead.phone || '').trim();
    const emailRaw = String(lead.email || '').trim();
    const hasValidPhone = Boolean(normalizePhone(phoneRaw));
    const hasValidEmail = isValidEmail(emailRaw);

    if (phoneRaw && !hasValidPhone) reasons.push('invalid phone');
    if (emailRaw && !hasValidEmail) reasons.push('invalid email');
    if (!phoneRaw && !emailRaw) reasons.push('missing phone and email');

    if (lead.smsOptOut || String(lead.emailStatus || '').toLowerCase() === 'unsubscribed') reasons.push('opted out');

    const smsPossible = isSmsAvailable(lead) && Number(lead.followUp?.smsStep || 0) < STAGE_KEYS.length;
    const emailPossible = isEmailAvailable(lead) && Number(lead.followUp?.emailStep || 0) < STAGE_KEYS.length;

    if (!smsPossible && !emailPossible) reasons.push('missing consent');

    if (hasDuplicateHistory(lead.smsHistory) || hasDuplicateHistory(lead.emailHistory)) reasons.push('duplicate');

    return [...new Set(reasons)];
  }

  sub('PRO LEAD STATISTICS');

  const withPhone = allLeads.filter((l) => Boolean(normalizePhone(l.phone)));
  const withEmail = allLeads.filter((l) => isValidEmail(l.email));

  const smsEligibleCount = allLeads.filter(
    (l) => isSmsAvailable(l) && isDueOrUninitialized(l, 'sms') && Number(l.followUp?.smsStep || 0) < STAGE_KEYS.length
  ).length;
  const emailEligibleCount = allLeads.filter(
    (l) => isEmailAvailable(l) && isDueOrUninitialized(l, 'email') && Number(l.followUp?.emailStep || 0) < STAGE_KEYS.length
  ).length;

  console.log(`Total Pro leads found: ${allLeads.length}`);
  console.log(`Total with phone numbers: ${withPhone.length}`);
  console.log(`Total with email addresses: ${withEmail.length}`);
  console.log(`Total eligible for SMS follow-ups: ${smsEligibleCount}`);
  console.log(`Total eligible for email follow-ups: ${emailEligibleCount}`);

  const eligible = [];
  const skipped = [];

  for (const lead of allLeads) {
    const reasons = getSkipReasons(lead);

    const smsDue = isSmsAvailable(lead) && isDueOrUninitialized(lead, 'sms') && Number(lead.followUp?.smsStep || 0) < STAGE_KEYS.length;
    const emailDue = isEmailAvailable(lead) && isDueOrUninitialized(lead, 'email') && Number(lead.followUp?.emailStep || 0) < STAGE_KEYS.length;

    const hardSkip = reasons.some((r) => ['already registered', 'membership active', 'stopped', 'paused', 'follow-up completed', 'duplicate'].includes(r));
    if (hardSkip || (!smsDue && !emailDue)) {
      skipped.push({ lead, reasons: hardSkip ? reasons : [...new Set([...reasons, 'not due'])] });
      continue;
    }

    eligible.push(lead);
  }

  sub('SKIPPED PRO LEADS');
  if (!skipped.length) {
    console.log('None');
  } else {
    for (const item of skipped) {
      console.log(`${item.lead._id} | ${buildName(item.lead)} | ${item.reasons.join(' | ')}`);
    }
  }

  sub('REPAIR SCHEDULING FIELDS');
  let repaired = 0;

  for (const lead of eligible) {
    let changed = false;
    if (!lead.followUp || typeof lead.followUp !== 'object') {
      lead.followUp = {};
      changed = true;
    }

    const followUpStatus = String(lead.followUp.status || '').toLowerCase();
    if (!followUpStatus) {
      lead.followUp.status = 'active';
      changed = true;
    }

    const smsAvailable = isSmsAvailable(lead);
    const emailAvailable = isEmailAvailable(lead);

    if (lead.followUp.smsEnabled !== smsAvailable) {
      lead.followUp.smsEnabled = smsAvailable;
      changed = true;
    }
    if (lead.followUp.emailEnabled !== emailAvailable) {
      lead.followUp.emailEnabled = emailAvailable;
      changed = true;
    }

    if (smsAvailable && !lead.followUp.nextSmsFollowUpAt) {
      const smsStep = Math.max(0, Number(lead.followUp.smsStep || 0));
      const base = lead.followUp.initialSmsSentAt || lead.createdAt;
      const nextAt = computeNextAt(base, smsStep, timings);
      if (nextAt) {
        lead.followUp.smsStep = smsStep;
        lead.followUp.initialSmsSentAt = lead.followUp.initialSmsSentAt || base;
        lead.followUp.nextSmsFollowUpAt = nextAt;
        changed = true;
      }
    }

    if (emailAvailable && !lead.followUp.nextEmailFollowUpAt) {
      const emailStep = Math.max(0, Number(lead.followUp.emailStep || 0));
      const base = lead.followUp.initialEmailSentAt || lead.createdAt;
      const nextAt = computeNextAt(base, emailStep, timings);
      if (nextAt) {
        lead.followUp.emailStep = emailStep;
        lead.followUp.initialEmailSentAt = lead.followUp.initialEmailSentAt || base;
        lead.followUp.nextEmailFollowUpAt = nextAt;
        changed = true;
      }
    }

    const nextDates = [lead.followUp.nextSmsFollowUpAt, lead.followUp.nextEmailFollowUpAt]
      .filter(Boolean)
      .map((d) => new Date(d))
      .sort((a, b) => a - b);
    const nextUnified = nextDates[0] || null;

    const currentUnified = lead.followUp.nextFollowUpAt ? new Date(lead.followUp.nextFollowUpAt).getTime() : null;
    const computedUnified = nextUnified ? nextUnified.getTime() : null;

    if (currentUnified !== computedUnified) {
      lead.followUp.nextFollowUpAt = nextUnified;
      changed = true;
    }

    if (changed) {
      await lead.save();
      repaired += 1;
      console.log(`repaired: ${lead._id}`);
    }
  }

  console.log(`Scheduling fields repaired: ${repaired}`);

  const beforeMap = new Map(
    eligible.map((l) => [String(l._id), {
      smsStep: Number(l.followUp?.smsStep || 0),
      emailStep: Number(l.followUp?.emailStep || 0),
      smsCount: (l.smsHistory || []).length,
      emailCount: (l.emailHistory || []).length
    }])
  );

  section('RUNNING SCHEDULER FOLLOW-UP PIPELINE');
  const cycleResult = await processFollowUpCycle();

  const finalDocs = await MetaLead.find({ _id: { $in: allLeads.map((l) => l._id) } }).lean();
  const finalById = new Map(finalDocs.map((l) => [String(l._id), l]));

  let smsSent = 0;
  let emailsSent = 0;
  let skippedAfter = skipped.length;

  const leadRows = [];

  for (const lead of allLeads) {
    const id = String(lead._id);
    const final = finalById.get(id) || lead;
    const skippedEntry = skipped.find((s) => String(s.lead._id) === id);

    let smsStatus = '—';
    let emailStatus = '—';
    let skipReason = skippedEntry ? skippedEntry.reasons.join(' | ') : '';

    if (skippedEntry) {
      smsStatus = 'skipped';
      emailStatus = 'skipped';
    } else {
      const before = beforeMap.get(id) || { smsStep: 0, emailStep: 0, smsCount: 0, emailCount: 0 };
      const afterSmsStep = Number(final.followUp?.smsStep || 0);
      const afterEmailStep = Number(final.followUp?.emailStep || 0);
      const afterSmsCount = (final.smsHistory || []).length;
      const afterEmailCount = (final.emailHistory || []).length;

      const smsProgressed = afterSmsStep > before.smsStep || afterSmsCount > before.smsCount;
      const emailProgressed = afterEmailStep > before.emailStep || afterEmailCount > before.emailCount;

      smsStatus = smsProgressed ? 'sent' : (isSmsAvailable(final) ? 'not sent' : 'skipped');
      emailStatus = emailProgressed ? 'sent' : (isEmailAvailable(final) ? 'not sent' : 'skipped');

      if (smsProgressed) smsSent += 1;
      if (emailProgressed) emailsSent += 1;

      if (!smsProgressed && !emailProgressed) {
        skippedAfter += 1;
        if (!skipReason) {
          const reasons = getSkipReasons(final);
          skipReason = reasons.length ? reasons.join(' | ') : 'scheduler did not send in this cycle';
        }
      }
    }

    leadRows.push({
      leadId: id,
      name: buildName(final),
      phone: final.phone || '—',
      email: final.email || '—',
      smsStatus,
      emailStatus,
      skipReason
    });
  }

  section('PER-LEAD SUMMARY');
  const header = [
    pad('Lead ID', 26),
    pad('Name', 22),
    pad('Phone', 16),
    pad('Email', 30),
    pad('SMS status', 12),
    pad('Email status', 12),
    'Reason if skipped'
  ].join(' ');
  console.log(header);
  console.log('─'.repeat(header.length));

  for (const row of leadRows) {
    console.log([
      pad(row.leadId, 26),
      pad(row.name, 22),
      pad(row.phone, 16),
      pad(row.email, 30),
      pad(row.smsStatus, 12),
      pad(row.emailStatus, 12),
      row.skipReason || '—'
    ].join(' '));
  }

  section('FINAL SUMMARY');
  console.log(`Existing Pro leads found: ${allLeads.length}`);
  console.log(`Eligible: ${eligible.length}`);
  console.log(`SMS sent: ${smsSent}`);
  console.log(`Emails sent: ${emailsSent}`);
  console.log(`Skipped: ${skippedAfter}`);
  console.log(`Failed: ${cycleResult.failed || 0}`);

  console.log('\nRun command:');
  console.log('node scripts/send-existing-pro-followups.js');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err.message || err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
