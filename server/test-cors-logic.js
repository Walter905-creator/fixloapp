// Test script to verify CORS logic for Vercel preview deployments
// Run with: node server/test-cors-logic.js

const allowedOrigins = [
  "https://www.fixloapp.com",
  "https://fixloapp.com",
  "http://localhost:3000",
  "http://localhost:8000",
];

// Helper function to check if origin is allowed (same as in server/index.js)
function isOriginAllowed(origin) {
  if (!origin) return true;
  
  // Check exact matches
  if (allowedOrigins.includes(origin)) return true;
  
  // Allow Vercel preview deployments (*.vercel.app)
  // Security: Only allow HTTPS Vercel domains to prevent spoofing
  if (origin.endsWith('.vercel.app')) {
    try {
      const url = new URL(origin);
      // Double-check hostname after parsing to prevent URL manipulation attacks
      // (e.g., https://evil.com?fake=.vercel.app)
      if (url.protocol === 'https:' && url.hostname.endsWith('.vercel.app')) {
        return true;
      }
    } catch (e) {
      return false;
    }
  }
  
  return false;
}

// Test cases
const testCases = [
  // Production origins - should pass
  { origin: 'https://www.fixloapp.com', expected: true, description: 'Production domain (www)' },
  { origin: 'https://fixloapp.com', expected: true, description: 'Production domain (apex)' },
  
  // Local development - should pass
  { origin: 'http://localhost:3000', expected: true, description: 'Local development (3000)' },
  { origin: 'http://localhost:8000', expected: true, description: 'Local development (8000)' },
  
  // Vercel preview deployments - should pass
  { origin: 'https://fixloapp-rbv1dcn3w-walters-projects-b292b340.vercel.app', expected: true, description: 'Vercel preview deployment' },
  { origin: 'https://fixloapp-git-main-walters-projects.vercel.app', expected: true, description: 'Vercel Git branch deployment' },
  { origin: 'https://fixloapp-abc123.vercel.app', expected: true, description: 'Generic Vercel preview' },
  
  // Invalid origins - should fail
  { origin: 'https://malicious-site.com', expected: false, description: 'Random external domain' },
  { origin: 'http://fixloapp.vercel.app', expected: false, description: 'HTTP Vercel URL (not HTTPS)' },
  { origin: 'https://evil.vercel.app.hacker.com', expected: false, description: 'Vercel domain spoofing' },
  { origin: 'https://evil.com?url=.vercel.app', expected: false, description: 'URL manipulation attack attempt' },
  { origin: 'https://evil.com/.vercel.app', expected: false, description: 'Path-based spoofing attempt' },
  
  // No origin - should pass
  { origin: null, expected: true, description: 'No origin header' },
  { origin: undefined, expected: true, description: 'Undefined origin' },
];

console.log('🧪 Testing CORS Logic\n');
console.log('Allowed Origins:', allowedOrigins);
console.log('\n' + '='.repeat(80) + '\n');

let passed = 0;
let failed = 0;

testCases.forEach(({ origin, expected, description }, index) => {
  const result = isOriginAllowed(origin);
  const status = result === expected ? '✅ PASS' : '❌ FAIL';
  
  if (result === expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`Test ${index + 1}: ${status}`);
  console.log(`  Description: ${description}`);
  console.log(`  Origin: ${origin || '(none)'}`);
  console.log(`  Expected: ${expected}, Got: ${result}`);
  console.log('');
});

console.log('='.repeat(80));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`);

if (failed === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
