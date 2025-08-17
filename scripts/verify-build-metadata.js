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
  
  // Check for unreplaced placeholders
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
  
  // Check for proper BUILD_ID format
  const buildIdMatch = content.match(/BUILD_ID:"([^"]+)"/);
  if (!buildIdMatch) {
    console.error('❌ BUILD_ID not found in the built HTML');
    process.exit(1);
  }
  
  const buildId = buildIdMatch[1];
  console.log(`✅ BUILD_ID found: ${buildId}`);
  
  // Check for COMMIT_SHA
  const commitShaMatch = content.match(/COMMIT_SHA:"([^"]*)"/);
  if (!commitShaMatch) {
    console.error('❌ COMMIT_SHA not found in the built HTML');
    process.exit(1);
  }
  
  const commitSha = commitShaMatch[1];
  console.log(`✅ COMMIT_SHA found: ${commitSha || '(empty)'}`);
  
  // Check meta tags
  const metaBuildIdMatch = content.match(/name="fixlo-build-id" content="([^"]+)"/);
  if (!metaBuildIdMatch || metaBuildIdMatch[1] !== buildId) {
    console.error('❌ Meta tag fixlo-build-id does not match BUILD_ID');
    process.exit(1);
  }
  
  console.log('✅ Meta tag fixlo-build-id matches BUILD_ID');
  console.log('🎉 Build metadata verification passed!');
}

if (require.main === module) {
  verifyBuildMetadata();
}

module.exports = { verifyBuildMetadata };