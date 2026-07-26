/**
 * CSRF endpoint – static source analysis tests
 *
 * Verifies that the /api/csrf-token endpoint is registered BEFORE any broad
 * app.use("/api", router) mounts that carry global requireUser middleware
 * (messages, notifications, calendar, documents).  Those routers returned 401
 * for unauthenticated GET /api/csrf-token when the endpoint was registered
 * after them.
 *
 * Run with:  node --test server/routes/csrf.test.js
 */

'use strict';

const test   = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('node:fs');
const path   = require('node:path');

const INDEX_FILE = path.join(__dirname, '..', 'index.js');
const source = fs.readFileSync(INDEX_FILE, 'utf8');

// Split source into lines so we can compare line numbers
const lines = source.split('\n');

function lineOf(pattern) {
  const idx = lines.findIndex(l => pattern.test(l));
  return idx; // -1 if not found
}

// ── CSRF endpoint registration ────────────────────────────────────────────────

test('GET /api/csrf-token is registered in index.js', () => {
  assert.match(
    source,
    /app\.get\s*\(\s*['"]\/api\/csrf-token['"]/,
    'index.js must define app.get("/api/csrf-token", ...)'
  );
});

test('GET /api/csrf-token is registered before messages router', () => {
  const csrfLine     = lineOf(/app\.get\s*\(\s*['"]\/api\/csrf-token['"]/);
  const messagesLine = lineOf(/app\.use\s*\(\s*["']\/api["'],\s*.*require.*routes\/messages/);

  assert.notStrictEqual(csrfLine, -1, '/api/csrf-token endpoint not found in index.js');
  assert.notStrictEqual(messagesLine, -1, 'messages router mount not found in index.js');
  assert.ok(
    csrfLine < messagesLine,
    `/api/csrf-token (line ${csrfLine + 1}) must be registered BEFORE messages router (line ${messagesLine + 1})`
  );
});

test('GET /api/csrf-token is registered before notifications router', () => {
  const csrfLine          = lineOf(/app\.get\s*\(\s*['"]\/api\/csrf-token['"]/);
  const notificationsLine = lineOf(/app\.use\s*\(\s*["']\/api["'],\s*.*require.*routes\/notifications/);

  assert.notStrictEqual(csrfLine, -1, '/api/csrf-token endpoint not found in index.js');
  assert.notStrictEqual(notificationsLine, -1, 'notifications router mount not found in index.js');
  assert.ok(
    csrfLine < notificationsLine,
    `/api/csrf-token (line ${csrfLine + 1}) must be registered BEFORE notifications router (line ${notificationsLine + 1})`
  );
});

test('GET /api/csrf-token is registered before calendar router', () => {
  const csrfLine     = lineOf(/app\.get\s*\(\s*['"]\/api\/csrf-token['"]/);
  const calendarLine = lineOf(/app\.use\s*\(\s*["']\/api["'],\s*.*require.*routes\/calendar/);

  assert.notStrictEqual(csrfLine, -1, '/api/csrf-token endpoint not found in index.js');
  assert.notStrictEqual(calendarLine, -1, 'calendar router mount not found in index.js');
  assert.ok(
    csrfLine < calendarLine,
    `/api/csrf-token (line ${csrfLine + 1}) must be registered BEFORE calendar router (line ${calendarLine + 1})`
  );
});

test('GET /api/csrf-token is registered before documents router', () => {
  const csrfLine      = lineOf(/app\.get\s*\(\s*['"]\/api\/csrf-token['"]/);
  const documentsLine = lineOf(/app\.use\s*\(\s*["']\/api["'],\s*.*require.*routes\/documents/);

  assert.notStrictEqual(csrfLine, -1, '/api/csrf-token endpoint not found in index.js');
  assert.notStrictEqual(documentsLine, -1, 'documents router mount not found in index.js');
  assert.ok(
    csrfLine < documentsLine,
    `/api/csrf-token (line ${csrfLine + 1}) must be registered BEFORE documents router (line ${documentsLine + 1})`
  );
});

test('GET /api/csrf-token handler calls req.csrfToken()', () => {
  // The endpoint must call req.csrfToken() — the value populated by the
  // csrfProtection middleware — and return it to the client.
  assert.match(
    source,
    /req\.csrfToken\(\)/,
    'csrf-token endpoint must call req.csrfToken() to generate and return the token'
  );
});

// ── CSRF middleware order ─────────────────────────────────────────────────────

test('csrfProtection middleware is applied without a path prefix', () => {
  // Must be app.use(csrfProtection) — NOT app.use('/api', csrfProtection)
  // so that req.path inside the middleware is always the full request path.
  assert.match(
    source,
    /app\.use\s*\(\s*csrfProtection\s*\)/,
    'csrfProtection must be mounted with app.use(csrfProtection) — no path prefix'
  );
});

test('csrfErrorHandler is applied after csrfProtection', () => {
  const csrfLine      = lineOf(/app\.use\s*\(\s*csrfProtection\s*\)/);
  const errLine       = lineOf(/app\.use\s*\(\s*csrfErrorHandler\s*\)/);

  assert.notStrictEqual(csrfLine, -1, 'csrfProtection mount not found');
  assert.notStrictEqual(errLine,  -1, 'csrfErrorHandler mount not found');
  assert.ok(
    csrfLine < errLine,
    `csrfProtection (line ${csrfLine + 1}) must come before csrfErrorHandler (line ${errLine + 1})`
  );
});

// ── Mock payment guard ────────────────────────────────────────────────────────

test('mobile ServiceRequestScreen does not use mock Apple Pay tokens in production', () => {
  const mobileScreen = path.join(
    __dirname, '..', '..', 'mobile', 'screens', 'ServiceRequestScreen.js'
  );
  const mobileSource = fs.readFileSync(mobileScreen, 'utf8');

  // The mock token must only be generated inside a __DEV__ guard.
  // Use a regex to confirm __DEV__ appears in a conditional context (if statement),
  // not merely in a comment.
  assert.match(
    mobileSource,
    /if\s*\(\s*!?\s*__DEV__\s*\)/,
    'Mobile ServiceRequestScreen must gate mock Apple Pay behind an if(__DEV__) check'
  );

  // Confirm applepay_mock_ is used somewhere in the file (the guard wraps it)
  assert.match(
    mobileSource,
    /'applepay_mock_'/,
    'applepay_mock_ token reference not found in ServiceRequestScreen'
  );

  // The __DEV__ guard must appear before the mock token assignment
  const devGuardMatch  = /if\s*\(\s*!?\s*__DEV__\s*\)/.exec(mobileSource);
  const mockTokenMatch = /'applepay_mock_'/.exec(mobileSource);

  assert.ok(devGuardMatch,  '__DEV__ guard not found in ServiceRequestScreen');
  assert.ok(mockTokenMatch, 'applepay_mock_ token not found in ServiceRequestScreen');
  assert.ok(
    devGuardMatch.index < mockTokenMatch.index,
    `__DEV__ guard (pos ${devGuardMatch.index}) must appear before applepay_mock_ usage (pos ${mockTokenMatch.index})`
  );
});

// ── serviceRequest route field normalization ──────────────────────────────────

test('serviceRequest route normalizes fullName to name', () => {
  const srSource = fs.readFileSync(
    path.join(__dirname, 'serviceRequest.js'), 'utf8'
  );
  assert.match(
    srSource,
    /req\.body\.name\s*\|\|\s*req\.body\.fullName|fullName.*name/,
    'serviceRequest route must accept both name and fullName fields'
  );
});

test('serviceRequest route normalizes details to description', () => {
  const srSource = fs.readFileSync(
    path.join(__dirname, 'serviceRequest.js'), 'utf8'
  );
  assert.match(
    srSource,
    /req\.body\.description\s*\|\|\s*req\.body\.details|details.*description/,
    'serviceRequest route must accept both description and details fields'
  );
});

test('serviceRequest route exports only the router', () => {
  const srSource = fs.readFileSync(
    path.join(__dirname, 'serviceRequest.js'), 'utf8'
  );
  // Exactly one module.exports assignment
  const exportCount = (srSource.match(/module\.exports\s*=/g) || []).length;
  assert.strictEqual(
    exportCount, 1,
    'serviceRequest.js must have exactly one module.exports assignment (the router)'
  );
  assert.match(
    srSource,
    /module\.exports\s*=\s*router/,
    'serviceRequest.js must export the router'
  );
});
