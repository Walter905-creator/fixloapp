// client/scripts/inject-build-meta.js
const fs = require('fs');
const path = require('path');

function isoUtc() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
}

// Prefer Vercel's commit SHA; fall back to unknown (don't leave it blank)
// Also detect and reject placeholder strings like ${VERCEL_GIT_COMMIT_SHA}
const rawCommitSha = process.env.VERCEL_GIT_COMMIT_SHA;
const commitSha =
  rawCommitSha &&
  String(rawCommitSha).trim().length > 0 &&
  !rawCommitSha.includes('${') &&  // Reject placeholder strings
  !rawCommitSha.includes('%')      // Reject placeholder strings
    ? rawCommitSha.trim()
    : 'unknown';

// Build ID with placeholder detection
const rawBuildId = process.env.RELEASE_BUILD_ID;
const buildId = rawBuildId &&
  !rawBuildId.includes('${') &&  // Reject placeholder strings
  !rawBuildId.includes('%')      // Reject placeholder strings
    ? rawBuildId
    : isoUtc();

const lines = [
  `REACT_APP_BUILD_ID=${buildId}`,
  `REACT_APP_COMMIT_SHA=${commitSha}`,
  '', // newline at end
].join('\n');

// Write to .env.production.local so CRA picks it up automatically
const envPath = path.join(process.cwd(), '.env.production.local');
fs.writeFileSync(envPath, lines);

console.log('[inject-build-meta] wrote', envPath);
console.log('[inject-build-meta] values:', { REACT_APP_BUILD_ID: buildId, REACT_APP_COMMIT_SHA: commitSha });