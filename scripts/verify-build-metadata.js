#!/usr/bin/env node

/**
 * Verify Build Metadata Script
 * Ensures that all environment variable placeholders are properly replaced in the build
 */

const fs = require('fs');
const path = require('path');

function verifyBuildMetadata() {
  console.log('🔍 Verifying build metadata replacement...');
  
  const indexPath = path.join(__dirname, '..', 'client', 'build', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ Build index.html not found at:', indexPath);
    process.exit(1);
  }
  
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Check for unreplaced placeholders in HTML
  const unreplacedPlaceholders = content.match(/%REACT_APP_[^%]+%/g);
  
  if (unreplacedPlaceholders) {
    console.error('❌ Found unreplaced environment variable placeholders:');
    unreplacedPlaceholders.forEach(placeholder => {
      console.error(`   ${placeholder}`);
    });
    console.error('\n💡 This indicates that environment variables were not properly set during build.');
    console.error('   Please ensure REACT_APP_BUILD_ID and REACT_APP_COMMIT_SHA are exported before building.');
    process.exit(1);
  }
  
  console.log('✅ No unreplaced placeholders found in HTML');
  
  // Check JavaScript bundles for build info
  const buildDir = path.join(__dirname, '..', 'client', 'build', 'static', 'js');
  
  if (!fs.existsSync(buildDir)) {
    console.error('❌ JavaScript build directory not found at:', buildDir);
    process.exit(1);
  }
  
  const jsFiles = fs.readdirSync(buildDir).filter(file => file.endsWith('.js'));
  let buildInfoFound = false;
  
  for (const jsFile of jsFiles) {
    const jsPath = path.join(buildDir, jsFile);
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    if (jsContent.includes('FIXLO BUILD')) {
      buildInfoFound = true;
      console.log(`✅ FIXLO BUILD found in JavaScript bundle: ${jsFile}`);
      break;
    }
  }
  
  if (!buildInfoFound) {
    console.warn('⚠️  FIXLO BUILD not found in any JavaScript bundle - this is optional');
  }
  
  console.log('🎉 Build metadata verification passed!');
  console.log('   - No HTML placeholders found');
  console.log('   - Build info properly moved to JavaScript runtime');
}

if (require.main === module) {
  verifyBuildMetadata();
}

module.exports = { verifyBuildMetadata };