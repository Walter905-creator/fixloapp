/**
 * Charlotte $75 Service Request Fee – backend validation tests
 *
 * Run with:  node --test server/routes/requests.charlotte.test.js
 *
 * These are static-analysis / contract tests that inspect route source code
 * and the PendingCheckout model without requiring a live database or Stripe
 * connection.  Integration tests that hit the live API can be found in
 * test-stripe-checkout.js and test-requests.js.
 */

'use strict';

const test    = require('node:test');
const assert  = require('node:assert/strict');
const fs      = require('node:fs');
const path    = require('node:path');

const REQUESTS_ROUTE = path.join(__dirname, 'requests.js');
const SERVICE_INTAKE_ROUTE = path.join(__dirname, 'serviceIntake.js');
const PENDING_CHECKOUT_MODEL = path.join(__dirname, '..', 'models', 'PendingCheckout.js');
const FRONTEND_MODAL = path.join(__dirname, '..', '..', 'client', 'src', 'components', 'ServiceIntakeModal.jsx');
const FRONTEND_REQUEST_PAGE = path.join(__dirname, '..', '..', 'client', 'src', 'routes', 'RequestPage.jsx');

const routeSource        = fs.readFileSync(REQUESTS_ROUTE, 'utf8');
const intakeSource       = fs.readFileSync(SERVICE_INTAKE_ROUTE, 'utf8');
const modelSource        = fs.readFileSync(PENDING_CHECKOUT_MODEL, 'utf8');
const modalSource        = fs.readFileSync(FRONTEND_MODAL, 'utf8');
const requestPageSource  = fs.readFileSync(FRONTEND_REQUEST_PAGE, 'utf8');

// ─── Backend: POST /api/requests ──────────────────────────────────────────────

test('POST /api/requests — rejects Charlotte request without stripeCheckoutSessionId (402)', () => {
  // The route must return 402 Payment Required when Charlotte is detected
  // and no stripeCheckoutSessionId is supplied.
  assert.match(
    routeSource,
    /res\.status\(402\)/,
    'Route must return HTTP 402 for Charlotte requests without payment'
  );
  assert.match(
    routeSource,
    /requiresPayment.*true/s,
    'Route must include requiresPayment: true in the 402 response'
  );
  assert.match(
    routeSource,
    /stripeCheckoutSessionId/,
    'Route must reference stripeCheckoutSessionId in its payment gate logic'
  );
});

test('POST /api/requests — verifies Stripe session via API (not URL params)', () => {
  // Must call stripe.checkout.sessions.retrieve to verify payment server-side
  assert.match(
    routeSource,
    /stripe\.checkout\.sessions\.retrieve/,
    'Route must verify the Stripe session via the Stripe API'
  );
  assert.match(
    routeSource,
    /payment_status.*===.*'paid'|isValidCharlotteCheckoutSession/,
    'Route must check payment_status === paid on the retrieved session'
  );
});

test('POST /api/requests — rejects reused/already-consumed checkout sessions (409)', () => {
  // Must check the consumed flag on PendingCheckout and existing JobRequest
  assert.match(
    routeSource,
    /\.consumed/,
    'Route must check the consumed flag on PendingCheckout to prevent reuse'
  );
  assert.match(
    routeSource,
    /res\.status\(409\)/,
    'Route must return HTTP 409 Conflict for a reused session'
  );
});

test('POST /api/requests — marks PendingCheckout as consumed after creating JobRequest', () => {
  assert.match(
    routeSource,
    /consumed.*true/s,
    'Route must mark the PendingCheckout as consumed after the JobRequest is saved'
  );
  assert.match(
    routeSource,
    /PendingCheckout\.updateOne/,
    'Route must call PendingCheckout.updateOne to set consumed=true'
  );
});

test('POST /api/requests — records paymentStatus: captured on Charlotte JobRequest', () => {
  // The value may be a string literal or a named constant (PAYMENT_STATUS_CAPTURED = 'captured')
  assert.match(
    routeSource,
    /PAYMENT_STATUS_CAPTURED\s*=\s*'captured'|paymentStatus.*'captured'|paymentStatus.*PAYMENT_STATUS_CAPTURED/,
    'JobRequest must be saved with paymentStatus: captured for Charlotte paid requests'
  );
  assert.match(
    routeSource,
    /paymentCapturedAt/,
    'JobRequest must record paymentCapturedAt timestamp'
  );
});

