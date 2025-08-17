// client/scripts/generate-build-info.js
const fs = require('fs');
const path = require('path');

function getCommitSha() {
  const fromVercel = process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromVercel && fromVercel.trim().length > 0) return fromVercel.trim();

  try {
    const { execSync } = require('child_process');
    const sha = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (sha) return sha;
  } catch (_) {}
  return 'unknown';
}

function getBuildId() {
  // Allow override, else use UTC ISO
  return process.env.RELEASE_BUILD_ID || new Date().toISOString();
}

const buildInfo = {
  BUILD_ID: getBuildId(),
  COMMIT_SHA: getCommitSha(),
};

const outPath = path.join(__dirname, '..', 'src', 'buildInfo.generated.js');
const content =
  `// AUTO-GENERATED at build time. Do not edit.\n` +
  `module.exports = { BUILD_INFO: ${JSON.stringify(buildInfo, null, 2)} };\n`;

fs.writeFileSync(outPath, content, 'utf8');
console.log('[build-info] Wrote', outPath, 'with', buildInfo);