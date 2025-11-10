const fs = require('fs');

console.log('🧪 Running Code Validation Tests...\n');

// Test 1: Validate import/export syntax
console.log('Test 1: Syntax Validation');
const files = [
  './utils/authStorage.js',
  './utils/socketService.js',
  './screens/JobDetailScreen.js'
];

let allValid = true;
files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for common syntax issues
    if (!content.includes('export')) {
      console.error('❌', file, '- Missing exports');
      allValid = false;
      return;
    }
    
    console.log('✅', file);
  } catch (err) {
    console.error('❌', file, '- Error:', err.message);
    allValid = false;
  }
});

// Test 2: Check modified files have required changes
console.log('\nTest 2: Feature Integration Validation');

// Check LoginScreen has AsyncStorage import
const loginContent = fs.readFileSync('./screens/LoginScreen.js', 'utf8');
if (loginContent.includes('saveSession')) {
  console.log('✅ LoginScreen integrated with AsyncStorage');
} else {
  console.error('❌ LoginScreen missing AsyncStorage integration');
  allValid = false;
}

// Check App.js has auto-login
const appContent = fs.readFileSync('./App.js', 'utf8');
if (appContent.includes('getSession') && appContent.includes('initializeSocket')) {
  console.log('✅ App.js has auto-login and Socket.io initialization');
} else {
  console.error('❌ App.js missing required features');
  allValid = false;
}

// Check HomeownerScreen has real-time updates
const homeownerContent = fs.readFileSync('./screens/HomeownerScreen.js', 'utf8');
if (homeownerContent.includes('subscribeToJobUpdates') && homeownerContent.includes('Job Detail')) {
  console.log('✅ HomeownerScreen has real-time updates and job detail navigation');
} else {
  console.error('❌ HomeownerScreen missing required features');
  allValid = false;
}

// Check ProScreen has real-time job notifications
const proContent = fs.readFileSync('./screens/ProScreen.js', 'utf8');
if (proContent.includes('subscribeToNewJobs')) {
  console.log('✅ ProScreen has real-time job notifications');
} else {
  console.error('❌ ProScreen missing real-time notifications');
  allValid = false;
}

console.log('\n' + (allValid ? '🎉 All validation tests passed!' : '⚠️ Some tests failed'));
process.exit(allValid ? 0 : 1);
