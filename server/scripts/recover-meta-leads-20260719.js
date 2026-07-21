#!/usr/bin/env node
'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const MetaLead = require('../models/MetaLead');
const { recoverManualMetaLead } = require('../services/metaLeadAutomationService');

const RECOVERY_SOURCE = 'recovered_meta_lead';
const LEADS_TO_RECOVER = [
  {
    fullName: 'Booker Jones',
    email: 'devettajones@yahoo.com',
    phone: '+12294493677',
    trade: 'Painting',
    formId: '1913273286015217',
    submittedAt: '2026-07-19T23:51:00.000Z'
  },
  {
    fullName: 'Josh Larsen',
    email: 'jlarsen2@ymail.com',
    phone: '+19493754801',
    trade: 'General construction all trades',
    formId: '1913273286015217',
    submittedAt: '2026-07-19T22:41:00.000Z'
  },
  {
    fullName: 'John Adams',
    email: 'j47989121@gmail.com',
    phone: '+12832243704',
    trade: 'Contractor',
    formId: '1913273286015217',
    note: 'Original submission time unavailable.'
  }
];

function sanitizeName(name) {
  return String(name || '').trim() || 'Unknown lead';
}

function logStep(step, details = '') {
  const suffix = details ? ` ${details}` : '';
  console.log(`${step}${suffix}`);
}

function validationResult(lead) {
  const email = String(lead.email || '').trim().toLowerCase();
  const phone = String(lead.phone || '').trim();
  const required = Boolean(lead.fullName && email && phone && lead.trade && lead.formId);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneOk = /^\+\d{10,15}$/.test(phone);
  return { required, emailOk, phoneOk, email, phone };
}

async function processLead(leadInput) {
  const name = sanitizeName(leadInput.fullName);
  logStep('[MANUAL_META_LEAD] Recovery started', `for ${name}`);

  const check = validationResult(leadInput);
  if (!check.required || !check.emailOk || !check.phoneOk) {
    return {
      name,
      collection: MetaLead.collection.name,
      source: RECOVERY_SOURCE,
      success: false,
      errorReason: 'Validation failed for required fields/email/phone format',
      smsAttempted: false,
      twilioMessageSid: null,
      emailAttempted: false,
      sendGridMessageId: null,
      followUpScheduled: false,
      nextFollowUpDate: null
    };
  }

  logStep('[MANUAL_META_LEAD] Validation passed', `for ${name}`);

  const result = await recoverManualMetaLead({
    ...leadInput,
    source: RECOVERY_SOURCE
  });

  if (result.skipped) {
    return {
      name,
      mongoDocumentId: result.existingId ? String(result.existingId) : null,
      collection: MetaLead.collection.name,
      source: RECOVERY_SOURCE,
      inviteCode: null,
      smsAttempted: false,
      twilioMessageSid: null,
      emailAttempted: false,
      sendGridMessageId: null,
      followUpScheduled: false,
      nextFollowUpDate: null,
      success: true,
      status: 'SKIPPED_DUPLICATE',
      errorReason: result.skippedReason || null
    };
  }

  const { lead, invitationCode, smsResult, emailResult } = result;
  logStep('[META_DATABASE] Lead inserted', `id=${lead._id}`);
  logStep('[META_INVITE] Invite code created', `lead=${lead._id}`);
  logStep('[META_SMS] Initial SMS sent', smsResult.success ? `sid=${smsResult.sid || 'none'}` : 'failed');
  logStep('[META_EMAIL] Initial email sent', emailResult.success ? `id=${emailResult.messageId || 'none'}` : 'failed');
  logStep('[META_FOLLOWUP] Sequence scheduled', lead.followUp?.nextFollowUpAt ? `next=${lead.followUp.nextFollowUpAt.toISOString()}` : '');
  logStep('[MANUAL_META_LEAD] Recovery completed', `for ${name}`);

  return {
    name,
    mongoDocumentId: String(lead._id),
    collection: MetaLead.collection.name,
    source: lead.source,
    inviteCode: invitationCode || null,
    smsAttempted: true,
    twilioMessageSid: smsResult.sid || null,
    emailAttempted: true,
    sendGridMessageId: emailResult.messageId || null,
    followUpScheduled: lead.followUp?.status === 'active',
    nextFollowUpDate: lead.followUp?.nextFollowUpAt ? lead.followUp.nextFollowUpAt.toISOString() : null,
    success: Boolean(smsResult.success && emailResult.success && smsResult.sid && emailResult.messageId),
    status: smsResult.success && emailResult.success ? 'IMPORTED' : 'PARTIAL',
    errorReason: smsResult.success && emailResult.success && smsResult.sid && emailResult.messageId
      ? null
      : `SMS: ${smsResult.error || smsResult.reason || 'missing_sid'}; Email: ${emailResult.error || emailResult.reason || 'missing_message_id'}`
  };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[MANUAL_META_LEAD] MongoDB connection established');

  const report = [];
  for (const lead of LEADS_TO_RECOVER) {
    try {
      const result = await processLead(lead);
      report.push(result);
    } catch (error) {
      report.push({
        name: sanitizeName(lead.fullName),
        mongoDocumentId: null,
        collection: MetaLead.collection.name,
        source: RECOVERY_SOURCE,
        inviteCode: null,
        smsAttempted: false,
        twilioMessageSid: null,
        emailAttempted: false,
        sendGridMessageId: null,
        followUpScheduled: false,
        nextFollowUpDate: null,
        success: false,
        status: 'FAILED',
        errorReason: error.message
      });
    }
  }

  console.log('\n=== META LEAD RECOVERY REPORT ===');
  console.log(JSON.stringify(report, null, 2));

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('[MANUAL_META_LEAD] Fatal error', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // no-op
  }
  process.exit(1);
});