// ─── Backend: POST /api/requests/create-checkout ─────────────────────────────

test('POST /api/requests/create-checkout — creates Stripe session WITHOUT a DB JobRequest', () => {
  // The create-checkout route should only create a PendingCheckout, not a JobRequest
  assert.match(
    routeSource,
    /\/create-checkout/,
    'Route must expose a /create-checkout endpoint'
  );
  assert.match(
    routeSource,
    /PendingCheckout\.create/,
    'create-checkout must save form data to PendingCheckout'
  );
  // Must NOT call JobRequest.create inside create-checkout
  const createCheckoutBlock = routeSource.slice(
    routeSource.indexOf("'/create-checkout'") !== -1
      ? routeSource.indexOf("'/create-checkout'")
      : routeSource.indexOf('"/create-checkout"'),
    routeSource.indexOf("router.get('/verify-checkout")
  );
  assert.doesNotMatch(
    createCheckoutBlock,
    /JobRequest\.create/,
    'create-checkout must NOT create a JobRequest record'
  );
});

test('POST /api/requests/create-checkout — rejects non-Charlotte addresses', () => {
  assert.match(
    routeSource,
    /not in the Charlotte service area|not required for this location/,
    'create-checkout must reject addresses outside Charlotte'
  );
});

// ─── Backend: GET /api/requests/verify-checkout/:sessionId ───────────────────

test('GET /api/requests/verify-checkout/:sessionId — returns paid status from Stripe API', () => {
  assert.match(
    routeSource,
    /\/verify-checkout\/:sessionId/,
    'Route must expose a /verify-checkout/:sessionId endpoint'
  );
  // The route must both check payment_status === 'paid' AND set a paid variable
  assert.match(
    routeSource,
    /payment_status === 'paid'|isValidCharlotteCheckoutSession/,
    'verify-checkout must check session.payment_status === paid'
  );
  assert.match(
    routeSource,
    /\bpaid\b.*paymentStatus|paymentStatus.*\bpaid\b/s,
    'verify-checkout must return both paid and paymentStatus in the response'
  );
});

// ─── Backend: POST /api/service-intake/submit — Charlotte gate ───────────────

test('POST /api/service-intake/submit — rejects Charlotte requests without payment (402)', () => {
  assert.match(
    intakeSource,
    /Charlotte.*payment gate/i,
    'serviceIntake submit must include a Charlotte payment gate comment'
  );
  assert.match(
    intakeSource,
    /requiresPayment.*true/s,
    'serviceIntake submit must return requiresPayment: true for Charlotte requests'
  );
  assert.match(
    intakeSource,
    /res\.status\(402\)/,
    'serviceIntake submit must return HTTP 402 for Charlotte requests'
  );
  assert.match(
    intakeSource,
    /evaluateCharlotteEstimateFeeEligibility/,
    'serviceIntake submit must call evaluateCharlotteEstimateFeeEligibility'
  );
});

// ─── Backend: PendingCheckout model ──────────────────────────────────────────

test('PendingCheckout model — has a TTL index for automatic expiry', () => {
  assert.match(
    modelSource,
    /expires.*7200|expires.*3600/,
    'PendingCheckout must have a TTL (expires) set on the createdAt field'
  );
});

test('PendingCheckout model — stores full form data', () => {
  assert.match(modelSource, /serviceType/,  'PendingCheckout formData must include serviceType');
  assert.match(modelSource, /fullName/,     'PendingCheckout formData must include fullName');
  assert.match(modelSource, /phone/,        'PendingCheckout formData must include phone');
  assert.match(modelSource, /address/,      'PendingCheckout formData must include address');
  assert.match(modelSource, /smsConsent/,   'PendingCheckout formData must include smsConsent');
});

test('PendingCheckout model — has consumed flag to prevent session reuse', () => {
  assert.match(
    modelSource,
    /consumed/,
    'PendingCheckout must have a consumed boolean field'
  );
});

// ─── Frontend: ServiceIntakeModal ────────────────────────────────────────────

