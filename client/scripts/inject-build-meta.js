// client/scripts/inject-build-meta.js
const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "..", ".env.production.local");
const buildId =
  process.env.RELEASE_BUILD_ID ||
  new Date().toISOString();
const commit =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT ||
  "unknown";

const content = [
  `REACT_APP_BUILD_ID=${buildId}`,
  `REACT_APP_COMMIT_SHA=${commit}`
].join("\n") + "\n";

fs.writeFileSync(out, content, "utf8");
console.log("[inject-build-meta] wrote", out);
console.log("[inject-build-meta] values:", { REACT_APP_BUILD_ID: buildId, REACT_APP_COMMIT_SHA: commit });
