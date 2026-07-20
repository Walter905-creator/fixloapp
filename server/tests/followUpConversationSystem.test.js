const test = require('node:test');
const assert = require('node:assert/strict');

const { classifyIntent, requiresEscalation } = require('../services/replyIntentService');
const { evaluateFollowUpEligibility } = require('../services/followUpEligibilityService');
const {
  createIdempotencyKey,
  hasIdempotencyKey,
  appendConversationMessage,
  generateIntentResponse
} = require('../services/followUpConversationService');
const {
  ensureConversationState,
  activateHumanTakeover,
  clearHumanTakeover,
  resumeSequence
} = require('../services/conversationStateService');

test('classifies pricing intent with confidence', () => {
  const result = classifyIntent('How much is it per month?');
  assert.equal(result.intent, 'pricing');
  assert.ok(result.confidence >= 0.5);
});

test('flags refund and low confidence for escalation', () => {
  assert.equal(requiresEscalation('refund', 0.9), true);
  assert.equal(requiresEscalation('learn_more', 0.2), true);
  assert.equal(requiresEscalation('pricing', 0.8), false);
});

test('stops follow-up when lead replied or human takeover is active', () => {
  const baseLead = {
    registrationStatus: 'not_registered',
    smsOptOut: false,
    emailStatus: 'pending',
    leadStatus: 'in_progress',
    followUp: { status: 'active' },
    followUpConversation: { status: 'replied', sequencePaused: true, humanTakeover: false },
    conversationMessages: []
  };
  assert.equal(evaluateFollowUpEligibility(baseLead).eligible, false);

  const takeoverLead = {
    ...baseLead,
    followUpConversation: { status: 'waiting_for_pro', sequencePaused: false, humanTakeover: true }
  };
  assert.equal(evaluateFollowUpEligibility(takeoverLead).eligible, false);
});

test('idempotency key prevents duplicate outbound logging', () => {
  const lead = { conversationMessages: [] };
  const key = createIdempotencyKey('lead-1', 'sms', 'reminder', 'step-1');
  appendConversationMessage(lead, {
    channel: 'sms',
    direction: 'outbound',
    bodyOriginal: 'Message',
    idempotencyKey: key
  });
  assert.equal(hasIdempotencyKey(lead, key), true);
});

test('conversation state human takeover can be toggled', () => {
  const lead = { followUpConversation: {} };
  ensureConversationState(lead);
  activateHumanTakeover(lead, 'admin', 'manual_takeover');
  assert.equal(lead.followUpConversation.humanTakeover, true);
  clearHumanTakeover(lead);
  resumeSequence(lead, 'released');
  assert.equal(lead.followUpConversation.humanTakeover, false);
  assert.equal(lead.followUpConversation.sequencePaused, false);
});

test('promotion safety response avoids fake promotion text', () => {
  const text = generateIntentResponse('pricing', {
    membershipPrice: '$59.99',
    promotionText: '',
    signupLink: 'https://example.com/signup'
  });
  assert.ok(text.includes('$59.99'));
  assert.ok(!text.toLowerCase().includes('expires'));
});
