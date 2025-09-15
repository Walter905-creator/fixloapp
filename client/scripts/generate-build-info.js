/**
 * Generate build info for CI/CD pipeline
 * Creates buildInfo.generated.js file for the build process
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function main() {
  const buildId = process.env.FIXLO_BUILD_ID || 
                  process.env.REACT_APP_BUILD_ID || 
                  new Date().toISOString().replace(/[:.]/g, '-');
  
  const commitSha = process.env.FIXLO_COMMIT_SHA || 
                    process.env.GITHUB_SHA ||
                    process.env.REACT_APP_COMMIT_SHA || 
                    'unknown';
  
  const branch = process.env.GITHUB_REF_NAME ||
                 process.env.GIT_BRANCH || 
                 'unknown';

  // Create buildInfo.generated.js in src directory
  const srcDir = path.join(__dirname, '..', 'src');
  const buildInfoPath = path.join(srcDir, 'buildInfo.generated.js');
  
  const buildInfo = {
    commit: commitSha,
    branch: branch,
    buildTime: new Date().toISOString(),
    buildId,
    version: process.env.npm_package_version || '1.7.0'
  };

  // Ensure src directory exists
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  // Create the build info module
  const buildInfoContent = `// Auto-generated build info - DO NOT EDIT
export const buildInfo = ${JSON.stringify(buildInfo, null, 2)};

export default buildInfo;
`;

  // Write buildInfo.generated.js
  fs.writeFileSync(buildInfoPath, buildInfoContent);
  
  console.log('✅ Build info generated:', {
    buildId,
    commitSha,
    branch,
    buildInfoPath
  });
  
  return buildInfo;
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };