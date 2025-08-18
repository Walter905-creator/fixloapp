// client/scripts/write-build-info.js
const fs = require('fs');
const path = require('path');

const outFile = path.join(__dirname, '..', 'src', 'buildInfo.generated.js');

const isPlaceholder = v =>
  !v || typeof v !== 'string' ? true : v.includes('${');

const fromEnv = (key, fb) => {
  const v = process.env[key];
  return isPlaceholder(v) ? fb : v;
};

const buildId =
  fromEnv('REACT_APP_BUILD_ID', new Date().toISOString());

const commitFromReact = fromEnv('REACT_APP_COMMIT_SHA', '');
const commitFromVercel = fromEnv('VERCEL_GIT_COMMIT_SHA', '');
const commitSha = commitFromReact || commitFromVercel || 'unknown';

const content = `// AUTO-GENERATED AT BUILD TIME. DO NOT COMMIT.
export const BUILD_ID = '${buildId}';
export const COMMIT_SHA = '${commitSha}';
`;

fs.writeFileSync(outFile, content, 'utf8');
console.log('[write-build-info] wrote', outFile, 'with', { buildId, commitSha });