#!/usr/bin/env node

/**
 * Facebook Business Automation Setup Wizard
 * 
 * This script helps you verify and configure the Facebook Business
 * automation system step by step.
 * 
 * Usage: node scripts/setup-facebook-automation.js
 */

const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  header: (text) => console.log(`\n${colors.bright}${colors.blue}${text}${colors.reset}\n`),
  success: (text) => console.log(`${colors.green}✅ ${text}${colors.reset}`),
  warning: (text) => console.log(`${colors.yellow}⚠️  ${text}${colors.reset}`),
  error: (text) => console.log(`${colors.red}❌ ${text}${colors.reset}`),
  info: (text) => console.log(`${colors.cyan}ℹ️  ${text}${colors.reset}`),
  step: (num, text) => console.log(`\n${colors.bright}Step ${num}: ${text}${colors.reset}`)
};

async function main() {
  log.header('═══════════════════════════════════════════════════════════');
  log.header('  Facebook Business Post Automation - Setup Wizard');
  log.header('═══════════════════════════════════════════════════════════');
  
  console.log('\nThis wizard will help you set up automated posting to your Facebook Business page.');
  console.log('\nYour Facebook Business URL:');
  console.log('  • https://business.facebook.com/latest/home');
  console.log('  • (Replace with your actual Business Manager URL)');
  
  const proceed = await question('\nProceed with setup? (yes/no): ');
  if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
    console.log('\nSetup cancelled.');
    rl.close();
    return;
  }
  
  // Step 1: Check environment variables
  log.step(1, 'Checking Environment Variables');
  
  const requiredEnvVars = {
    'MONGODB_URI': 'MongoDB connection string',
    'JWT_SECRET': 'JWT authentication secret',
    'SOCIAL_META_CLIENT_ID': 'Meta app ID (from Facebook Developers)',
    'SOCIAL_META_CLIENT_SECRET': 'Meta app secret (from Facebook Developers)',
    'SOCIAL_ENCRYPTION_KEY': 'Token encryption key (32-byte base64)',
    'SOCIAL_AUTOMATION_ENABLED': 'Automation toggle (true/false)'
  };
  
  const optionalEnvVars = {
    'OPENAI_API_KEY': 'OpenAI API key for content generation',
    'SOCIAL_META_REDIRECT_URI': 'OAuth redirect URI (defaults to CLIENT_URL/api/social/oauth/meta/callback)',
    'SOCIAL_META_PREFERRED_PAGE': 'Preferred page name if multiple pages'
  };
  
  console.log('\nRequired Environment Variables:');
  let missingRequired = [];
  
  for (const [key, description] of Object.entries(requiredEnvVars)) {
    if (process.env[key]) {
      log.success(`${key} - ${description}`);
    } else {
      log.error(`${key} - ${description} (MISSING)`);
      missingRequired.push(key);
    }
  }
  
  console.log('\nOptional Environment Variables:');
  for (const [key, description] of Object.entries(optionalEnvVars)) {
    if (process.env[key]) {
      log.success(`${key} - ${description}`);
    } else {
      log.warning(`${key} - ${description} (not set)`);
    }
  }
  
  if (missingRequired.length > 0) {
    log.error(`\nMissing ${missingRequired.length} required environment variable(s)!`);
    console.log('\nTo fix this:');
    console.log('1. Copy the .env.example file to .env in your server directory');
    console.log('2. Fill in the missing values');
    console.log('3. Restart the server');
    
    const viewGuide = await question('\nView detailed setup guide? (yes/no): ');
    if (viewGuide.toLowerCase() === 'yes' || viewGuide.toLowerCase() === 'y') {
      showSetupGuide();
    }
    
    rl.close();
    return;
  }
  
  // Step 2: Generate encryption key if needed
  if (!process.env.SOCIAL_ENCRYPTION_KEY) {
    log.step(2, 'Generate Encryption Key');
    
    const generate = await question('\nGenerate a new encryption key? (yes/no): ');
    if (generate.toLowerCase() === 'yes' || generate.toLowerCase() === 'y') {
      const encryptionKey = crypto.randomBytes(32).toString('base64');
      console.log('\nGenerated encryption key:');
      console.log(`${colors.bright}${encryptionKey}${colors.reset}`);
      console.log('\nAdd this to your .env file:');
      console.log(`SOCIAL_ENCRYPTION_KEY=${encryptionKey}`);
    }
  }
  
  // Step 3: Verify Meta app configuration
  log.step(3, 'Meta App Configuration');
  
  console.log('\nHave you created a Meta app at https://developers.facebook.com/?');
  const hasApp = await question('(yes/no): ');
  
  if (hasApp.toLowerCase() !== 'yes' && hasApp.toLowerCase() !== 'y') {
    console.log('\nYou need to create a Meta app first:');
    console.log('1. Go to https://developers.facebook.com/');
    console.log('2. Click "My Apps" → "Create App"');
    console.log('3. Select "Business" as app type');
    console.log('4. Add "Facebook Login" and "Pages API" products');
    console.log('5. Copy App ID and App Secret to your .env file');
    console.log('\nDetailed guide: docs/FACEBOOK_BUSINESS_AUTOMATION_SETUP.md');
    rl.close();
    return;
  }
  
  console.log('\nIs your Meta app in LIVE mode (not Development)?');
  const isLive = await question('(yes/no): ');
  
  if (isLive.toLowerCase() !== 'yes' && isLive.toLowerCase() !== 'y') {
    log.warning('\nYour app must be in LIVE mode for automation to work!');
    console.log('To switch to Live mode:');
    console.log('1. Go to Settings → Basic in your Meta app');
    console.log('2. Toggle "App Mode" to Live');
    console.log('3. Complete any required verification steps');
  }
  
  // Step 4: OAuth redirect URI
  log.step(4, 'OAuth Redirect URI');
  
  const baseUrl = process.env.CLIENT_URL || 'https://fixloapp.com';
  const redirectUri = process.env.SOCIAL_META_REDIRECT_URI || `${baseUrl}/api/social/oauth/meta/callback`;
  
  console.log('\nYour OAuth redirect URI should be:');
  console.log(`${colors.bright}${redirectUri}${colors.reset}`);
  console.log('\nIs this configured in your Meta app settings?');
  const uriConfigured = await question('(yes/no): ');
  
  if (uriConfigured.toLowerCase() !== 'yes' && uriConfigured.toLowerCase() !== 'y') {
    console.log('\nTo configure OAuth redirect URI:');
    console.log('1. Go to your Meta app → Facebook Login → Settings');
    console.log('2. Add the redirect URI shown above');
    console.log('3. Save changes');
  }
  
  // Step 5: Automation status
  log.step(5, 'Automation Status');
  
  const automationEnabled = process.env.SOCIAL_AUTOMATION_ENABLED === 'true';
  
  if (automationEnabled) {
    log.success('Automation is ENABLED');
  } else {
    log.warning('Automation is DISABLED (this is the safe default)');
    console.log('\nAutomation is disabled by default for safety.');
    console.log('To enable automation:');
    console.log('1. Set SOCIAL_AUTOMATION_ENABLED=true in your .env file');
    console.log('2. Restart the server');
    console.log('3. Start the scheduler via API: POST /api/social/scheduler/start');
  }
  
  // Step 6: Next steps
  log.step(6, 'Next Steps');
  
  console.log('\nYour setup checklist:');
  console.log('');
  console.log('  1. ✅ Configure environment variables');
  console.log('  2. ⬜ Create Meta app and get credentials');
  console.log('  3. ⬜ Switch Meta app to Live mode');
  console.log('  4. ⬜ Configure OAuth redirect URI');
  console.log('  5. ⬜ Connect your Facebook Business page (OAuth flow)');
  console.log('  6. ⬜ Send test post to verify connection');
  console.log('  7. ⬜ Enable automation (SOCIAL_AUTOMATION_ENABLED=true)');
  console.log('  8. ⬜ Start the scheduler');
  console.log('  9. ⬜ Schedule your first automated post');
  console.log('');
  
  console.log('Detailed documentation:');
  console.log('  • Setup guide: docs/FACEBOOK_BUSINESS_AUTOMATION_SETUP.md');
  console.log('  • API reference: server/modules/social-manager/README.md');
  console.log('  • Quick guide: docs/SOCIAL_MEDIA_POSTING_GUIDE.md');
  
  log.header('\n═══════════════════════════════════════════════════════════');
  log.header('  Setup wizard complete!');
  log.header('═══════════════════════════════════════════════════════════');
  
  rl.close();
}