test('ServiceIntakeModal — shows exact $75 fee explanation for Charlotte requests', () => {
  assert.match(
    modalSource,
    /\$75 Service Request Fee/,
    'Modal must show "$75 Service Request Fee" heading'
  );
  assert.match(
    modalSource,
    /Professional project estimate from a verified local professional/,
    'Modal must show the exact fee explanation text'
  );
  assert.match(
    modalSource,
    /Service Request Fee: \$75\.00/,
    'Modal must show "Service Request Fee: $75.00"'
  );
  assert.match(
    modalSource,
    /I understand that a \$75 Service Request Fee is required before my request can be submitted\./,
    'Modal must show the payment-required agreement checkbox'
  );
});

test('ServiceIntakeModal — calls /api/requests/create-checkout for Charlotte payment', () => {
  assert.match(
    modalSource,
    /\/api\/requests\/create-checkout/,
    'Modal must call /api/requests/create-checkout to initiate Stripe checkout'
  );
});

test('ServiceIntakeModal — saves form data to sessionStorage before Stripe redirect', () => {
  assert.match(
    modalSource,
    /sessionStorage\.setItem/,
    'Modal must save form data to sessionStorage before redirecting to Stripe'
  );
  assert.match(
    modalSource,
    /SERVICE_REQUEST_DRAFT_KEY/,
    'Modal must use a named constant for the sessionStorage key'
  );
});

test('ServiceIntakeModal — includes stripeCheckoutSessionId in final POST /api/requests', () => {
  assert.match(
    modalSource,
    /stripeCheckoutSessionId.*paidSessionId|paidSessionId.*stripeCheckoutSessionId/s,
    'Modal must include stripeCheckoutSessionId (from paidSessionId) in the final request payload'
  );
});

test('ServiceIntakeModal — accepts restoredFormData and restoredPaidSessionId props', () => {
  assert.match(
    modalSource,
    /restoredFormData/,
    'Modal must accept a restoredFormData prop for post-payment flow'
  );
  assert.match(
    modalSource,
    /restoredPaidSessionId/,
    'Modal must accept a restoredPaidSessionId prop'
  );
  assert.match(
    modalSource,
    /paymentReturnStatus/,
    'Modal must accept a paymentReturnStatus prop for success/cancel step behavior'
  );
});

// ─── Frontend: RequestPage ────────────────────────────────────────────────────

test('RequestPage — verifies Stripe session via backend on payment=success', () => {
  assert.match(
    requestPageSource,
    /verify-checkout/,
    'RequestPage must call verify-checkout on the backend when payment=success'
  );
  assert.match(
    requestPageSource,
    /session_id/,
    'RequestPage must read session_id from the URL on payment=success'
  );
});

test('RequestPage — restores form data from sessionStorage after payment', () => {
  assert.match(
    requestPageSource,
    /sessionStorage\.getItem/,
    'RequestPage must restore form data from sessionStorage after Stripe redirect'
  );
  assert.match(
    requestPageSource,
    /FORM_SESSION_KEY/,
    'RequestPage must use FORM_SESSION_KEY constant'
  );
});

test('RequestPage — passes restoredFormData and paidSessionId to ServiceIntakeModal', () => {
  assert.match(
    requestPageSource,
    /restoredFormData/,
    'RequestPage must pass restoredFormData to ServiceIntakeModal'
  );
  assert.match(
    requestPageSource,
    /restoredPaidSessionId/,
    'RequestPage must pass restoredPaidSessionId to ServiceIntakeModal'
  );
  assert.match(
    requestPageSource,
    /paymentReturnStatus/,
    'RequestPage must pass paymentReturnStatus to ServiceIntakeModal'
  );
});

test('POST /api/requests — successful $75 paid session is accepted', () => {
  assert.match(
    routeSource,
    /CHARLOTTE_ESTIMATE_FEE_AMOUNT_CENTS/,
    'Route must validate the $75 amount configuration when verifying Stripe session'
  );
  assert.match(
    routeSource,
    /paymentStatus:\s*requiresEstimateFee \? 'captured' : 'none'/,
    'Route must mark paid Charlotte requests as captured'
  );
});

test('GET \/api\/requests\/verify-checkout — cancelled or failed payment is rejected', () => {
  assert.match(
    routeSource,
    /res\.status\(402\)[\s\S]*Payment has not been completed for this session\./,
    'verify-checkout must reject unpaid/cancelled sessions'
  );
});

