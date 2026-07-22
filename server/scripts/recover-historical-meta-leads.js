#!/usr/bin/env node
'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');

const FORM_ID = '1913273286015217';
const TARGETS = [
  {
    fullName: 'Lee Martin',
    email: 'handsonmaintenance621@gmail.com',
    phone: '+18033153009',
    trade: 'Painter'
  },
  {
    fullName: 'Roy Villegas',
    email: 'xproroy13@gmail.com'
  },
  {
    fullName: 'Christopher Ajagu',
    email: 'ajaguc@gmail.com',
    phone: '+13104026902',
    trade: 'Roofing, HVAC'
  },
  {
    fullName: 'Handyman',
    phone: '+15109619036',
    trade: 'Handyman'
  }
];

function printSection(title) {
  console.log(`\n${'='.repeat(72)}`);
  console.log(title);
  console.log('='.repeat(72));
}

function printResult(result) {
  console.log(`\n${result.name}`);
  console.log(`  Outcome: ${result.status}`);
  console.log(`  Source: ${result.source}`);
  if (result.reason) console.log(`  Reason: ${result.reason}`);
  if (result.matchedMetaLeadId) console.log(`  Meta lead ID: ${result.matchedMetaLeadId}`);
  if (result.leadId) console.log(`  MetaLead _id: ${result.leadId}`);
  console.log(`  Invite code: ${result.inviteCodeStatus}${result.inviteCode ? ` (${result.inviteCode})` : ''}`);
  console.log(`  SMS: ${result.smsStatus}${result.twilioMessageSid ? ` (${result.twilioMessageSid})` : ''}`);
  console.log(`  Email: ${result.emailStatus}${result.emailMessageId ? ` (${result.emailMessageId})` : ''}`);
  console.log(`  Follow-up: ${result.followUpStatus}${result.nextFollowUpAt ? ` (${result.nextFollowUpAt})` : ''}`);
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const {
    CANONICAL_PRO_SIGNUP_URL,
    saveSettings,
    getSettings,
    recoverHistoricalMetaLeadsByForm
  } = require('../services/metaLeadAutomationService');

  const settingsBefore = await getSettings();
  if (settingsBefore.signupLink !== CANONICAL_PRO_SIGNUP_URL) {
    await saveSettings({ signupLink: CANONICAL_PRO_SIGNUP_URL });
  }

  const report = await recoverHistoricalMetaLeadsByForm({
    formId: FORM_ID,
    targets: TARGETS
  });

  printSection(`Historical Meta recovery for form ${FORM_ID}`);
  console.log(`Canonical signup URL: ${report.canonicalSignupLink}`);
  report.results.forEach(printResult);

  const counts = report.results.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {});

  printSection('Summary');
  Object.keys(counts).sort().forEach((key) => {
    console.log(`  ${key}: ${counts[key]}`);
  });

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`Fatal error: ${error.message}`);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});