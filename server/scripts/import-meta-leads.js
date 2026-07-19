#!/usr/bin/env node
/**
 * import-meta-leads.js — ONE-TIME manual import of historical Meta leads
 *
 * These three leads were collected from Instagram/Facebook Lead Ads before the
 * Meta Lead Ads webhook and automation were connected.  Running this script
 * inserts them into the same MetaLead collection used by webhook-generated leads
 * and enrolls each one in the existing follow-up sequence.
 *
 * SAFE TO RUN MULTIPLE TIMES — duplicate checks prevent re-importing.
 *
 * Usage:
 *   node server/scripts/import-meta-leads.js
 *
 * Required environment variables (same as the main server):
 *   MONGODB_URI, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL,
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *
 * DO NOT LEAVE a public HTTP endpoint for this import.
 * DO NOT ALTER the existing Meta webhook flow.
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');

// ── Leads to import ──────────────────────────────────────────────────────────
// Date suffix reflects the approximate date of this import batch (2026-07-18).
// These IDs are intentionally non-numeric so they are never mistaken for real
// Meta leadgen_id values and will never match isNumericMetaId() in the webhook.
const LEADS_TO_IMPORT = [
  {
    firstName: 'Dave',
    lastName: 'Burnett',
    phone: '+12539998115',
    email: 'berryrass@yahoo.com',
    metaLeadId: 'manual-dave-burnett-20260718',
    leadUniqueId: 'MANUAL-dave-burnett-20260718'
  },
  {
    firstName: 'Joshua',
    lastName: 'Noriega',
    phone: null,
    // Email is used exactly as submitted by the lead — the username 'jcnoniega77'
    // differs from the last name spelling ('Noriega') and may be intentional.
    // Do NOT alter this address.
    email: 'jcnoniega77@yahoo.com',
    metaLeadId: 'manual-joshua-noriega-20260718',
    leadUniqueId: 'MANUAL-joshua-noriega-20260718'
  },
  {
    firstName: 'Marnique',
    lastName: 'Reed',
    phone: null,
    email: 'mreed2876@gmail.com',
    metaLeadId: 'manual-marnique-reed-20260718',
    leadUniqueId: 'MANUAL-marnique-reed-20260718'
  }
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function section(title) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

function row(label, value) {
  const padded = String(label).padEnd(22);
  console.log(`  ${padded} ${value}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌  MONGODB_URI is not set. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅  Connected to MongoDB');

  // Require the service AFTER mongoose connects so models register correctly.
  const { importManualLead } = require('../services/metaLeadAutomationService');

  const summary = [];

  for (const leadData of LEADS_TO_IMPORT) {
    const label = `${leadData.firstName} ${leadData.lastName}`;
    section(`Processing: ${label}`);

    let result;
    try {
      result = await importManualLead(leadData);
    } catch (err) {
      console.error(`  ❌  Unexpected error: ${err.message}`);
      summary.push({ name: label, status: 'ERROR', reason: err.message });
      continue;
    }

    if (result.skipped) {
      console.log(`  ⚠️   SKIPPED`);
      row('Reason:', result.skippedReason);
      if (result.existingId)    row('Existing MetaLead:', String(result.existingId));
      if (result.existingProId) row('Existing Pro:', String(result.existingProId));
      summary.push({ name: label, status: 'SKIPPED', reason: result.skippedReason });
      continue;
    }

    const { lead, invitationCode, smsResult, emailResult } = result;

    console.log(`  ✅  IMPORTED`);
    row('MetaLead ID:', String(lead._id));
    row('Internal ID:', lead.metaLeadId);
    row('Name:', `${lead.firstName} ${lead.lastName}`);
    row('Email:', lead.email || '(none)');
    row('Phone:', lead.phone || '(none)');
    row('Source:', lead.source);
    row('Manual import:', String(lead.manualImport));
    row('Invitation code:', invitationCode || '(none)');
    row('Code expires:', lead.invitationExpiresAt ? lead.invitationExpiresAt.toISOString().slice(0, 10) : '—');
    row('Follow-up status:', lead.followUp.status);
    row('Next follow-up:', lead.followUp.nextFollowUpAt ? lead.followUp.nextFollowUpAt.toISOString() : '—');

    // SMS result
    if (!lead.phone) {
      row('SMS:', 'SKIPPED — skipped_missing_phone (event logged)');
    } else if (smsResult.success) {
      row('SMS:', `SENT — SID: ${smsResult.sid}`);
    } else {
      row('SMS:', `FAILED — ${smsResult.error || smsResult.reason}`);
    }

    // Email result
    if (emailResult.success) {
      row('Email:', `SENT — messageId: ${emailResult.messageId || '(no ID returned)'}`);
    } else {
      row('Email:', `FAILED — ${emailResult.error || emailResult.reason}`);
    }

    summary.push({
      name: label,
      status: 'IMPORTED',
      id: String(lead._id),
      invitationCode,
      sms: !lead.phone ? 'skipped_missing_phone' : smsResult.success ? `sent (${smsResult.sid})` : `failed (${smsResult.error || smsResult.reason})`,
      email: emailResult.success ? `sent (${emailResult.messageId || 'ok'})` : `failed (${emailResult.error || emailResult.reason})`,
      followUpEnrolled: lead.followUp.status === 'active'
    });
  }

  // ── Final summary ──────────────────────────────────────────────────────────
  section('IMPORT SUMMARY');
  for (const s of summary) {
    console.log(`\n  ${s.name}`);
    row('Status:', s.status);
    if (s.reason)           row('Reason:', s.reason);
    if (s.id)               row('MetaLead _id:', s.id);
    if (s.invitationCode)   row('Invitation code:', s.invitationCode);
    if (s.sms)              row('SMS:', s.sms);
    if (s.email)            row('Email:', s.email);
    if (s.followUpEnrolled !== undefined) {
      row('Follow-up enrolled:', s.followUpEnrolled ? 'YES (active)' : 'NO');
    }
  }

  const imported = summary.filter((s) => s.status === 'IMPORTED').length;
  const skipped  = summary.filter((s) => s.status === 'SKIPPED').length;
  const errors   = summary.filter((s) => s.status === 'ERROR').length;

  console.log('\n' + '═'.repeat(60));
  console.log(`  Imported: ${imported}  |  Skipped: ${skipped}  |  Errors: ${errors}`);
  console.log('═'.repeat(60) + '\n');

  await mongoose.disconnect();
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('❌  Fatal error:', err.message);
  process.exit(1);
});
