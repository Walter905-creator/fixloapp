const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// sanity: default 'unknown' if env missing
const sha = process.env.VERCEL_GIT_COMMIT_SHA || "unknown";
const id  = new Date().toISOString();

// Get commit SHA from git if not available in environment
let commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT;
if (!commitSha) {
  try {
    commitSha = execSync('git rev-parse HEAD', { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' }).trim();
  } catch (error) {
    commitSha = 'unknown';
  }
}

const out = [
  `REACT_APP_BUILD_ID=${process.env.RELEASE_BUILD_ID || new Date().toISOString()}`,
  `REACT_APP_COMMIT_SHA=${commitSha}`
].join('\n');

const target = path.join(__dirname, '..', '.env.production.local');
fs.writeFileSync(target, out);
console.log('[inject-build-meta] wrote', target);
console.log('[inject-build-meta] values:\n' + out);