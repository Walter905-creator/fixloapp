const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '..', '.env.production.local');
const BUILD_ID = new Date().toISOString();
const COMMIT_SHA = process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || 'unknown';

const content = `REACT_APP_BUILD_ID=${BUILD_ID}
REACT_APP_COMMIT_SHA=${COMMIT_SHA}
`;

fs.writeFileSync(outPath, content, 'utf8');
console.log('[inject-build-meta] wrote', outPath);
console.log('[inject-build-meta] values:', { REACT_APP_BUILD_ID: BUILD_ID, REACT_APP_COMMIT_SHA: COMMIT_SHA });
