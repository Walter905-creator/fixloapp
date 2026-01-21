/**
 * Integration Tests for Vercel API Endpoints
 * 
 * Tests the /api/ping and /api/social/force-status endpoints
 * to verify they return JSON (not HTML) and work correctly.
 * 
 * Usage:
 *   node test-api-endpoints.js [base-url]
 * 
 * Examples:
 *   node test-api-endpoints.js http://localhost:3000
 *   node test-api-endpoints.js https://fixloapp.com
 *   node test-api-endpoints.js https://fixloapp-preview.vercel.app
 */

const https = require('https');
const http = require('http');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

// Test configuration
const BASE_URL = process.argv[2] || 'http://localhost:3000';
const TIMEOUT = 10000; // 10 second timeout

console.log(`${colors.blue}╔═══════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║   Fixlo API Endpoint Integration Tests               ║${colors.reset}`);
console.log(`${colors.blue}╚═══════════════════════════════════════════════════════╝${colors.reset}`);
console.log('');
console.log(`${colors.gray}Testing base URL: ${BASE_URL}${colors.reset}`);
console.log('');

/**
 * Make HTTP(S) request
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout after ${TIMEOUT}ms`));
    }, TIMEOUT);
    
    const req = client.get(url, (res) => {
      clearTimeout(timeout); // Clear timeout on successful response
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    
    req.on('error', (error) => {
      clearTimeout(timeout); // Clear timeout on error
      reject(error);
    });
    
    req.on('timeout', () => {
      clearTimeout(timeout);
      req.destroy();
      reject(new Error(`Request timeout after ${TIMEOUT}ms`));
    });
  });
}

/**
 * Test result tracking
 */
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

/**
 * Assert helper
 */
function assert(condition, testName, errorMessage) {
  if (condition) {
    results.passed++;
    results.tests.push({ name: testName, passed: true });
    console.log(`  ${colors.green}✓${colors.reset} ${testName}`);
    return true;
  } else {
    results.failed++;
    results.tests.push({ name: testName, passed: false, error: errorMessage });
    console.log(`  ${colors.red}✗${colors.reset} ${testName}`);
    if (errorMessage) {
      console.log(`    ${colors.red}${errorMessage}${colors.reset}`);
    }
    return false;
  }
}

/**
 * Test /api/ping endpoint
 */
async function testPingEndpoint() {
  console.log(`${colors.yellow}Test Suite: /api/ping${colors.reset}`);
  console.log('');
  
  try {
    const url = `${BASE_URL}/api/ping`;
    const response = await makeRequest(url);
    
    // Test 1: Status code is 200
    assert(
      response.statusCode === 200,
      'Returns 200 status code',
      `Expected 200, got ${response.statusCode}`
    );
    
    // Test 2: Content-Type is JSON
    const contentType = response.headers['content-type'] || '';
    assert(
      contentType.includes('application/json'),
      'Returns JSON content type',
      `Expected application/json, got ${contentType}`
    );
    
    // Test 3: Response is valid JSON
    let jsonData;
    try {
      jsonData = JSON.parse(response.body);
      assert(true, 'Response is valid JSON');
    } catch (e) {
      assert(false, 'Response is valid JSON', `JSON parse error: ${e.message}`);
      return;
    }
    
    // Test 4: Response has required fields
    assert(
      jsonData.status === 'ok',
      'Response contains status: "ok"',
      `Expected status: "ok", got ${jsonData.status}`
    );
    
    assert(
      typeof jsonData.timestamp === 'string',
      'Response contains timestamp field',
      `Timestamp field missing or not a string`
    );
    
    assert(
      typeof jsonData.message === 'string',
      'Response contains message field',
      `Message field missing or not a string`
    );
    
    // Test 5: Response does NOT contain HTML
    assert(
      !response.body.includes('<!DOCTYPE html>') && !response.body.includes('<html'),
      'Response is not HTML (confirming JSON)',
      'Response contains HTML tags'
    );
    
    console.log('');
    console.log(`  ${colors.gray}Sample response:${colors.reset}`);
    console.log(`  ${colors.gray}${JSON.stringify(jsonData, null, 2).split('\n').join('\n  ')}${colors.reset}`);
    
  } catch (error) {
    assert(false, 'Endpoint is accessible', error.message);
  }
  
  console.log('');
}

/**
 * Test /api/social/force-status endpoint
 */
async function testForceStatusEndpoint() {
  console.log(`${colors.yellow}Test Suite: /api/social/force-status${colors.reset}`);
  console.log('');
  
  try {
    const url = `${BASE_URL}/api/social/force-status`;
    const response = await makeRequest(url);
    
    // Test 1: Status code is 200
    assert(
      response.statusCode === 200,
      'Returns 200 status code',
      `Expected 200, got ${response.statusCode}`
    );
    
    // Test 2: Content-Type is JSON
    const contentType = response.headers['content-type'] || '';
    assert(
      contentType.includes('application/json'),
      'Returns JSON content type',
      `Expected application/json, got ${contentType}`
    );
    
    // Test 3: Response is valid JSON
    let jsonData;
    try {
      jsonData = JSON.parse(response.body);
      assert(true, 'Response is valid JSON');
    } catch (e) {
      assert(false, 'Response is valid JSON', `JSON parse error: ${e.message}`);
      return;
    }
    
    // Test 4: Response has required fields
    assert(
      typeof jsonData.success === 'boolean',
      'Response contains success field',
      `Success field missing or not a boolean`
    );
    
    assert(
      typeof jsonData.facebookConnected === 'boolean',
      'Response contains facebookConnected field',
      `facebookConnected field missing or not a boolean`
    );
    
    assert(
      typeof jsonData.instagramConnected === 'boolean',
      'Response contains instagramConnected field',
      `instagramConnected field missing or not a boolean`
    );
    
    assert(
      'requestId' in jsonData,
      'Response contains requestId field',
      `requestId field missing`
    );
    
    // Test 5: Response does NOT contain HTML
    assert(
      !response.body.includes('<!DOCTYPE html>') && !response.body.includes('<html'),
      'Response is not HTML (confirming JSON)',
      'Response contains HTML tags'
    );
    
    // Test 6: X-Request-ID header is present
    assert(
      'x-request-id' in response.headers,
      'Response includes X-Request-ID header',
      'X-Request-ID header missing'
    );
    
    console.log('');
    console.log(`  ${colors.gray}Sample response:${colors.reset}`);
    console.log(`  ${colors.gray}${JSON.stringify(jsonData, null, 2).split('\n').join('\n  ')}${colors.reset}`);
    
  } catch (error) {
    assert(false, 'Endpoint is accessible', error.message);
  }
  
  console.log('');
}

/**
 * Print summary
 */
function printSummary() {
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log('');
  
  const total = results.passed + results.failed;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  if (results.failed === 0) {
    console.log(`${colors.green}✓ All tests passed!${colors.reset} (${results.passed}/${total})`);
  } else {
    console.log(`${colors.red}✗ Some tests failed${colors.reset}`);
    console.log(`  Passed: ${colors.green}${results.passed}${colors.reset}`);
    console.log(`  Failed: ${colors.red}${results.failed}${colors.reset}`);
    console.log(`  Total: ${total}`);
    console.log(`  Pass rate: ${passRate}%`);
  }
  
  console.log('');
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    await testPingEndpoint();
    await testForceStatusEndpoint();
  } catch (error) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
  }
  
  printSummary();
}

// Run tests
runTests();
