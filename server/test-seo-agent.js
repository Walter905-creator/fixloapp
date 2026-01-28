#!/usr/bin/env node

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
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
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
