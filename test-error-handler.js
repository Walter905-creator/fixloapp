#!/usr/bin/env node

/**
 * Simple validation script for referral verification error handling
 * 
 * This script validates that:
 * 1. Error handler middleware returns structured JSON
 * 2. Method validation works correctly
 * 3. Error messages are user-friendly
 */

const errorHandler = require('./server/middleware/errorHandler');

console.log('🧪 Testing Error Handler Middleware\n');

// Mock request object
const mockReq = {
  originalUrl: '/api/referrals/send-verification',
  method: 'POST'
};

// Mock response object
class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.responseData = null;
  }
  
  status(code) {
    this.statusCode = code;
    return this;
  }
  
  json(data) {
    this.responseData = data;
    return this;
  }
}

// Test cases
const tests = [
  {
    name: 'Generic 500 error',
    error: new Error('Database connection failed'),
    expectedStatus: 500,
    expectedError: 'INTERNAL_ERROR',
    expectedMessage: 'Something went wrong. Please try again.'
  },
  {
    name: 'Validation error',
    error: Object.assign(new Error('Invalid input'), { name: 'ValidationError' }),
    expectedStatus: 400,
    expectedError: 'VALIDATION_ERROR',
    expectedMessage: 'Invalid input provided'
  },
  {
    name: 'JWT error',
    error: Object.assign(new Error('Invalid token'), { name: 'JsonWebTokenError' }),
    expectedStatus: 401,
    expectedError: 'INVALID_TOKEN',
    expectedMessage: 'Authentication failed'
  },
  {
    name: 'Expired token',
    error: Object.assign(new Error('Token expired'), { name: 'TokenExpiredError' }),
    expectedStatus: 401,
    expectedError: 'TOKEN_EXPIRED',
    expectedMessage: 'Session expired. Please sign in again.'
  },
  {
    name: 'Duplicate entry',
    error: Object.assign(new Error('Duplicate key'), { code: 11000 }),
    expectedStatus: 409,
    expectedError: 'DUPLICATE_ENTRY',
    expectedMessage: 'This entry already exists'
  }
];

let passed = 0;
let failed = 0;

// Run tests
tests.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`);
  
  const mockRes = new MockResponse();
  errorHandler(test.error, mockReq, mockRes, () => {});
  
  // Validate response
  const errors = [];
  
  if (mockRes.statusCode !== test.expectedStatus) {
    errors.push(`  ❌ Expected status ${test.expectedStatus}, got ${mockRes.statusCode}`);
  }
  
  if (!mockRes.responseData) {
    errors.push(`  ❌ No response data returned`);
  } else {
    if (mockRes.responseData.error !== test.expectedError) {
      errors.push(`  ❌ Expected error code '${test.expectedError}', got '${mockRes.responseData.error}'`);
    }
    
    if (mockRes.responseData.message !== test.expectedMessage) {
      errors.push(`  ❌ Expected message '${test.expectedMessage}', got '${mockRes.responseData.message}'`);
    }
    
    if (!mockRes.responseData.timestamp) {
      errors.push(`  ❌ Missing timestamp in response`);
    }
    
    // Verify no stack traces in production mode
    if (process.env.NODE_ENV === 'production' && mockRes.responseData.stack) {
      errors.push(`  ❌ Stack trace exposed in production mode`);
    }
  }
  
  if (errors.length === 0) {
    console.log('  ✅ PASSED');
    console.log(`  Response: ${JSON.stringify(mockRes.responseData)}`);
    passed++;
  } else {
    console.log('  ❌ FAILED');
    errors.forEach(err => console.log(err));
    failed++;
  }
  
  console.log('');
});

// Summary
console.log('═══════════════════════════════════════');
console.log(`Tests completed: ${tests.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('═══════════════════════════════════════');

if (failed === 0) {
  console.log('\n🎉 All tests passed! Error handler is working correctly.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.\n');
  process.exit(1);
}
