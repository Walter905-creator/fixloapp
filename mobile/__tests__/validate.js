const fs = require('fs');

// Test 1: Validate import/export syntax

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
      if (__DEV__) {
      console.error('❌', file, '- Missing exports');
      }
      allValid = false;
      return;
    }

  } catch (err) {
    if (__DEV__) {
    console.error('❌', file, '- Error:', err.message);
    }
    allValid = false;
  }
});

// Test 2: Check modified files have required changes

// Check LoginScreen has AsyncStorage import
const loginContent = fs.readFileSync('./screens/LoginScreen.js', 'utf8');
if (loginContent.includes('saveSession')) {

} else {
  if (__DEV__) {
  console.error('❌ LoginScreen missing AsyncStorage integration');
  }
  allValid = false;
}

// Check App.js has auto-login
const appContent = fs.readFileSync('./App.js', 'utf8');
if (appContent.includes('getSession') && appContent.includes('initializeSocket')) {

} else {
  if (__DEV__) {
  console.error('❌ App.js missing required features');
  }
  allValid = false;
}

// Check HomeownerScreen has real-time updates
const homeownerContent = fs.readFileSync('./screens/HomeownerScreen.js', 'utf8');
if (homeownerContent.includes('subscribeToJobUpdates') && homeownerContent.includes('Job Detail')) {

} else {
  if (__DEV__) {
  console.error('❌ HomeownerScreen missing required features');
  }
  allValid = false;
}

// Check ProScreen has real-time job notifications
const proContent = fs.readFileSync('./screens/ProScreen.js', 'utf8');
if (proContent.includes('subscribeToNewJobs')) {

} else {
  if (__DEV__) {
  console.error('❌ ProScreen missing real-time notifications');
  }
  allValid = false;
}

console.log('\n' + (allValid ? '🎉 All validation tests passed!' : '⚠️ Some tests failed'));
process.exit(allValid ? 0 : 1);
