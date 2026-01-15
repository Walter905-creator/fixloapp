/**
 * Test script for authenticated referral endpoint
 * Tests the new /api/commission-referrals/referrer/me endpoint
 */

const jwt = require('jsonwebtoken');

// Mock JWT token for testing
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Create a test token
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  proId: 'test-pro-123',
  country: 'US'
};

const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

console.log('Test Token Generated:');
console.log(token);
console.log('\nTest User Data:');
console.log(JSON.stringify(testUser, null, 2));

console.log('\n\n=== Test cURL Command ===');
console.log(`curl -X GET http://localhost:3001/api/commission-referrals/referrer/me \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json"`);

console.log('\n\n=== Expected Response (if referrer exists or auto-created) ===');
console.log(`{
  "ok": true,
  "referralCode": "FIXLO-REF-XXXXXX",
  "referralUrl": "https://www.fixloapp.com/join?commission_ref=FIXLO-REF-XXXXXX"
}`);
