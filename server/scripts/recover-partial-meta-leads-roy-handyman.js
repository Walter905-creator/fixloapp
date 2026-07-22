#!/usr/bin/env node
'use strict';

/**
 * One-time production recovery script for two incomplete historical Meta leads:
 *
 *   1. Roy Villegas — email only (xproroy13@gmail.com), no phone, unknown trade
 *   2. Handyman Lead — phone only (+15109619036), no email, trade = Handyman
 *
 * Uses the permanent recoverPartialMetaLead service. Does not duplicate recovery logic.
 * Idempotent: safe to run multiple times; will not create duplicates or resend messages.
 *
 * Production command:
 *   cd /workspaces/fixloapp/server
 *   node scripts/recover-partial-meta-leads-roy-handyman.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');

const FORM_ID = '1913273286015217';

const TARGETS = [
  {
    fullName: 'Roy Villegas',
    email: 'xproroy13@gmail.com',
    phone: null,
    trade: null
  },
  {
    fullName: 'Handyman Lead',
    email: null,
    phone: '+15109619036',
    trade: 'Handyman'
  }
];

function buildReport(target, result) {
  if (result.skipped) {
    return {
      name: target.fullName,
      status: 'FAILED',
      mongoDocumentId: null,
      profileIncomplete: null,
      missingFields: null,
      inviteCode: null,
      sms: { available: false, attempted: false, twilioMessageSid: null, status: null },
      email: { available: false, attempted: false, sendGridMessageId: null, status: null },
      followUpScheduled: false,
      followUpChannels: [],
      nextFollowUpDate: null,
      signupUrl: 'https://fixloapp.com/pros',
      errorReason: result.skippedReason || 'Skipped by recovery service'
    };
  }

  const { lead, status, profileIncomplete, missingFields, emailAvailable, smsAvailable, smsResult, emailResult, followUpChannels } = result;

  const smsAttempted = smsAvailable && !!smsResult && smsResult.reason !== 'not_available';
  const emailAttempted = emailAvailable && !!emailResult && emailResult.reason !== 'not_available';

  const lastSmsEntry = Array.isArray(lead.smsHistory) && lead.smsHistory.length
    ? lead.smsHistory.filter((h) => h.direction === 'outbound').slice(-1)[0]
    : null;
  const lastEmailEntry = Array.isArray(lead.emailHistory) && lead.emailHistory.length
    ? lead.emailHistory.slice(-1)[0]
    : null;

  const smsTwilioSid = smsResult?.sid || lastSmsEntry?.messageSid || null;
  const emailMessageId = emailResult?.messageId || lastEmailEntry?.messageId || null;

  let smsStatus = null;
  if (smsAvailable) {
    if (!smsAttempted) {
      smsStatus = 'not_attempted';
    } else if (smsResult?.success || smsResult?.skipped) {
      smsStatus = lastSmsEntry?.status || 'queued';
    } else {
      smsStatus = smsResult?.error || smsResult?.reason || 'failed';
    }
  }

  let emailStatus = null;
  if (emailAvailable) {
    if (!emailAttempted) {
      emailStatus = 'not_attempted';
    } else if (emailResult?.success || emailResult?.skipped) {
      emailStatus = 'accepted';
    } else {
      emailStatus = emailResult?.error || emailResult?.reason || 'failed';
    }
  }

  return {
    name: target.fullName,
    status,
    mongoDocumentId: lead ? String(lead._id) : null,
    profileIncomplete,
    missingFields,
    inviteCode: lead?.invitationCode || null,
    sms: {
      available: smsAvailable,
      attempted: smsAttempted,
      twilioMessageSid: smsTwilioSid,
      status: smsStatus
    },
    email: {
      available: emailAvailable,
      attempted: emailAttempted,
      sendGridMessageId: emailMessageId,
      status: emailStatus
    },
    followUpScheduled: ['active', 'paused', 'stopped', 'completed'].includes(lead?.followUp?.status),
    followUpChannels,
    nextFollowUpDate: lead?.followUp?.nextFollowUpAt || null,
    signupUrl: 'https://fixloapp.com/pros',
    errorReason: null
  };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const { recoverPartialMetaLead, CANONICAL_PRO_SIGNUP_URL, saveSettings, getSettings } = require('../services/metaLeadAutomationService');

  // Ensure canonical signup URL is set.
  const settingsBefore = await getSettings();
  if (settingsBefore.signupLink !== CANONICAL_PRO_SIGNUP_URL) {
    await saveSettings({ signupLink: CANONICAL_PRO_SIGNUP_URL });
  }

  console.log('[PARTIAL_META_RECOVERY] Batch started');

  const reports = [];

  for (const target of TARGETS) {
    console.log(`[PARTIAL_META_RECOVERY] Processing ${target.fullName}`);
    try {
      const result = await recoverPartialMetaLead({
        fullName: target.fullName,
        email: target.email || undefined,
        phone: target.phone || undefined,
        trade: target.trade || undefined,
        formId: FORM_ID,
        source: 'recovered_meta_lead'
      });
      reports.push(buildReport(target, result));
    } catch (err) {
      console.error(`[PARTIAL_META_RECOVERY] Error processing ${target.fullName}: ${err.message}`);
      reports.push({
        name: target.fullName,
        status: 'FAILED',
        mongoDocumentId: null,
        profileIncomplete: null,
        missingFields: null,
        inviteCode: null,
        sms: { available: false, attempted: false, twilioMessageSid: null, status: null },
        email: { available: false, attempted: false, sendGridMessageId: null, status: null },
        followUpScheduled: false,
        followUpChannels: [],
        nextFollowUpDate: null,
        signupUrl: 'https://fixloapp.com/pros',
        errorReason: err.message
      });
    }
  }

  console.log('[PARTIAL_META_RECOVERY] Batch completed');
  console.log('\n--- Recovery Report ---');
  console.log(JSON.stringify(reports, null, 2));

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`Fatal error: ${error.message}`);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
