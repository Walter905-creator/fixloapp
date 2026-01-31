#!/usr/bin/env node

/**
 * SMS Doctor - Non-Referral SMS Health Check
 * 
 * Verifies that all non-referral SMS flows are properly configured:
 * - Twilio credentials
 * - SMS sender utility
 * - Notification handlers
 * - Idempotency system
 * 
 * EXPLICITLY SKIPS referral SMS validation (it's working perfectly)
 */

const chalk = require('chalk');

// Color helpers
const success = (msg) => console.log(chalk.green('✅ ' + msg));
const error = (msg) => console.log(chalk.red('❌ ' + msg));
const warning = (msg) => console.log(chalk.yellow('⚠️  ' + msg));
const info = (msg) => console.log(chalk.blue('ℹ️  ' + msg));
const section = (msg) => console.log(chalk.cyan.bold('\n' + msg));

async function runDiagnostics() {
  console.log(chalk.bold.cyan('\n🏥 SMS DOCTOR - Non-Referral SMS Health Check\n'));
  
  let allChecksPass = true;
  
  // ========================================
  // 1. ENVIRONMENT VARIABLES
  // ========================================
  section('1️⃣  Checking Twilio Configuration...');
  
  const requiredEnvVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      success(`${envVar} is set`);
    } else {
      error(`${envVar} is missing`);
      allChecksPass = false;
    }
  }
  
  // Check optional WhatsApp number
  if (process.env.TWILIO_WHATSAPP_NUMBER) {
    success('TWILIO_WHATSAPP_NUMBER is set (for international notifications)');
  } else {
    warning('TWILIO_WHATSAPP_NUMBER not set (international notifications will use SMS)');
  }
  
  // ========================================
  // 2. TWILIO CLIENT INITIALIZATION
  // ========================================
  section('2️⃣  Testing Twilio Client...');
  
  try {
    const { getTwilioClient } = require('../utils/twilio');
    const client = getTwilioClient();
    
    if (client) {
      success('Twilio client initialized successfully');
      
      // Test account info (non-blocking)
      try {
        const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        success(`Twilio account verified: ${account.friendlyName}`);
        info(`Account status: ${account.status}`);
      } catch (apiError) {
        warning(`Could not verify Twilio account: ${apiError.message}`);
      }
    } else {
      error('Twilio client is null');
      allChecksPass = false;
    }
  } catch (err) {
    error(`Failed to initialize Twilio client: ${err.message}`);
    allChecksPass = false;
  }
  
  // ========================================
  // 3. SMS SENDER UTILITY
  // ========================================
  section('3️⃣  Checking SMS Sender Utility...');
  
  try {
    const smsSender = require('../utils/smsSender');
    
    // Check exported functions
    const requiredFunctions = [
      'sendNonReferralSms',
      'sendHomeownerConfirmation',
      'sendProLeadAlert',
      'sendLeadNotification'
    ];
    
    for (const funcName of requiredFunctions) {
      if (typeof smsSender[funcName] === 'function') {
        success(`${funcName}() is available`);
      } else {
        error(`${funcName}() is missing or not a function`);
        allChecksPass = false;
      }
    }
    
    // Check templates
    if (smsSender.SMS_TEMPLATES) {
      success('SMS_TEMPLATES defined');
      
      const requiredTemplates = ['homeowner', 'pro', 'lead'];
      for (const templateType of requiredTemplates) {
        if (smsSender.SMS_TEMPLATES[templateType]) {
          success(`  Template '${templateType}' exists`);
          
          // Check language support
          const languages = ['en', 'es', 'pt'];
          for (const lang of languages) {
            if (smsSender.SMS_TEMPLATES[templateType][lang]) {
              info(`    ✓ ${lang} translation available`);
            } else {
              warning(`    Missing ${lang} translation for '${templateType}'`);
            }
          }
        } else {
          error(`  Template '${templateType}' is missing`);
          allChecksPass = false;
        }
      }
    } else {
      error('SMS_TEMPLATES not found');
      allChecksPass = false;
    }
  } catch (err) {
    error(`Failed to load SMS sender utility: ${err.message}`);
    allChecksPass = false;
  }
  
  // ========================================
  // 4. SMS NOTIFICATION MODEL
  // ========================================
  section('4️⃣  Checking SMS Notification Model...');
  
  try {
    const SmsNotification = require('../models/SmsNotification');
    
    success('SmsNotification model loaded');
    
    // Check static methods
    const staticMethods = [
      'generateIdempotencyKey',
      'wasAlreadySent',
      'recordNotification',
      'maskPhoneNumber'
    ];
    
    for (const method of staticMethods) {
      if (typeof SmsNotification[method] === 'function') {
        success(`  ${method}() is available`);
      } else {
        error(`  ${method}() is missing`);
        allChecksPass = false;
      }
    }
    
    // Test idempotency key generation
    try {
      const testKey = SmsNotification.generateIdempotencyKey('lead123', 'user456', 'pro');
      if (testKey && testKey.length === 64) { // SHA-256 hex is 64 chars
        success(`  Idempotency key generation works (${testKey.substring(0, 16)}...)`);
      } else {
        error('  Idempotency key generation produced invalid result');
        allChecksPass = false;
      }
    } catch (err) {
      error(`  Idempotency key generation failed: ${err.message}`);
      allChecksPass = false;
    }
    
    // Test phone masking
    try {
      const masked = SmsNotification.maskPhoneNumber('+12125551234');
      if (masked === '+1***551234') {
        success(`  Phone masking works: ${masked}`);
      } else {
        warning(`  Phone masking unexpected result: ${masked}`);
      }
    } catch (err) {
      error(`  Phone masking failed: ${err.message}`);
      allChecksPass = false;
    }
    
  } catch (err) {
    error(`Failed to load SmsNotification model: ${err.message}`);
    allChecksPass = false;
  }
  
  // ========================================
  // 5. NOTIFICATION HANDLERS
  // ========================================
  section('5️⃣  Checking Notification Handlers...');
  
  try {
    const notifications = require('../utils/notifications');
    
    if (typeof notifications.notifyProOfLead === 'function') {
      success('notifyProOfLead() handler is available');
    } else {
      error('notifyProOfLead() handler is missing');
      allChecksPass = false;
    }
    
    if (typeof notifications.notifyProsOfLead === 'function') {
      success('notifyProsOfLead() handler is available');
    } else {
      warning('notifyProsOfLead() handler is missing (not critical)');
    }
  } catch (err) {
    error(`Failed to load notification handlers: ${err.message}`);
    allChecksPass = false;
  }
  
  // ========================================
  // 6. DRY RUN SIMULATION
  // ========================================
  section('6️⃣  Dry Run Simulation...');
  
  info('Simulating SMS send without actual Twilio call...');
  
  try {
    const smsSender = require('../utils/smsSender');
    const SmsNotification = require('../models/SmsNotification');
    
    // Test data
    const mockLead = {
      _id: 'test-lead-123',
      trade: 'Plumbing',
      city: 'San Francisco',
      state: 'CA',
      name: 'Test Customer',
      phone: '+14155551234',
      smsConsent: true,
      country: 'US'
    };
    
    const mockPro = {
      _id: 'test-pro-456',
      name: 'Test Pro',
      phone: '+14155559999',
      smsConsent: true,
      country: 'US'
    };
    
    // Test template rendering
    const homeownerTemplate = smsSender.SMS_TEMPLATES.homeowner.en;
    const homeownerMsg = homeownerTemplate({
      service: mockLead.trade,
      city: mockLead.city
    });
    
    info('Homeowner confirmation message:');
    console.log(chalk.gray('  "' + homeownerMsg + '"'));
    
    const proTemplate = smsSender.SMS_TEMPLATES.pro.en;
    const proMsg = proTemplate({
      service: mockLead.trade,
      location: `${mockLead.city}, ${mockLead.state}`,
      customerName: mockLead.name,
      customerPhone: mockLead.phone
    });
    
    info('Pro lead alert message:');
    console.log(chalk.gray('  "' + proMsg + '"'));
    
    success('Template rendering works correctly');
    
    // Check message compliance
    const hasOptOut = homeownerMsg.includes('STOP') && proMsg.includes('STOP');
    if (hasOptOut) {
      success('All messages include opt-out language (TCPA compliant)');
    } else {
      error('Messages missing opt-out language - not TCPA compliant!');
      allChecksPass = false;
    }
    
  } catch (err) {
    error(`Dry run simulation failed: ${err.message}`);
    allChecksPass = false;
  }
  
  // ========================================
  // 7. REFERRAL SMS VERIFICATION
  // ========================================
  section('7️⃣  Referral SMS Status (Read-Only Check)...');
  
  info('Verifying referral SMS module exists (NOT testing it)...');
  
  try {
    const referralNotification = require('../services/referralNotification');
    
    if (typeof referralNotification.sendReferralRewardNotification === 'function') {
      success('Referral SMS module is intact ✓');
      info('Referral SMS is working perfectly - no changes needed');
    } else {
      warning('Referral SMS module structure changed - verify manually');
    }
  } catch (err) {
    warning(`Could not verify referral module: ${err.message}`);
    info('This check is informational only - referral SMS should not be modified');
  }
  
  // ========================================
  // FINAL SUMMARY
  // ========================================
  section('📊 Summary');
  
  if (allChecksPass) {
    console.log(chalk.green.bold('\n✅ ALL CHECKS PASSED!'));
    console.log(chalk.green('Non-referral SMS notifications are properly configured.\n'));
    process.exit(0);
  } else {
    console.log(chalk.red.bold('\n❌ SOME CHECKS FAILED'));
    console.log(chalk.red('Please fix the issues above before deploying.\n'));
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ Unhandled error:'), error);
  process.exit(1);
});

// Run diagnostics
runDiagnostics().catch((error) => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});
