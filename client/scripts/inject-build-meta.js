
/**
 * Simple build metadata injection script for client builds
 * Creates version.json and sets environment variables for build tracking
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function main() {
  const buildId = process.env.FIXLO_BUILD_ID || 
                  process.env.REACT_APP_BUILD_ID || 
                  new Date().toISOString();
  
  const commitSha = process.env.FIXLO_COMMIT_SHA || 
                    process.env.REACT_APP_COMMIT_SHA || 
                    'unknown';

  // Create version.json in public directory for client
  const publicDir = path.join(__dirname, '..', 'public');
  const versionPath = path.join(publicDir, 'version.json');
  
  const version = {
    commit: commitSha,
    branch: process.env.GIT_BRANCH || 'unknown',
    buildTime: new Date().toISOString(),
    buildId,
    commitSha
  };

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write version.json
  fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));
  
  // Set environment variables for build process
  process.env.REACT_APP_BUILD_ID = buildId;
  process.env.REACT_APP_COMMIT_SHA = commitSha;
  
  console.log('✅ Build metadata injected:', {
    buildId,
    commitSha,
    versionPath
  });
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
