function ensureConversationState(lead) {
  if (!lead.followUpConversation) lead.followUpConversation = {};
  if (!lead.followUpConversation.conversationId) {
    lead.followUpConversation.conversationId = `ml-${lead._id}`;
  }
  if (!lead.followUpConversation.status) {
    lead.followUpConversation.status = 'follow_up_active';
  }
  return lead.followUpConversation;
}

function transitionState(lead, nextState, metadata = {}) {
  const state = ensureConversationState(lead);
  state.status = nextState;

  if (metadata.channel) state.lastChannel = metadata.channel;
  if (metadata.intent) state.lastIntent = metadata.intent;
  if (typeof metadata.confidence === 'number') state.lastConfidence = metadata.confidence;
  if (metadata.inbound) state.lastInboundAt = new Date();
  if (metadata.outbound) state.lastOutboundAt = new Date();
  if (metadata.pausedReason) state.pausedReason = metadata.pausedReason;
  if (metadata.escalationReason) state.escalationReason = metadata.escalationReason;
}

function pauseSequence(lead, reason) {
  const state = ensureConversationState(lead);
  state.sequencePaused = true;
  state.pausedAt = new Date();
  state.pausedReason = reason;
}

function resumeSequence(lead, reason = 'resumed_by_admin') {
  const state = ensureConversationState(lead);
  state.sequencePaused = false;
  state.pausedReason = reason;
}

function activateHumanTakeover(lead, by = 'admin', reason = 'manual_takeover') {
  const state = ensureConversationState(lead);
  state.humanTakeover = true;
  state.humanTakeoverAt = new Date();
  state.humanTakeoverBy = by;
  state.escalationReason = reason;
  state.status = 'human_takeover';
  state.sequencePaused = true;
}

function clearHumanTakeover(lead) {
  const state = ensureConversationState(lead);
  state.humanTakeover = false;
  state.humanTakeoverBy = '';
}

module.exports = {
  ensureConversationState,
  transitionState,
  pauseSequence,
  resumeSequence,
  activateHumanTakeover,
  clearHumanTakeover
};
