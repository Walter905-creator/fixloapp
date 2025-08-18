// client/src/buildInfo.js
// Prefer generated artefact; fallback to env just in case.
let generated = { BUILD_ID: 'unknown', COMMIT_SHA: 'unknown' };
try {
  // Import the individual exports from the generated file
  const { BUILD_ID, COMMIT_SHA } = require('./buildInfo.generated.js');
  generated = { BUILD_ID, COMMIT_SHA };
} catch (_) {
  // no-op
}

export const BUILD_INFO = {
  BUILD_ID: generated.BUILD_ID || process.env.REACT_APP_BUILD_ID || 'unknown',
  COMMIT_SHA: generated.COMMIT_SHA || process.env.REACT_APP_COMMIT_SHA || 'unknown',
};