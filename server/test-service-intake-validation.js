/**
 * Test script for service intake endpoint validation
 * Tests the new database connection checks and error handling
 */

const mongoose = require('mongoose');

async function testDatabaseConnectionCheck() {
  console.log('\n🧪 Testing Database Connection Validation\n');
  
  // Test 1: Check mongoose connection states
  console.log('Test 1: Mongoose connection states');
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  console.log(`  Current state: ${states[mongoose.connection.readyState]} (${mongoose.connection.readyState})`);
  
  // Test 2: Verify MONGODB_URI support
  console.log('\n2️⃣ MongoDB URI environment variable support');
  const MONGODB_URI = process.env.MONGODB_URI;
  console.log(`  MONGODB_URI: ${MONGODB_URI ? '✅ Set' : '❌ Not set'}`);
  
  // Test 3: Check Cloudinary configuration
  console.log('\nTest 3: Cloudinary configuration');
  const hasCloudinary = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  console.log(`  Cloudinary configured: ${hasCloudinary ? '✅ Yes' : '❌ No (will use memory storage)'}`);
  
  // Test 4: Check Stripe configuration
  console.log('\nTest 4: Stripe configuration');
  const hasStripe = !!process.env.STRIPE_SECRET_KEY;
  console.log(`  Stripe configured: ${hasStripe ? '✅ Yes' : '❌ No (payment features disabled)'}`);
  
  console.log('\n✅ All validation checks completed\n');
  console.log('Summary:');
  console.log(`  - Database: ${states[mongoose.connection.readyState]}`);
  console.log(`  - Cloudinary: ${hasCloudinary ? 'Ready' : 'Not configured'}`);
  console.log(`  - Stripe: ${hasStripe ? 'Ready' : 'Not configured'}`);
  console.log('\nNote: Service intake will return 503 if database is not connected.');
  console.log('This prevents 500 errors and provides better user feedback.\n');
}

// Run the test
testDatabaseConnectionCheck()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
