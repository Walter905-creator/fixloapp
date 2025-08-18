// client/scripts/write-build-info.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outFile = path.join(__dirname, '..', 'src', 'buildInfo.generated.js');

const isPlaceholder = v =>
  !v || typeof v !== 'string' ? true : v.includes('${');

const fromEnv = (key, fb) => {
  const v = process.env[key];
  return isPlaceholder(v) ? fb : v;
};

const buildId =
  fromEnv('REACT_APP_BUILD_ID', new Date().toISOString());

// Try to get commit SHA from multiple sources
let commitSha = fromEnv('REACT_APP_COMMIT_SHA', '');
if (!commitSha || commitSha === 'unknown') {
  commitSha = fromEnv('VERCEL_GIT_COMMIT_SHA', '');
}
if (!commitSha || commitSha === 'unknown') {
  try {
    commitSha = execSync('git rev-parse HEAD', { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' }).trim();
  } catch (error) {
    commitSha = 'unknown';
  }
}

const content = `// AUTO-GENERATED AT BUILD TIME. DO NOT COMMIT.
export const BUILD_ID = '${buildId}';
export const COMMIT_SHA = '${commitSha}';
`;

fs.writeFileSync(outFile, content, 'utf8');
console.log('[write-build-info] wrote', outFile, 'with', { buildId, commitSha });