test('RequestPage — cancelled payment returns user to payment step without submission', () => {
  assert.match(
    requestPageSource,
    /paymentParam === 'cancelled'/,
    'RequestPage must detect cancelled Stripe returns'
  );
  assert.match(
    requestPageSource,
    /setPaymentStatus\('cancelled'\)/,
    'RequestPage must keep user in cancelled state so modal returns to Step 6'
  );
});

// ─── Frontend: Entry points all route to /request ────────────────────────────

test('HeroSection — "Find a Pro" button navigates to /request (not /for-homeowners)', () => {
  const heroSource = fs.readFileSync(
    path.join(__dirname, '..', '..', 'client', 'src', 'components', 'HeroSection.jsx'),
    'utf8'
  );
  assert.match(
    heroSource,
    /navigate\("\/request"\)|navigate\('\/request'\)/,
    'HeroSection "Find a Pro" must navigate to /request'
  );
  assert.doesNotMatch(
    heroSource,
    /navigate\("\/for-homeowners"\)|navigate\('\/for-homeowners'\)/,
    'HeroSection "Find a Pro" must NOT navigate to /for-homeowners'
  );
});

test('AIHomeExpertHero — "Find a Pro" navigates to /request', () => {
  const heroSource = fs.readFileSync(
    path.join(__dirname, '..', '..', 'client', 'src', 'components', 'AIHomeExpertHero.jsx'),
    'utf8'
  );
  assert.match(
    heroSource,
    /navigate\('\/request'\)|navigate\("\/request"\)/,
    'AIHomeExpertHero "Find a Pro" must navigate to /request'
  );
});

test('HowItWorksPage — "Find a Pro" and "Find a Professional" link to /request', () => {
  const howSource = fs.readFileSync(
    path.join(__dirname, '..', '..', 'client', 'src', 'routes', 'HowItWorksPage.jsx'),
    'utf8'
  );
  const requestLinks = (howSource.match(/to="\/request"/g) || []).length;
  assert.ok(
    requestLinks >= 2,
    `HowItWorksPage must have at least 2 links to /request, found ${requestLinks}`
  );
  assert.doesNotMatch(
    howSource,
    /to="\/services"[\s\S]{0,30}Find a Pro|Find a Pro[\s\S]{0,30}to="\/services"/,
    'HowItWorksPage "Find a Pro" link must NOT go to /services'
  );
});

test('CountryPage — "Find a Pro" links to /request', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', '..', 'client', 'src', 'routes', 'CountryPage.jsx'),
    'utf8'
  );
  // The href="/request" and "Find a Pro" text appear in the same <a> element
  assert.match(src, /href="\/request"/, 'CountryPage Find a Pro must use href="/request"');
  assert.match(src, /Find a Pro/, 'CountryPage must have Find a Pro link text');
  assert.doesNotMatch(src, /href="\/services"[\s\S]{0,200}Find a Pro/, 'CountryPage Find a Pro must NOT link to /services');
});

test('AboutPage — "Find a Professional" links to /request', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', '..', 'client', 'src', 'routes', 'AboutPage.jsx'),
    'utf8'
  );
  assert.match(src, /to="\/request"[\s\S]{0,60}Find a Professional|Find a Professional[\s\S]{0,60}to="\/request"/, 'AboutPage Find a Professional must link to /request');
});

test('HomeownerDashboard — "Find a Pro" navigates to /request', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', '..', 'client', 'src', 'routes', 'HomeownerDashboard.jsx'),
    'utf8'
  );
  // The button has onClick with navigate('/request') and text "Find a Pro"
  // Allow up to 200 chars between the navigate call and the label text
  assert.match(
    src,
    /navigate\('\/request'\)[\s\S]{0,200}Find a Pro/,
    'HomeownerDashboard "Find a Pro" must navigate to /request'
  );
});

test('App.jsx footer — "Find a Pro" links to /request (not /for-homeowners)', () => {
  const appSource = fs.readFileSync(
    path.join(__dirname, '..', '..', 'client', 'src', 'App.jsx'),
    'utf8'
  );
  // Find the footer section and verify the Find a Pro link
  assert.doesNotMatch(
    appSource,
    /href="\/for-homeowners"[\s\S]{0,60}Find a Pro/,
    'App.jsx footer Find a Pro must NOT link to /for-homeowners'
  );
  assert.match(
    appSource,
    /href="\/request"[\s\S]{0,60}Find a Pro/,
    'App.jsx footer Find a Pro must link to /request'
  );
});
