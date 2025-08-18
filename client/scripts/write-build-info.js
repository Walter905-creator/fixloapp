// client/scripts/write-build-info.js
const fs = require('fs');
const path = require('path');

const outFile = path.join(__dirname, '..', 'src', 'buildInfo.generated.js');
const buildId =
  process.env.REACT_APP_BUILD_ID ||
  new Date().toISOString();
const commitSha =
  process.env.REACT_APP_COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  'unknown';

const content = `// AUTO-GENERATED AT BUILD TIME. DO NOT COMMIT.
export const BUILD_INFO = {
  BUILD_ID: '${buildId}',
  COMMIT_SHA: '${commitSha}'
};
`;

fs.writeFileSync(outFile, content, 'utf8');
console.log('[write-build-info] wrote', outFile, 'with', { buildId, commitSha });