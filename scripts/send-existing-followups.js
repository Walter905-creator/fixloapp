#!/usr/bin/env node
'use strict';

/**
 * scripts/send-existing-followups.js
 *
 * One-time admin script: find every existing MetaLead and immediately send
 * any pending follow-up SMS and email messages.
 *
 * Design constraints:
 *  - Reuses processFollowUpCycle() (the exact function used by META_FOLLOWUP scheduler)
 *  - No SMS / email logic is duplicated; only tracking fields are repaired inline
 *  - Opt-out rules (smsOptOut, email unsubscribed) are fully respected
 *  - Idempotency keys in sendLeadSms / sendLeadEmail prevent duplicate sends
 *  - Safe to run multiple times; already-processed stages are skipped automatically
 *
 * Usage:
 *   node scripts/send-existing-followups.js
 *
 * Prerequisites:
 *   MONGODB_URI must be set in server/.env (or as an environment variable).
 */

const path = require('path');

// Load environment variables from server/.env
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const mongoose = require('mongoose');

// ── Formatting helpers ────────────────────────────────────────────────────────
const LINE = '─'.repeat(80);
const DLINE = '═'.repeat(80);

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

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('\n❌  MONGODB_URI is not set.');
    console.error('    Add it to server/.env or export it as an environment variable.\n');
    process.exit(1);
  }

  // Extract the DB name from the URI (without exposing credentials)
  const dbName = mongoUri.split('/').pop().split('?')[0];

  section('FIXLO — SEND EXISTING FOLLOW-UPS');
  console.log(`Collection:   MetaLead`);
  console.log(`Database:     ${dbName}`);
  console.log(`Run time:     ${new Date().toISOString()}`);

  // ── Connect ─────────────────────────────────────────────────────────────────
  await mongoose.connect(mongoUri);
  console.log('\n✅  Connected to MongoDB.');

  // Load server-side modules AFTER connecting so Mongoose models register correctly
  const MetaLead = require('../server/models/MetaLead');
  const {
    getSettings,
    processFollowUpCycle,
    normalizePhone
  } = require('../server/services/metaLeadAutomationService');

  // ── Settings ─────────────────────────────────────────────────────────────────
  const settings = await getSettings();

  if (!settings.enabled) {
    console.log('\n⚠️   META_LEAD AUTOMATION IS DISABLED in AdminSettings.');
    console.log('    processFollowUpCycle() will exit immediately without sending anything.');
    console.log('    Enable it via the admin panel (Settings → Meta Lead Automation)');
    console.log('    and re-run this script.\n');
  }

  const FOLLOW_UP_TIMINGS = settings.followUpTimingsHours || [24, 72, 168, 336];
  const STAGE_KEYS = ['24h', '72h', '7d', '14d'];

  // ── Step 1: Load ALL leads ───────────────────────────────────────────────────
  const MONGO_QUERY = {};

  // Use FOLLOWUP_LIMIT env var to override. Default covers any realistic production collection.
  const LEAD_LIMIT = Number(process.env.FOLLOWUP_LIMIT || 10000);
  console.log(`\nMongo query: MetaLead.find(${JSON.stringify(MONGO_QUERY)}) (limit ${LEAD_LIMIT})`);
  console.log('  Override limit: FOLLOWUP_LIMIT=<n> node scripts/send-existing-followups.js\n');
  const allLeads = await MetaLead.find(MONGO_QUERY).sort({ createdAt: -1 }).limit(LEAD_LIMIT);

  if (allLeads.length === 0) {
    section('NO LEADS FOUND');
    console.log(`Collection searched: MetaLead`);
    console.log(`Database name:       ${dbName}`);
    console.log(`Mongo URI DB name:   ${dbName}`);
    console.log(`Exact Mongo query:   MetaLead.find({})`);
    console.log('\nThe collection is empty. No documents exist in MetaLead.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // ── Step 2: Statistics ───────────────────────────────────────────────────────
  sub('LEAD STATISTICS');

  const withPhone = allLeads.filter(l => Boolean(normalizePhone(l.phone)));
  const withEmail = allLeads.filter(l => Boolean(String(l.email || '').trim()));
  const withSmsOptOut = allLeads.filter(l => l.smsOptOut);
  const withEmailUnsub = allLeads.filter(
    l => String(l.emailStatus || '').toLowerCase() === 'unsubscribed'
  );
  // "SMS consent" — not opted out and has phone
  const withSmsConsent = allLeads.filter(l => Boolean(normalizePhone(l.phone)) && !l.smsOptOut);
  // "Email consent" — not unsubscribed and has email
  const withEmailConsent = allLeads.filter(
    l =>
      Boolean(String(l.email || '').trim()) &&
      String(l.emailStatus || '').toLowerCase() !== 'unsubscribed'
  );

  console.log(`Total homeowner leads found : ${allLeads.length}`);
  console.log(`With phone numbers          : ${withPhone.length}`);
  console.log(`With email addresses        : ${withEmail.length}`);
  console.log(`With SMS consent            : ${withSmsConsent.length}`);
  console.log(`With email consent          : ${withEmailConsent.length}`);
  console.log(`SMS opted-out               : ${withSmsOptOut.length}`);
  console.log(`Email unsubscribed          : ${withEmailUnsub.length}`);

  // ── Step 3: Diagnose each lead ───────────────────────────────────────────────
  sub('LEAD DIAGNOSTICS');

  /**
   * Returns the computed next follow-up Date for a given step,
   * measured from baseTime (initialSentAt or createdAt).
   */
  function computeNextAt(baseTime, step) {
    const hourOffset = FOLLOW_UP_TIMINGS[step];
    if (hourOffset === undefined || !baseTime) return null;
    return new Date(new Date(baseTime).getTime() + hourOffset * 60 * 60 * 1000);
  }

  function isSmsAvailable(lead) {
    return Boolean(normalizePhone(lead.phone)) && !lead.smsOptOut;
  }

  function isEmailAvailable(lead) {
    return (
      Boolean(String(lead.email || '').trim()) &&
      String(lead.emailStatus || '').toLowerCase() !== 'unsubscribed'
    );
  }

  /**
   * Determine why a lead is ineligible.
   * Returns an array of reason strings (empty = eligible).
   */
  function getExclusionReasons(lead) {
    const reasons = [];
    if (lead.registrationStatus && lead.registrationStatus !== 'not_registered') {
      reasons.push(`registration_status=${lead.registrationStatus}`);
    }
    if (lead.leadStatus === 'closed') {
      reasons.push('lead_status=closed');
    }
    const fus = lead.followUp?.status;
    if (fus === 'completed') {
      reasons.push('followup_status=completed (all stages sent)');
    }
    if (fus === 'stopped') {
      reasons.push(
        `followup_status=stopped (reason: ${lead.followUp?.stoppedReason || 'unknown'})`
      );
    }
    if (fus === 'paused') {
      reasons.push('followup_status=paused');
    }
    if (!normalizePhone(lead.phone) && !String(lead.email || '').trim()) {
      reasons.push('missing_phone_and_email');
    } else {
      if (!normalizePhone(lead.phone)) reasons.push('missing_phone (SMS unavailable)');
      if (!String(lead.email || '').trim()) reasons.push('missing_email (email unavailable)');
      if (lead.smsOptOut) reasons.push('sms_opted_out');
      if (String(lead.emailStatus || '').toLowerCase() === 'unsubscribed')
        reasons.push('email_unsubscribed');
    }

    const smsStepsDone = Number(lead.followUp?.smsStep || 0);
    const emailStepsDone = Number(lead.followUp?.emailStep || 0);
    const smsPossible = isSmsAvailable(lead) && smsStepsDone < STAGE_KEYS.length;
    const emailPossible = isEmailAvailable(lead) && emailStepsDone < STAGE_KEYS.length;

    if (!smsPossible && !emailPossible && reasons.length === 0) {
      reasons.push('all_followup_stages_exhausted');
    }

    return reasons;
  }

  const eligible = [];
  const skippedLeads = [];
  const now = new Date();

  for (const lead of allLeads) {
    const isRegistered =
      lead.registrationStatus && lead.registrationStatus !== 'not_registered';
    const isClosed = lead.leadStatus === 'closed';
    const isCompleted = lead.followUp?.status === 'completed';
    const isStopped = lead.followUp?.status === 'stopped';
    const hasNoChannels = !isSmsAvailable(lead) && !isEmailAvailable(lead);

    const smsStepsDone = Number(lead.followUp?.smsStep || 0);
    const emailStepsDone = Number(lead.followUp?.emailStep || 0);
    const smsPossible = isSmsAvailable(lead) && smsStepsDone < STAGE_KEYS.length;
    const emailPossible = isEmailAvailable(lead) && emailStepsDone < STAGE_KEYS.length;

    const hardExcluded =
      isRegistered || isClosed || isCompleted || isStopped || hasNoChannels;
    const noPossibleChannel = !smsPossible && !emailPossible;

    if (hardExcluded || noPossibleChannel) {
      skippedLeads.push({ lead, reasons: getExclusionReasons(lead) });
    } else {
      eligible.push(lead);
    }
  }

  console.log(`Eligible for follow-up  : ${eligible.length}`);
  console.log(`Excluded / skipped      : ${skippedLeads.length}`);

  if (eligible.length === 0) {
    section('NO ELIGIBLE LEADS');
    console.log('All leads are excluded. Exclusion details:\n');
    printSkippedDetail(skippedLeads);
    await mongoose.disconnect();
    process.exit(0);
  }

  // ── Step 4: Repair follow-up scheduling state ────────────────────────────────
  //
  // processFollowUpCycle() queries:
  //   { followUp.status: 'active', leadStatus: { $nin: ['closed'] },
  //     registrationStatus: 'not_registered',
  //     $or: [ nextSmsFollowUpAt <= now, nextEmailFollowUpAt <= now, nextFollowUpAt <= now ] }
  //
  // Leads that were manually created or imported before follow-up was fully
  // initialised may have:
  //   - followUp.status != 'active'   → query misses them
  //   - nextSmsFollowUpAt == null      → $lte null never matches
  //
  // We compute the correct dates from createdAt + step offset (same formula
  // used by processLeadFollowUp) and save them so processFollowUpCycle can
  // find and process each lead immediately.
  //
  // sendLeadSms / sendLeadEmail contain idempotency-key guards that prevent
  // duplicate messages for any stage already successfully sent.

  sub('REPAIRING FOLLOW-UP SCHEDULING STATE');

  let repairedCount = 0;

  for (const lead of eligible) {
    let changed = false;

    // Guard: the schema defines followUp with default:{} but the value can be
    // missing on documents created before the field was added to the schema.
    if (!lead.followUp || typeof lead.followUp !== 'object') {
      lead.followUp = {};
    }

    // 1. Ensure the sequence status is active (not null / undefined)
    if (lead.followUp.status !== 'active' && lead.followUp.status !== 'paused') {
      lead.followUp.status = 'active';
      changed = true;
    }

    const smsAvail = isSmsAvailable(lead);
    const emailAvail = isEmailAvailable(lead);

    // 2. Align smsEnabled / emailEnabled with actual channel availability
    if (lead.followUp.smsEnabled !== smsAvail) {
      lead.followUp.smsEnabled = smsAvail;
      changed = true;
    }
    if (lead.followUp.emailEnabled !== emailAvail) {
      lead.followUp.emailEnabled = emailAvail;
      changed = true;
    }

    // 3. Compute nextSmsFollowUpAt if missing
    if (smsAvail && !lead.followUp.nextSmsFollowUpAt) {
      const smsStep = Math.max(0, Number(lead.followUp.smsStep || 0));
      const base = lead.followUp.initialSmsSentAt || lead.createdAt || new Date();
      const nextAt = computeNextAt(base, smsStep);
      if (nextAt) {
        lead.followUp.smsStep = smsStep;
        lead.followUp.smsEnabled = true;
        lead.followUp.nextSmsFollowUpAt = nextAt;
        if (!lead.followUp.initialSmsSentAt) lead.followUp.initialSmsSentAt = base;
        changed = true;
      }
    }

    // 4. Compute nextEmailFollowUpAt if missing
    if (emailAvail && !lead.followUp.nextEmailFollowUpAt) {
      const emailStep = Math.max(0, Number(lead.followUp.emailStep || 0));
      const base = lead.followUp.initialEmailSentAt || lead.createdAt || new Date();
      const nextAt = computeNextAt(base, emailStep);
      if (nextAt) {
        lead.followUp.emailStep = emailStep;
        lead.followUp.emailEnabled = true;
        lead.followUp.nextEmailFollowUpAt = nextAt;
        if (!lead.followUp.initialEmailSentAt) lead.followUp.initialEmailSentAt = base;
        changed = true;
      }
    }

    // 5. Sync the legacy nextFollowUpAt pointer
    const candidateDates = [
      lead.followUp.nextSmsFollowUpAt,
      lead.followUp.nextEmailFollowUpAt
    ]
      .filter(Boolean)
      .map(d => new Date(d))
      .sort((a, b) => a - b);

    const computedNext = candidateDates[0] || null;
    if (String(lead.followUp.nextFollowUpAt) !== String(computedNext)) {
      lead.followUp.nextFollowUpAt = computedNext;
      changed = true;
    }

    if (changed) {
      await lead.save();
      repairedCount += 1;
      const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email || String(lead._id);
      console.log(
        `  ✔  ${lead._id}  ${name}`
        + `  smsEnabled=${smsAvail}`
        + `  emailEnabled=${emailAvail}`
        + `  nextSms=${lead.followUp.nextSmsFollowUpAt ? lead.followUp.nextSmsFollowUpAt.toISOString() : 'none'}`
        + `  nextEmail=${lead.followUp.nextEmailFollowUpAt ? lead.followUp.nextEmailFollowUpAt.toISOString() : 'none'}`
      );
    } else {
      const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email || String(lead._id);
      console.log(`  ✓  ${lead._id}  ${name}  (no repair needed)`);
    }
  }

  console.log(`\n  Leads repaired: ${repairedCount}`);

  // ── Step 5: Run processFollowUpCycle ─────────────────────────────────────────
  //
  // This is the EXACT same function the META_FOLLOWUP scheduler calls every 5 min.
  // It internally calls processLeadFollowUp → sendLeadSms / sendLeadEmail.
  // No SMS or email logic is duplicated.
  // Idempotency keys prevent any duplicate messages.

  section('RUNNING processFollowUpCycle()');

  const cycleResult = await processFollowUpCycle();

  console.log(`\nCycle output:`);
  console.log(`  Candidates found      : (see [META_FOLLOWUP] log above)`);
  console.log(`  Processed             : ${cycleResult.processed || 0}`);
  console.log(`  SMS sent              : ${cycleResult.smsSent || 0}`);
  console.log(`  Emails sent           : ${cycleResult.emailSent || 0}`);
  console.log(`  Skipped               : ${cycleResult.skipped || 0}`);
  console.log(`  Failed                : ${cycleResult.failed || 0}`);

  // ── Step 6: Re-fetch leads for per-lead output ───────────────────────────────
  const eligibleIds = eligible.map(l => l._id);
  const finalDocs = await MetaLead.find({ _id: { $in: eligibleIds } }).lean();
  const finalMap = Object.fromEntries(finalDocs.map(l => [String(l._id), l]));

  section('PER-LEAD SUMMARY');

  const COL = [28, 24, 17, 32, 18, 18, 10];
  const header = [
    pad('Lead ID', COL[0]),
    pad('Customer name', COL[1]),
    pad('Phone', COL[2]),
    pad('Email', COL[3]),
    pad('SMS status', COL[4]),
    pad('Email status', COL[5]),
    pad('FU status', COL[6])
  ].join(' ');

  console.log(header);
  console.log('─'.repeat(header.length));

  for (const lead of eligible) {
    const f = finalMap[String(lead._id)] || lead;
    const name = `${f.firstName || ''} ${f.lastName || ''}`.trim() || f.email || String(f._id);
    const phone = f.phone || '—';
    const email = f.email || '—';

    const smsHistory = (f.smsHistory || []).filter(h => h.direction === 'outbound');
    const emailHistory = f.emailHistory || [];
    const lastSms = smsHistory.slice().reverse()[0] || null;
    const lastEmail = emailHistory.slice().reverse()[0] || null;

    const smsStatus = lastSms
      ? `${lastSms.status || 'sent'} [${lastSms.followUpStage || lastSms.templateKey || '?'}]`
      : '— not sent';
    const emailStatus = lastEmail
      ? `${lastEmail.status || 'sent'} [${lastEmail.followUpStage || lastEmail.templateKey || '?'}]`
      : '— not sent';

    console.log(
      [
        pad(String(f._id), COL[0]),
        pad(name, COL[1]),
        pad(phone, COL[2]),
        pad(email, COL[3]),
        pad(smsStatus, COL[4]),
        pad(emailStatus, COL[5]),
        pad(f.followUp?.status || 'unknown', COL[6])
      ].join(' ')
    );
  }

  // ── Step 7: Skipped / excluded detail ───────────────────────────────────────
  if (skippedLeads.length > 0) {
    printSkippedDetail(skippedLeads);
  }

  // ── Step 8: Final summary ────────────────────────────────────────────────────
  section('FINAL SUMMARY');
  console.log(`Existing leads found    : ${allLeads.length}`);
  console.log(`Eligible                : ${eligible.length}`);
  console.log(`SMS sent                : ${cycleResult.smsSent || 0}`);
  console.log(`Emails sent             : ${cycleResult.emailSent || 0}`);
  console.log(`Skipped (by scheduler)  : ${cycleResult.skipped || 0}`);
  console.log(`Failed                  : ${cycleResult.failed || 0}`);
  console.log(`Leads excluded (script) : ${skippedLeads.length}`);

  console.log(`
✅  Done.

Duplicate-send guarantee:
  sendLeadSms() and sendLeadEmail() each generate an idempotency key of the
  form  "<leadId>:<channel>:<stage>".  If a matching key already exists in
  smsHistory / emailHistory with a successful status, the send is skipped and
  the function returns { success: true, skipped: true, reason: 'duplicate_attempt' }.
  Running this script again will NOT send duplicate messages.

Next steps:
  • The META_FOLLOWUP scheduler continues to run every 5 minutes.
  • Any overdue follow-up stages not yet sent (e.g., step 72h, 7d, 14d) will
    be picked up automatically by subsequent scheduler cycles.
  • Re-run this script at any time to process newly eligible leads.

Run command:
  node scripts/send-existing-followups.js
`);

  await mongoose.disconnect();
}

// ── Helper: print skipped-lead detail ────────────────────────────────────────
function printSkippedDetail(skippedLeads) {
  sub(`EXCLUDED LEADS (${skippedLeads.length})`);
  console.log(
    `${'Lead ID'.padEnd(28)} ${'Name'.padEnd(24)} ${'Phone'.padEnd(17)} ${'Email'.padEnd(32)} Reason`
  );
  console.log('─'.repeat(130));

  for (const { lead, reasons } of skippedLeads) {
    const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email || String(lead._id);
    const cols = [
      String(lead._id).slice(0, 27).padEnd(28),
      name.slice(0, 23).padEnd(24),
      String(lead.phone || '—').slice(0, 16).padEnd(17),
      String(lead.email || '—').slice(0, 31).padEnd(32),
      reasons.join(' | ')
    ];
    console.log(cols.join(' '));
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
main().catch(err => {
  console.error('\n❌  Fatal error:', err.message || err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
