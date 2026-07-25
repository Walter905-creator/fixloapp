const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const appPath = path.join(repoRoot, 'client', 'src', 'App.jsx');
const proSignInPath = path.join(repoRoot, 'client', 'src', 'routes', 'ProSignInPage.jsx');
const proAuthPath = path.join(repoRoot, 'server', 'routes', 'proAuth.js');

const appSource = fs.readFileSync(appPath, 'utf8');
const proSignInSource = fs.readFileSync(proSignInPath, 'utf8');
const proAuthSource = fs.readFileSync(proAuthPath, 'utf8');

function assertRouteElement(routePath, expectedElement) {
  const snippet = `<Route path="${routePath}" element={${expectedElement}}/>`;
  assert.ok(appSource.includes(snippet), `Missing route mapping: ${snippet}`);
}

test('canonical pro login route renders ProSignInPage with identifier label', () => {
  assertRouteElement('/pros/login', '<ProSignInPage/>');
  assert.match(proSignInSource, /Email or phone number/);
  assert.match(proSignInSource, /name="identifier"/);
  assert.match(proSignInSource, /type="text"/);
  assert.match(proSignInSource, /placeholder="name@example\.com or \(555\) 123-4567"/);
  assert.match(proSignInSource, /name="password"/);
});

test('legacy pro login URLs redirect to canonical route', () => {
  const legacyRoutes = [
    '/login/pro',
    '/pro/login',
    '/pro/sign-in',
    '/pro-signin',
    '/signin',
    '/auth/login/pro',
    '/pros/signin'
  ];

  for (const legacyRoute of legacyRoutes) {
    assertRouteElement(legacyRoute, '<Navigate to="/pros/login" replace/>');
  }
});

test('canonical pro sign in posts only identifier payload to /api/pro-auth/login', () => {
  assert.match(proSignInSource, /identifier:\s*String\(form\.get\('identifier'\)\s*\|\|\s*''\)\.trim\(\)/);
  assert.match(proSignInSource, /password:\s*form\.get\('password'\)/);
  assert.match(proSignInSource, /`?\$\{api\}\/api\/pro-auth\/login`?/);

  assert.equal((proSignInSource.match(/\/api\/pro-auth\/login/g) || []).length, 1);
  assert.equal((proSignInSource.match(/\/api\/auth\/login\/pro/g) || []).length, 0);
  assert.equal((proSignInSource.match(/\/api\/auth\/login(?!\/pro)/g) || []).length, 0);
});

test('frontend source has no legacy /api/auth/login/pro references', () => {
  const srcRoot = path.join(repoRoot, 'client', 'src');
  const stack = [srcRoot];
  const files = [];

  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    assert.equal(source.includes('/api/auth/login/pro'), false, `Legacy endpoint reference found in ${file}`);
  }
});

test('backend keeps identifier/email/phone compatibility and email-vs-phone lookup split', () => {
  assert.match(proAuthSource, /body\.identifier\s*\?\?\s*body\.email\s*\?\?\s*body\.phone/);
  assert.match(proAuthSource, /const identifier = String\(identifierRaw \|\| ''\)\.trim\(\)/);
  assert.match(proAuthSource, /if \(identifier\.includes\('@'\)\)/);
  assert.match(proAuthSource, /const email = normalizeEmail\(identifier\)/);
  assert.match(proAuthSource, /pro = await findProByPhoneIdentifier\(identifier\)/);
});
