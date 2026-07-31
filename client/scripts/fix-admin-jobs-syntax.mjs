import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const target = path.resolve(here, '../src/routes/AdminJobsPage.jsx');
const source = fs.readFileSync(target, 'utf8');
const endpointMarker = '/send-initial-followup`';
const endpointIndex = source.indexOf(endpointMarker);

if (endpointIndex === -1) {
  console.log('[fix-admin-jobs-syntax] Follow-up endpoint not present; no repair needed.');
  process.exit(0);
}

const headersStart = source.indexOf('        headers: {', endpointIndex);
const requestEnd = source.indexOf('\n        }\n      });', headersStart);

if (headersStart === -1 || requestEnd === -1) {
  throw new Error('Could not safely locate the initial follow-up headers block.');
}

const correctHeaders = [
  '        headers: {',
  "          'Authorization': `Bearer ${token}` ,",
  "          'Content-Type': 'application/json'",
].join('\n');

const currentHeaders = source.slice(headersStart, requestEnd);
if (currentHeaders === correctHeaders) {
  console.log('[fix-admin-jobs-syntax] AdminJobsPage headers are already valid.');
  process.exit(0);
}

const repaired = source.slice(0, headersStart) + correctHeaders + source.slice(requestEnd);
fs.writeFileSync(target, repaired, 'utf8');
console.log('[fix-admin-jobs-syntax] Repaired AdminJobsPage initial follow-up headers.');
