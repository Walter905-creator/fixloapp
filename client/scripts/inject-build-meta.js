const fs = require('fs');
const path = require('path');

const out = [
  `REACT_APP_BUILD_ID=${process.env.RELEASE_BUILD_ID || new Date().toISOString()}`,
  `REACT_APP_COMMIT_SHA=${process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || 'unknown'}`
].join('\n');

const target = path.join(__dirname, '..', '.env.production.local');
fs.writeFileSync(target, out);
console.log('[inject-build-meta] wrote', target);
console.log('[inject-build-meta] values:\n' + out);