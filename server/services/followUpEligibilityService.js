function getLastAutomatedFollowUp(lead) {
  const messages = Array.isArray(lead.conversationMessages) ? lead.conversationMessages : [];
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (
      message.direction === 'outbound' &&
      message.metadata?.automatedFollowUp === true &&
      message.createdAt
    ) {
      return message;
    }
  }
  return null;
}

function evaluateFollowUpEligibility(lead) {
  if (!lead) return { eligible: false, reason: 'missing_lead' };
  if (lead.registrationStatus !== 'not_registered') return { eligible: false, reason: 'already_registered' };
  if (lead.smsOptOut || lead.emailStatus === 'unsubscribed') return { eligible: false, reason: 'opted_out' };
  if (lead.leadStatus === 'closed') return { eligible: false, reason: 'closed' };
  if (lead.followUp?.status !== 'active') return { eligible: false, reason: 'followup_not_active' };

  const state = lead.followUpConversation || {};
  if (state.sequencePaused) return { eligible: false, reason: 'sequence_paused' };
  if (state.humanTakeover) return { eligible: false, reason: 'human_takeover' };
  if (['replied', 'human_review', 'human_takeover', 'not_interested', 'unsubscribed', 'closed'].includes(state.status)) {
    return { eligible: false, reason: `conversation_${state.status}` };
  }

  const recentSend = getLastAutomatedFollowUp(lead);
  if (recentSend) {
    const ageMs = Date.now() - new Date(recentSend.createdAt).getTime();
    if (ageMs < 15 * 60 * 1000) {
      return { eligible: false, reason: 'duplicate_recent_send' };
    }
  }

  return { eligible: true, reason: 'ok' };
}

module.exports = {
  evaluateFollowUpEligibility
};
