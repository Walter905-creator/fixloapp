// client/src/utils/buildInfo.js
export const BUILD_STAMP =
  process.env.REACT_APP_BUILD_ID ||
  new Date().toISOString();