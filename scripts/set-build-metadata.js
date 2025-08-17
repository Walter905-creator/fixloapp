#!/usr/bin/env node

/**
 * Script to set build metadata from FIXLO BUILD format
 * Usage: node scripts/set-build-metadata.js "FIXLO BUILD {BUILD_ID: '2025-08-16T22:19:50', COMMIT_SHA: '622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde'}"
 */

const fs = require('fs');
const path = require('path');

function parseBuildMetadata(buildString) {
  // Parse FIXLO BUILD {BUILD_ID: '...', COMMIT_SHA: '...'}
  const match = buildString.match(/FIXLO BUILD \{BUILD_ID: '([^']+)', COMMIT_SHA: '([^']+)'\}/);
  
  if (!match) {
    throw new Error('Invalid FIXLO BUILD format. Expected: FIXLO BUILD {BUILD_ID: \'...\', COMMIT_SHA: \'...\'}');
  }
  
  let buildId = match[1];
  let commitSha = match[2];
  
  // Detect and handle placeholder strings or 'unknown' values
  // Similar to client/scripts/inject-build-meta.js logic
  
  // Handle BUILD_ID: reject placeholders and 'unknown', use current timestamp as fallback
  if (buildId === 'unknown' || 
      buildId.includes('${') || 
      buildId.includes('%') ||
      buildId.trim().length === 0) {
    buildId = new Date().toISOString();
    console.log('⚠️  BUILD_ID was invalid/placeholder, using fallback:', buildId);
  }
  
  // Handle COMMIT_SHA: reject placeholders, but keep 'unknown' as valid fallback
  if (commitSha.includes('${') || 
      commitSha.includes('%') ||
      commitSha.trim().length === 0) {
    commitSha = 'unknown';
    console.log('⚠️  COMMIT_SHA was placeholder/empty, using fallback: unknown');
  }
  
  return {
    BUILD_ID: buildId,
    COMMIT_SHA: commitSha
  };
}

function updateVersionJson(buildId, commitSha) {
  const versionPath = path.join(__dirname, '..', 'version.json');
  const clientVersionPath = path.join(__dirname, '..', 'client', 'public', 'version.json');
  
  const version = {
    commit: commitSha,
    branch: process.env.GIT_BRANCH || 'unknown',
    buildTime: new Date().toISOString(),
    buildId,
    commitSha
  };
  
  // Update root version.json
  fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));
  console.log('Updated', versionPath, version);
  
  // Update client version.json if it exists
  const clientDir = path.dirname(clientVersionPath);
  if (fs.existsSync(clientDir)) {
    fs.writeFileSync(clientVersionPath, JSON.stringify(version, null, 2));
    console.log('Updated', clientVersionPath, version);
  }
  
  return version;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node scripts/set-build-metadata.js "FIXLO BUILD {BUILD_ID: \'...\', COMMIT_SHA: \'...\'}"');
    process.exit(1);
  }
  
  try {
    const buildString = args[0];
    const metadata = parseBuildMetadata(buildString);
    
    console.log('Parsed build metadata:', metadata);
    
    // Set environment variables for build process
    process.env.FIXLO_BUILD_ID = metadata.BUILD_ID;
    process.env.FIXLO_COMMIT_SHA = metadata.COMMIT_SHA;
    process.env.REACT_APP_BUILD_ID = metadata.BUILD_ID;
    process.env.REACT_APP_COMMIT_SHA = metadata.COMMIT_SHA;
    
    // Update version files
    const version = updateVersionJson(metadata.BUILD_ID, metadata.COMMIT_SHA);
    
    console.log('✅ Build metadata set successfully:');
    console.log('  BUILD_ID:', metadata.BUILD_ID);
    console.log('  COMMIT_SHA:', metadata.COMMIT_SHA);
    
    return version;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseBuildMetadata, updateVersionJson, main };