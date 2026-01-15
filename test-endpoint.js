const path = require('path');
const jwtModule = require('./server/node_modules/jsonwebtoken');

// Mock JWT token for testing
const JWT_SECRET = 'change-this-to-a-secure-random-string-in-production';

console.log('=== Test 1: Valid Token ===');
const testUser1 = {
  email: 'test@example.com',
  name: 'Test User',
  proId: 'test-pro-123',
  country: 'US'
};

const token1 = jwtModule.sign(testUser1, JWT_SECRET, { expiresIn: '1h' });
console.log('Token:', token1);
console.log('Command:', `curl -s -X GET http://localhost:3001/api/commission-referrals/referrer/me -H "Authorization: Bearer ${token1}" | python3 -m json.tool`);

console.log('\n=== Test 2: Different User ===');
const testUser2 = {
  email: 'another@example.com',
  name: 'Another User',
  proId: 'test-pro-456',
  country: 'GB'
};

const token2 = jwtModule.sign(testUser2, JWT_SECRET, { expiresIn: '1h' });
console.log('Token:', token2);
console.log('Command:', `curl -s -X GET http://localhost:3001/api/commission-referrals/referrer/me -H "Authorization: Bearer ${token2}" | python3 -m json.tool`);

console.log('\n=== Test 3: Missing Token ===');
console.log('Command:', `curl -s -X GET http://localhost:3001/api/commission-referrals/referrer/me | python3 -m json.tool`);

console.log('\n=== Test 4: Invalid Token ===');
console.log('Command:', `curl -s -X GET http://localhost:3001/api/commission-referrals/referrer/me -H "Authorization: Bearer invalid-token-123" | python3 -m json.tool`);
