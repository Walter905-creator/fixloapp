#!/usr/bin/env node
/**
 * Fixlo Platform End-to-End Verification Test
 * 
 * This script performs comprehensive auditing of the Fixlo platform
 * to verify compliance with all requirements.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function pass(section, message) {
  results.passed.push({ section, message });
  log(`✅ [${section}] ${message}`, 'green');
}

function fail(section, message, file = '', line = '') {
  results.failed.push({ section, message, file, line });
  log(`❌ [${section}] ${message}`, 'red');
  if (file) log(`   File: ${file}${line ? `:${line}` : ''}`, 'yellow');
}

function warn(section, message) {
  results.warnings.push({ section, message });
  log(`⚠️  [${section}] ${message}`, 'yellow');
}

function searchInFile(filePath, searchTerms, section, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let found = false;
    
    lines.forEach((line, index) => {
      searchTerms.forEach(term => {
        if (line.toLowerCase().includes(term.toLowerCase())) {
          found = true;
          fail(section, `Found prohibited term "${term}" in ${description}`, filePath, index + 1);
        }
      });
    });
    
    if (!found) {
      pass(section, `No prohibited terms found in ${description}`);
    }
    
    return found;
  } catch (err) {
    warn(section, `Could not read ${filePath}: ${err.message}`);
    return false;
  }
}

function searchInDirectory(dir, extensions, searchTerms, section, description) {
  const files = [];
  
  function traverse(currentPath) {
    try {
      const items = fs.readdirSync(currentPath);
      items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      });
    } catch (err) {
      // Ignore permission errors
    }
  }
  
  traverse(dir);
  
  let foundAny = false;
  files.forEach(file => {
    const found = searchInFile(file, searchTerms, section, path.relative(dir, file));
    foundAny = foundAny || found;
  });
  
  if (!foundAny && files.length > 0) {
    pass(section, `${description}: No prohibited terms in ${files.length} files`);
  }
}

function checkFileExists(filePath, section, description) {
  if (fs.existsSync(filePath)) {
    pass(section, `${description} exists`);
    return true;
  } else {
    fail(section, `${description} not found`, filePath);
    return false;
  }
}

function checkFileContent(filePath, expectedStrings, section, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let allFound = true;
    
    expectedStrings.forEach(str => {
      if (content.includes(str)) {
        pass(section, `${description}: Found "${str.substring(0, 50)}..."`);
      } else {
        fail(section, `${description}: Missing "${str.substring(0, 50)}..."`, filePath);
        allFound = false;
      }
    });
    
    return allFound;
  } catch (err) {
    fail(section, `Could not verify ${description}`, filePath);
    return false;
  }
}

log('\n' + '='.repeat(80), 'cyan');
log('FIXLO PLATFORM END-TO-END VERIFICATION AUDIT', 'cyan');
log('='.repeat(80) + '\n', 'cyan');

// SECTION 2: Stripe Subscription Flow
log('\n📋 SECTION 2: STRIPE SUBSCRIPTION FLOW', 'blue');
searchInFile(
  '/home/runner/work/fixloapp/fixloapp/server/routes/stripe.js',
  ['trial_period_days'],
  'Stripe Subscription',
  'stripe.js'
);

checkFileContent(
  '/home/runner/work/fixloapp/fixloapp/server/routes/stripe.js',
  ['subscription_data: {', 'metadata: {'],
  'Stripe Subscription',
  'Subscription data structure'
);

// SECTION 3: Referral Code Generation
log('\n📋 SECTION 3: REFERRAL CODE GENERATION', 'blue');
checkFileExists(
  '/home/runner/work/fixloapp/fixloapp/server/models/Pro.js',
  'Referral System',
  'Pro model'
);

checkFileContent(
  '/home/runner/work/fixloapp/fixloapp/server/models/Pro.js',
  [
    'referralCode:',
    'referralUrl:',
    'generateReferralCode',
    'isActive && this.stripeCustomerId'
  ],
  'Referral System',
  'Referral code generation logic'
);

// SECTION 6: Stripe Referral Reward
log('\n📋 SECTION 6: STRIPE REFERRAL REWARD', 'blue');
checkFileExists(
  '/home/runner/work/fixloapp/fixloapp/server/services/applyReferralFreeMonth.js',
  'Referral Reward',
  'Referral reward service'
);

checkFileContent(
  '/home/runner/work/fixloapp/fixloapp/server/services/applyReferralFreeMonth.js',
  [
    'percent_off: 100',
    "duration: 'once'",
    'proration_behavior',
    'hasExistingReward'
  ],
  'Referral Reward',
  'Reward implementation'
);

// SECTION 7: Notifications
log('\n📋 SECTION 7: NOTIFICATIONS', 'blue');
checkFileContent(
  '/home/runner/work/fixloapp/fixloapp/server/utils/twilio.js',
  [
    'sendSms',
    'sendWhatsAppMessage',
    'module.exports'
  ],
  'Notifications',
  'Twilio utilities'
);

checkFileContent(
  '/home/runner/work/fixloapp/fixloapp/server/services/referralNotification.js',
  [
    'sendWhatsAppMessage',
    'sendSms',
    'detectLanguage'
  ],
  'Notifications',
  'Referral notifications'
);

// SECTION 8: Homepage UI
log('\n📋 SECTION 8: HOMEPAGE UI', 'blue');
searchInFile(
  '/home/runner/work/fixloapp/fixloapp/client/src/components/FreeTrialBanner.jsx',
  ['first month free', '30-day trial', 'free trial'],
  'Homepage UI',
  'FreeTrialBanner.jsx'
);

checkFileExists(
  '/home/runner/work/fixloapp/fixloapp/client/src/components/HomeReferralSection.jsx',
  'Homepage UI',
  'HomeReferralSection component'
);

checkFileContent(
  '/home/runner/work/fixloapp/fixloapp/client/src/components/HomeReferralSection.jsx',
  [
    'Be Your Own Boss',
    'Support Local Jobs',
    'FREE month'
  ],
  'Homepage UI',
  'Referral section content'
);

// SECTION 9: Share Buttons
log('\n📋 SECTION 9: SHARE BUTTONS', 'blue');
checkFileContent(
  '/home/runner/work/fixloapp/fixloapp/client/src/components/ReferralSection.jsx',
  [
    'copyReferralLink',
    'shareViaWhatsApp',
    'shareViaSMS',
    'isUSA'
  ],
  'Share Buttons',
  'ReferralSection component'
);

// SECTION 10: Edge Cases
log('\n📋 SECTION 10: EDGE CASES', 'blue');
checkFileContent(
  '/home/runner/work/fixloapp/fixloapp/server/routes/referrals.js',
  [
    'checkDuplicateReferral',
    'Self-referral not allowed',
    'MAX_REFERRALS_PER_IP'
  ],
  'Edge Cases',
  'Anti-fraud checks'
);

checkFileContent(
  '/home/runner/work/fixloapp/fixloapp/server/models/Referral.js',
  [
    'checkDuplicateReferral',
    'signupIp',
    'deviceFingerprint',
    'isFraudulent'
  ],
  'Edge Cases',
  'Referral model fraud detection'
);

// COMPREHENSIVE SEARCH: No free trials anywhere
log('\n📋 COMPREHENSIVE SEARCH: FREE TRIAL VERIFICATION', 'blue');
searchInDirectory(
  '/home/runner/work/fixloapp/fixloapp/server',
  ['.js'],
  ['trial_period_days'],
  'No Free Trials',
  'Server code'
);

searchInDirectory(
  '/home/runner/work/fixloapp/fixloapp/client/src/components',
  ['.jsx', '.js'],
  ['first month free', '30-day trial', 'trial period', 'you won\'t be charged'],
  'No Free Trials',
  'Client components'
);

// Generate Summary
log('\n' + '='.repeat(80), 'cyan');
log('AUDIT SUMMARY', 'cyan');
log('='.repeat(80), 'cyan');

log(`\n✅ Passed: ${results.passed.length}`, 'green');
log(`❌ Failed: ${results.failed.length}`, 'red');
log(`⚠️  Warnings: ${results.warnings.length}`, 'yellow');

if (results.failed.length > 0) {
  log('\n❌ FAILED CHECKS:', 'red');
  results.failed.forEach(item => {
    log(`   [${item.section}] ${item.message}`, 'red');
    if (item.file) {
      log(`      ${item.file}${item.line ? `:${item.line}` : ''}`, 'yellow');
    }
  });
}

if (results.warnings.length > 0) {
  log('\n⚠️  WARNINGS:', 'yellow');
  results.warnings.forEach(item => {
    log(`   [${item.section}] ${item.message}`, 'yellow');
  });
}

log('\n' + '='.repeat(80), 'cyan');
if (results.failed.length === 0) {
  log('🎉 ALL CRITICAL CHECKS PASSED! Platform is ready for production.', 'green');
} else {
  log('⚠️  ISSUES FOUND - Review and fix failed checks before deploying.', 'red');
}
log('='.repeat(80) + '\n', 'cyan');

process.exit(results.failed.length === 0 ? 0 : 1);
