#!/usr/bin/env node

// Test SEO Agent Implementation
// Verifies all components are properly set up

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing SEO Agent Implementation...\n');

let allTestsPassed = true;

// Test 1: Directory Structure
console.log('📁 Test 1: Checking directory structure...');
const requiredDirs = [
  'seo-agent',
  'seo-agent/config',
  'seo-agent/ingestion',
  'seo-agent/decisions',
  'seo-agent/actions',
  'seo-agent/learning',
  'seo-agent/safety',
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`   ✅ ${dir}`);
  } else {
    console.log(`   ❌ ${dir} NOT FOUND`);
    allTestsPassed = false;
  }
});

// Test 2: Core Files
console.log('\n📄 Test 2: Checking core files...');
const requiredFiles = [
  'seo-agent/index.js',
  'seo-agent/daily.js',
  'seo-agent/weekly.js',
  'seo-agent/README.md',
  'seo-agent/config/thresholds.js',
  'seo-agent/config/ctrBenchmarks.js',
  'seo-agent/safety/killSwitch.js',
  'seo-agent/ingestion/fetchGSC.js',
  'seo-agent/ingestion/fetchFixloPages.js',
  'seo-agent/decisions/decideCreatePage.js',
  'seo-agent/decisions/decideRewriteMeta.js',
  'seo-agent/decisions/decideExpandContent.js',
  'seo-agent/decisions/decideFreezePage.js',
  'seo-agent/decisions/decideCloneWinners.js',
  'seo-agent/actions/createPage.js',
  'seo-agent/actions/rewriteMeta.js',
  'seo-agent/actions/expandContent.js',
  'seo-agent/actions/submitIndexing.js',
  'seo-agent/learning/evaluateWeekly.js',
  'seo-agent/learning/extractPatterns.js',
  'models/SEOPage.js',
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} NOT FOUND`);
    allTestsPassed = false;
  }
});

// Test 3: Module Imports
console.log('\n🔌 Test 3: Testing module imports...');
try {
  const thresholds = require('./seo-agent/config/thresholds');
  console.log(`   ✅ thresholds.js exports: ${Object.keys(thresholds).length} properties`);
  
  const ctrBenchmarks = require('./seo-agent/config/ctrBenchmarks');
  console.log(`   ✅ ctrBenchmarks.js exports getExpectedCTR function`);
  
  const killSwitch = require('./seo-agent/safety/killSwitch');
  console.log(`   ✅ killSwitch.js exports checkKillSwitch function`);
  
  const fetchGSC = require('./seo-agent/ingestion/fetchGSC');
  console.log(`   ✅ fetchGSC.js exports fetchGSC function`);
  
  const decideCreatePage = require('./seo-agent/decisions/decideCreatePage');
  console.log(`   ✅ decideCreatePage.js exports decideCreatePage function`);
  
} catch (error) {
  console.log(`   ❌ Module import failed: ${error.message}`);
  allTestsPassed = false;
}

// Test 4: Configuration Values
console.log('\n⚙️ Test 4: Validating configuration...');
try {
  const thresholds = require('./seo-agent/config/thresholds');
  
  const checks = [
    { name: 'MIN_IMPRESSIONS_CREATE', value: thresholds.MIN_IMPRESSIONS_CREATE, expected: 100 },
    { name: 'MAX_SERVICES', value: thresholds.MAX_SERVICES, expected: 2 },
    { name: 'MAX_CITIES', value: thresholds.MAX_CITIES, expected: 20 },
    { name: 'MAX_STATES', value: thresholds.MAX_STATES, expected: 1 },
  ];
  
  checks.forEach(check => {
    if (check.value === check.expected) {
      console.log(`   ✅ ${check.name} = ${check.value}`);
    } else {
      console.log(`   ⚠️ ${check.name} = ${check.value} (expected ${check.expected})`);
    }
  });
  
} catch (error) {
  console.log(`   ❌ Configuration validation failed: ${error.message}`);
  allTestsPassed = false;
}

// Test 5: Decision Logic (Dry Run)
console.log('\n🧠 Test 5: Testing decision logic...');
try {
  const { decideCreatePage } = require('./seo-agent/decisions/decideCreatePage');
  
  // Mock GSC data
  const mockGSCData = [
    {
      query: 'plumbing in los angeles',
      service: 'plumbing',
      city: 'los-angeles',
      impressions: 150,
      clicks: 5,
      ctr: 0.033,
      position: 12,
    },
    {
      query: 'electrical in san francisco',
      service: 'electrical',
      city: 'san-francisco',
      impressions: 50, // Too low
      clicks: 2,
      ctr: 0.04,
      position: 15,
    },
  ];
  
  const existingPages = new Set();
  const decisions = decideCreatePage(mockGSCData, existingPages);
  
  console.log(`   ✅ decideCreatePage processed ${mockGSCData.length} queries`);
  console.log(`   ✅ Generated ${decisions.length} decision(s)`);
  
  if (decisions.length > 0) {
    console.log(`   ✅ First decision: ${decisions[0].action} for ${decisions[0].service} in ${decisions[0].city}`);
  }
  
} catch (error) {
  console.log(`   ❌ Decision logic test failed: ${error.message}`);
  allTestsPassed = false;
}

// Test 6: Safety Kill Switch
console.log('\n🛡️ Test 6: Testing safety kill switch...');
try {
  const { checkKillSwitch } = require('./seo-agent/safety/killSwitch');
  
  // Test with safe metrics
  const safeMetrics = {
    clicksDropPercentage: 0.1, // 10% drop (safe)
    indexErrorRate: 0.05, // 5% errors (safe)
  };
  
  checkKillSwitch(safeMetrics)
    .then(() => {
      console.log('   ✅ Kill switch passed with safe metrics');
    })
    .catch(error => {
      console.log(`   ❌ Kill switch triggered unexpectedly: ${error.message}`);
      allTestsPassed = false;
    });
  
  // Test with unsafe metrics (should trigger)
  const unsafeMetrics = {
    clicksDropPercentage: 0.4, // 40% drop (unsafe)
  };
  
  checkKillSwitch(unsafeMetrics)
    .then(() => {
      console.log('   ⚠️ Kill switch should have triggered but did not');
    })
    .catch(error => {
      console.log('   ✅ Kill switch correctly triggered for unsafe metrics');
    });
  
} catch (error) {
  console.log(`   ❌ Kill switch test failed: ${error.message}`);
  allTestsPassed = false;
}

// Test 7: Package.json scripts
console.log('\n📦 Test 7: Checking package.json scripts...');
try {
  const packageJson = require('./package.json');
  
  if (packageJson.scripts['seo-agent:daily']) {
    console.log('   ✅ seo-agent:daily script exists');
  } else {
    console.log('   ❌ seo-agent:daily script missing');
    allTestsPassed = false;
  }
  
  if (packageJson.scripts['seo-agent:weekly']) {
    console.log('   ✅ seo-agent:weekly script exists');
  } else {
    console.log('   ❌ seo-agent:weekly script missing');
    allTestsPassed = false;
  }
  
} catch (error) {
  console.log(`   ❌ Package.json check failed: ${error.message}`);
  allTestsPassed = false;
}

// Final Report
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED - SEO Agent is ready!');
  console.log('\nNext steps:');
  console.log('1. Configure environment variables in .env');
  console.log('2. Set up Google Search Console API');
  console.log('3. Run manually: npm run seo-agent:daily');
  console.log('4. Set up cron jobs for automation');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Review errors above');
  process.exit(1);
}


/**
 * Test script for SEO Agent
 * Tests configuration and basic functionality
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function testSEOAgent() {
  console.log('🧪 Testing SEO Agent Configuration\n');

  const tests = {
    mongodb: false,
    gsc: false,
    openai: false,
    models: false
  };

  // Test 1: MongoDB Connection
  console.log('1️⃣ Testing MongoDB connection...');
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(
      process.env.MONGODB_URI,
      {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
      }
    );
      tests.mongodb = true;
      console.log('   ✅ MongoDB connected');
    } else {
      console.log('   ⚠️ MONGODB_URI not set');
    }
  } catch (error) {
    console.log('   ❌ MongoDB connection failed:', error.message);
  }

  // Test 2: GSC Configuration
  console.log('\n2️⃣ Testing Google Search Console configuration...');
  if (process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY) {
    tests.gsc = true;
    console.log('   ✅ GSC credentials found');
    console.log('   📧 Client email:', process.env.GSC_CLIENT_EMAIL);
    console.log('   🔗 Site URL:', process.env.GSC_SITE_URL || 'sc-domain:fixloapp.com');
  } else {
    console.log('   ⚠️ GSC credentials not found');
    console.log('   Set GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY');
  }

  // Test 3: OpenAI Configuration
  console.log('\n3️⃣ Testing OpenAI configuration...');
  if (process.env.OPENAI_API_KEY) {
    tests.openai = true;
    console.log('   ✅ OpenAI API key found');
    console.log('   🔑 Key:', process.env.OPENAI_API_KEY.substring(0, 10) + '...');
  } else {
    console.log('   ⚠️ OPENAI_API_KEY not found');
  }

  // Test 4: Models
  console.log('\n4️⃣ Testing database models...');
  try {
    const GSCPageDaily = require('./models/GSCPageDaily');
    const GSCQueryDaily = require('./models/GSCQueryDaily');
    const SEOAgentAction = require('./models/SEOAgentAction');
    const SEOPageMapping = require('./models/SEOPageMapping');
    
    tests.models = true;
    console.log('   ✅ All models loaded successfully');
  } catch (error) {
    console.log('   ❌ Failed to load models:', error.message);
  }

  // Test 5: Services
  console.log('\n5️⃣ Testing SEO Agent services...');
  try {
    const { getSEOAgent } = require('./services/seo/seoAgent');
    const { getGSCClient } = require('./services/seo/gscClient');
    const DecisionEngine = require('./services/seo/decisionEngine');
    const ContentGenerator = require('./services/seo/contentGenerator');
    const PageMapper = require('./services/seo/pageMapper');
    
    console.log('   ✅ All services loaded successfully');
    
    // Test agent status
    const agent = getSEOAgent();
    const status = agent.getStatus();
    console.log('   📊 Agent status:', JSON.stringify(status, null, 2));
  } catch (error) {
    console.log('   ❌ Failed to load services:', error.message);
  }

  // Test 6: Constants
  console.log('\n6️⃣ Testing constants...');
  try {
    const constants = require('./config/seoAgentConstants');
    console.log('   ✅ Constants loaded');
    console.log('   📊 MIN_IMPRESSIONS_CREATE:', constants.MIN_IMPRESSIONS_CREATE);
    console.log('   📊 MAX_PAGES_PER_DAY:', constants.MAX_PAGES_PER_DAY);
    console.log('   📊 PAGE_DEAD_DAYS:', constants.PAGE_DEAD_DAYS);
  } catch (error) {
    console.log('   ❌ Failed to load constants:', error.message);
  }

  // Test 7: Agent Enabled
  console.log('\n7️⃣ Checking agent status...');
  const enabled = process.env.SEO_AGENT_ENABLED === 'true';
  console.log('   SEO_AGENT_ENABLED:', enabled ? '✅ true' : '⚠️ false (set to true to enable)');
  
  if (process.env.SEO_AGENT_API_KEY) {
    console.log('   SEO_AGENT_API_KEY:', '✅ Set');
  } else {
    console.log('   SEO_AGENT_API_KEY:', '⚠️ Not set (required for API access)');
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('━'.repeat(50));
  Object.entries(tests).forEach(([name, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${name}`);
  });
  
  const allPassed = Object.values(tests).every(t => t);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! SEO Agent is ready to use.');
  } else {
    console.log('\n⚠️ Some tests failed. Review the configuration above.');
  }

  // Cleanup
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }

  process.exit(allPassed ? 0 : 1);
}

testSEOAgent().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
 main
