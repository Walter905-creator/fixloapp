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

const version = {
  commit,
  branch,
  buildTime: new Date().toISOString()
};

const out = path.join(__dirname, '..', 'public', 'version.json');
fs.writeFileSync(out, JSON.stringify(version, null, 2));
console.log('Wrote', out, version);