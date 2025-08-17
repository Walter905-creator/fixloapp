// Reads values injected by CRA at build time
export const BUILD_INFO = {
  BUILD_ID: process.env.REACT_APP_BUILD_ID || 'unknown',
  COMMIT_SHA: process.env.REACT_APP_COMMIT_SHA || 'unknown',
};