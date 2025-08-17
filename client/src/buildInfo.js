// client/src/buildInfo.js
// Prefer generated artefact; fallback to env just in case.
let generated = { BUILD_ID: 'unknown', COMMIT_SHA: 'unknown' };
try {
  // eslint-disable-next-line global-require
  generated = require('./buildInfo.generated.js').BUILD_INFO;
} catch (_) {
  // no-op
}

export const BUILD_INFO = {
  BUILD_ID: generated.BUILD_ID || process.env.REACT_APP_BUILD_ID || 'unknown',
  COMMIT_SHA: generated.COMMIT_SHA || process.env.REACT_APP_COMMIT_SHA || 'unknown',
};