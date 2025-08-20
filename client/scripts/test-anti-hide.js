// Simple test script to validate the anti-hide functionality
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Anti-Hide Solution...');

// Test 1: Verify antiHide.js exists
const antiHidePath = path.join(__dirname, '../src/utils/antiHide.js');
if (fs.existsSync(antiHidePath)) {
  console.log('✅ antiHide.js exists');
  
  const content = fs.readFileSync(antiHidePath, 'utf8');
  if (content.includes('REACT_APP_FORCE_UNHIDE') && content.includes('30000') && content.includes('startAntiHideLoop')) {
    console.log('✅ antiHide.js contains expected functionality');
  } else {
    console.log('❌ antiHide.js missing expected functionality');
  }
} else {
  console.log('❌ antiHide.js does not exist');
}

// Test 2: Verify index.js integration
const indexPath = path.join(__dirname, '../src/index.js');
if (fs.existsSync(indexPath)) {
  const content = fs.readFileSync(indexPath, 'utf8');
  if (content.includes('startAntiHideLoop') && content.includes('REACT_APP_FORCE_UNHIDE')) {
    console.log('✅ index.js properly integrates anti-hide loop');
  } else {
    console.log('❌ index.js missing anti-hide integration');
  }
} else {
  console.log('❌ index.js does not exist');
}

// Test 3: Verify CSS seatbelt
const cssPath = path.join(__dirname, '../src/index.css');
if (fs.existsSync(cssPath)) {
  const content = fs.readFileSync(cssPath, 'utf8');
  if (content.includes('!important') && content.includes('opacity: 1') && content.includes('visibility: visible')) {
    console.log('✅ CSS seatbelt is present');
  } else {
    console.log('❌ CSS seatbelt missing or incomplete');
  }
} else {
  console.log('❌ index.css does not exist');
}

// Test 4: Verify health page
const healthPath = path.join(__dirname, '../public/__health.html');
if (fs.existsSync(healthPath)) {
  const content = fs.readFileSync(healthPath, 'utf8');
  if (content.includes('Fixlo Health OK')) {
    console.log('✅ Health page is present and correct');
  } else {
    console.log('❌ Health page missing or incorrect');
  }
} else {
  console.log('❌ __health.html does not exist');
}

// Test 5: Verify vercel.json has health route
const vercelPath = path.join(__dirname, '../vercel.json');
if (fs.existsSync(vercelPath)) {
  const content = fs.readFileSync(vercelPath, 'utf8');
  if (content.includes('__health.html')) {
    console.log('✅ vercel.json has health route');
  } else {
    console.log('❌ vercel.json missing health route');
  }
} else {
  console.log('❌ vercel.json does not exist');
}

console.log('\n🎯 Anti-Hide Solution Test Complete');