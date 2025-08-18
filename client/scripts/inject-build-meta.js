// client/scripts/inject-build-meta.js
const fs = require('fs');
const path = require('path');

const outFile = path.join(__dirname, '..', '.env.production.local');

const isPlaceholder = v => !v || v.includes('${');

const buildId = new Date().toISOString();
const commitShaEnv = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || process.env.COMMIT_SHA || '';
const commitSha = isPlaceholder(commitShaEnv) ? 'unknown' : commitShaEnv;

const lines = [
  `REACT_APP_BUILD_ID=${buildId}`,
  `REACT_APP_COMMIT_SHA=${commitSha}`,
];

fs.writeFileSync(outFile, lines.join('\n') + '\n', 'utf8');

console.log('[inject-build-meta] wrote', outFile);
console.log('[inject-build-meta] values:', {
  REACT_APP_BUILD_ID: buildId,
  REACT_APP_COMMIT_SHA: commitSha,
});