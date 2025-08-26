#!/usr/bin/env node

/**
 * Generate build information for the React app
 */

const fs = require('fs');
const path = require('path');

function generateBuildInfo() {
  const buildInfo = {
    BUILD_ID: process.env.REACT_APP_BUILD_ID || new Date().toISOString(),
    COMMIT_SHA: process.env.REACT_APP_COMMIT_SHA || 'unknown',
    BUILD_TIMESTAMP: process.env.REACT_APP_BUILD_TIMESTAMP || Date.now().toString(),
    NODE_ENV: process.env.NODE_ENV || 'production'
  };

  // Write to public directory so it's available during build
  const publicDir = path.join(__dirname, '..', 'public');
  const buildInfoPath = path.join(publicDir, 'build-info.json');
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  
  console.log('✅ Generated build info:', buildInfoPath);
  console.log('Build Info:', buildInfo);
  
  return buildInfo;
}

if (require.main === module) {
  generateBuildInfo();
}

module.exports = { generateBuildInfo };