'use strict';

/**
 * FGA Notification Center
 *
 * Subscribes to FGA events and automatically notifies:
 *   - Owner (via email + SMS)
 *   - Recruiters
 *   - Professionals
 *   - Homeowners
 *
 * Reuses existing ownerNotificationService and the FGA Communication Center.
 * Never calls both services directly from callers — all routing is here.
 */

const eventBus    = require('../events/eventBus');
const FGA_EVENTS  = require('../events/eventTypes');
const comm        = require('../communication/communicationCenter');
const { notify: ownerNotify } = require('../../../services/ownerNotificationService');

// ── Owner notification wrappers ───────────────────────────────────────────────

async function _notifyOwnerEmail(eventType, payload) {
  try {
    await ownerNotify(eventType, payload);
  } catch (err) {
    console.error(`[FGA:NotifCenter] ❌ Owner email failed for "${eventType}": ${err.message}`);
  }
}

async function _notifyOwnerSms(body) {
  const ownerPhone = process.env.OWNER_PHONE;
  if (!ownerPhone) return;
  await comm.sendSms({
    to:            ownerPhone,
    body,
    recipientType: 'owner',
    triggerEvent:  'owner_sms',
  });
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function _onLeadCreated({ payload }) {
  const { leadType, source, name, email, phone } = payload;
  console.log(`[FGA:NotifCenter] 📩 LeadCreated — type: ${leadType}`);

  // Map FGA leadType to existing ownerNotificationService event types
  if (leadType === 'homeowner') {
    await _notifyOwnerEmail('homeowner_signup', {
      name, email, phone,
      signupDate: new Date().toISOString(),
      userId: payload.leadId,
    });
  } else if (leadType === 'professional') {
    await _notifyOwnerEmail('pro_registered', {
      name, email, phone,
      trade: payload.trade || '',
      city:  payload.city  || '',
      state: payload.state || '',
      signupDate: new Date().toISOString(),
    });
  } else if (leadType === 'recruiter') {
    await _notifyOwnerEmail('recruiter_registered', {
      name, email, phone,
      signupDate: new Date().toISOString(),
    });
  }
}

async function _onSubscriptionPurchased({ payload }) {
  console.log(`[FGA:NotifCenter] 💳 SubscriptionPurchased`);
  await _notifyOwnerEmail('pro_subscription', {
    proName:          payload.proName || '',
    plan:             payload.plan    || '',
    amount:           payload.amount  || 0,
    stripeCustomerId: payload.stripeCustomerId || '',
    subscriptionEvent: 'created',
  });
}

async function _onPaymentFailed({ payload }) {
  console.log(`[FGA:NotifCenter] ⚠️ PaymentFailed`);
  await _notifyOwnerEmail('pro_subscription', {
    proName:          payload.proName || '',
    plan:             payload.plan    || '',
    amount:           payload.amount  || 0,
    stripeCustomerId: payload.stripeCustomerId || '',
    subscriptionEvent: 'payment_failed',
  });
  await _notifyOwnerSms(`⚠️ Fixlo: Payment failed for ${payload.proName || 'a pro'}. Check Stripe dashboard.`);
}

async function _onBackgroundCheckCompleted({ payload }) {
  console.log(`[FGA:NotifCenter] 🔍 BackgroundCheckCompleted`);
  await _notifyOwnerEmail('background_check', {
    proName:     payload.proName     || '',
    proEmail:    payload.proEmail    || '',
    checkStatus: payload.checkStatus || 'completed',
    candidateId: payload.candidateId || '',
    reportId:    payload.reportId    || '',
    timestamp:   new Date().toISOString(),
  });
}

async function _onAutomationFailed({ payload }) {
  console.log(`[FGA:NotifCenter] 🚨 AutomationFailed`);
  await _notifyOwnerEmail('system_error', {
    errorType:    'AutomationFailed',
    errorMessage: payload.errorMessage || 'Unknown automation failure',
    stackTrace:   payload.stack        || '',
    timestamp:    new Date().toISOString(),
  });
}

async function _onSystemError({ payload }) {
  console.log(`[FGA:NotifCenter] 🚨 SystemError`);
  await _notifyOwnerEmail('system_error', {
    errorType:    payload.errorType    || 'SystemError',
    errorMessage: payload.errorMessage || '',
    stackTrace:   payload.stack        || '',
    timestamp:    new Date().toISOString(),
  });
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

/**
 * Register all notification listeners on the FGA event bus.
 * Must be called once during server initialisation.
 */
function initialize() {
  eventBus.subscribe(FGA_EVENTS.LEAD_CREATED,               _onLeadCreated);
  eventBus.subscribe(FGA_EVENTS.SUBSCRIPTION_PURCHASED,     _onSubscriptionPurchased);
  eventBus.subscribe(FGA_EVENTS.PAYMENT_FAILED,             _onPaymentFailed);
  eventBus.subscribe(FGA_EVENTS.BACKGROUND_CHECK_COMPLETED, _onBackgroundCheckCompleted);
  eventBus.subscribe(FGA_EVENTS.AUTOMATION_FAILED,          _onAutomationFailed);
  eventBus.subscribe(FGA_EVENTS.SYSTEM_ERROR,               _onSystemError);

  console.log('[FGA:NotifCenter] ✅ Notification Center initialized');
}

module.exports = { initialize };
