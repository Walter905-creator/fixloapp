// Ensures CRA sees REACT_APP_* at build time by writing a .env.production file
const fs = require('fs');
const path = require('path');

const COMMIT = process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.GITHUB_SHA
  || process.env.COMMIT_SHA
  || '';

const BUILD_ID = new Date().toISOString();

const lines = [
  `REACT_APP_BUILD_ID=${BUILD_ID}`,
  `REACT_APP_COMMIT_SHA=${COMMIT}`
].join('\n') + '\n';

const envPath = path.join(__dirname, '..', '.env.production');
fs.writeFileSync(envPath, lines, 'utf8');
console.log('[build-meta] wrote', envPath, '\n', lines);