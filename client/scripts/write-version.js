const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get git commit SHA and branch
let commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT;
let branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GIT_BRANCH;

// Fallback to git commands if environment variables are not available
if (!commit) {
  try {
    commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    commit = 'unknown';
  }
}

if (!branch) {
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    branch = 'unknown';
  }
}

// Support for FIXLO BUILD format
const buildId = process.env.REACT_APP_BUILD_ID || process.env.FIXLO_BUILD_ID || new Date().toISOString();
const commitSha = process.env.REACT_APP_COMMIT_SHA || process.env.FIXLO_COMMIT_SHA || commit;

const version = {
  commit: commitSha,
  branch,
  buildTime: new Date().toISOString(),
  buildId,
  commitSha
};

const out = path.join(__dirname, '..', 'public', 'version.json');
fs.writeFileSync(out, JSON.stringify(version, null, 2));
console.log('Wrote', out, version);