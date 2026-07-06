#!/usr/bin/env node
/**
 * generate-invite.js — Create one-time Fixlo invite codes
 *
 * Usage:
 *   node server/scripts/generate-invite.js --name "John Smith" --email "john@example.com"
 *   node server/scripts/generate-invite.js --name "Maria Garcia" --phone "+13055551234" --prefix PRO365
 *   node server/scripts/generate-invite.js --count 5
 *
 * Also available as:
 *   npm run generate:invite -- --name "John Smith" --email "john@example.com"
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');

// Parse CLI args
const args = process.argv.slice(2);
function getArg(flag) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}

const assignedName  = getArg('--name');
const assignedEmail = getArg('--email');
const assignedPhone = getArg('--phone');
const prefix        = getArg('--prefix');
const notes         = getArg('--notes');
const expiresAt     = getArg('--expires');  // ISO date e.g. 2027-01-01
const count         = parseInt(getArg('--count') || '1', 10);

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌  MONGODB_URI is not set in environment. Cannot connect to database.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅  Connected to MongoDB\n');

  const InviteCode = require('../models/InviteCode');

  const total = Math.min(Math.max(count, 1), 50);
  console.log(`Generating ${total} invite code(s)…\n`);

  for (let i = 0; i < total; i++) {
    const doc = await InviteCode.createUniqueCode({
      assignedName:  assignedName  || undefined,
      assignedEmail: assignedEmail || undefined,
      assignedPhone: assignedPhone || undefined,
      prefix:        prefix        || undefined,
      notes:         notes         || undefined,
      expiresAt:     expiresAt ? new Date(expiresAt) : undefined
    });

    console.log('──────────────────────────────────────────────');
    console.log(`  Code:    ${doc.code}`);
    if (doc.assignedName)  console.log(`  Name:    ${doc.assignedName}`);
    if (doc.assignedEmail) console.log(`  Email:   ${doc.assignedEmail}`);
    if (doc.assignedPhone) console.log(`  Phone:   ${doc.assignedPhone}`);
    console.log(`  Plan:    ${doc.planType}`);
    if (doc.expiresAt)     console.log(`  Expires: ${doc.expiresAt.toISOString().slice(0, 10)}`);
    console.log();
    console.log(`  📱 Message template:`);
    console.log(`  "Your personal Fixlo invitation code is ${doc.code}. This code gives you one free year and can only be used once."`);
    console.log('──────────────────────────────────────────────');
    console.log();
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
