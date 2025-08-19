// client/scripts/inject-build-meta.js
const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '..', '.env.production.local');

const buildId = new Date().toISOString();
const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || 'unknown';

const contents = [
  `REACT_APP_BUILD_ID=${buildId}`,
  `REACT_APP_COMMIT_SHA=${commitSha}`
].join('\n') + '\n';

fs.writeFileSync(outPath, contents, 'utf8');
console.log('[inject-build-meta] wrote', outPath);
console.log('[inject-build-meta] values:', { REACT_APP_BUILD_ID: buildId, REACT_APP_COMMIT_SHA: commitSha });