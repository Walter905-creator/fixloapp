// Generate build info for injection into the build
const fs = require('fs');
const path = require('path');

const buildInfo = {
  buildId: `build-${Date.now()}`,
  commitSha: process.env.GITHUB_SHA || 'local',
  buildTimestamp: Date.now(),
  buildDate: new Date().toISOString()
};

// Write build info to a temp file for injection
const outputPath = path.join(__dirname, '..', 'build-info.json');
fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

console.log('Generated build info:', buildInfo);