function showSetupGuide() {
  console.log('\n' + '═'.repeat(60));
  console.log('QUICK SETUP GUIDE');
  console.log('═'.repeat(60));
  
  console.log('\n1. CREATE META APP');
  console.log('   • Go to https://developers.facebook.com/');
  console.log('   • Create Business app');
  console.log('   • Add Facebook Login and Pages API products');
  console.log('');
  
  console.log('2. GET CREDENTIALS');
  console.log('   • Copy App ID → SOCIAL_META_CLIENT_ID');
  console.log('   • Copy App Secret → SOCIAL_META_CLIENT_SECRET');
  console.log('');
  
  console.log('3. GENERATE ENCRYPTION KEY');
  console.log('   Run: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
  console.log('   Copy output → SOCIAL_ENCRYPTION_KEY');
  console.log('');
  
  console.log('4. UPDATE .env FILE');
  console.log('   Add all credentials to server/.env');
  console.log('');
  
  console.log('5. SWITCH APP TO LIVE MODE');
  console.log('   • Meta app → Settings → Basic');
  console.log('   • Toggle to Live mode');
  console.log('');
  
  console.log('6. CONNECT FACEBOOK PAGE');
  console.log('   • Start OAuth flow: GET /api/social/connect/meta_facebook/url');
  console.log('   • Complete authorization');
  console.log('   • Verify: GET /api/social/force-status');
  console.log('');
  
  console.log('7. ENABLE AUTOMATION');
  console.log('   • Set SOCIAL_AUTOMATION_ENABLED=true');
  console.log('   • Restart server');
  console.log('   • Start scheduler: POST /api/social/scheduler/start');
  console.log('');
  
  console.log('Full guide: docs/FACEBOOK_BUSINESS_AUTOMATION_SETUP.md\n');
}

// Run the wizard
main().catch((error) => {
  log.error(`Setup failed: ${error.message}`);
  console.error(error);
  rl.close();
  process.exit(1);
});
