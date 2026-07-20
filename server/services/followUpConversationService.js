const crypto = require('crypto');
const EarlyAccessSpots = require('../models/EarlyAccessSpots');
const Pro = require('../models/Pro');

function safeText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function createIdempotencyKey(leadId, channel, kind, reference = '') {
  const raw = `${leadId}:${channel}:${kind}:${reference}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 48);
}

function hasIdempotencyKey(lead, key) {
  return (lead.conversationMessages || []).some((m) => m.idempotencyKey === key);
}

function appendConversationMessage(lead, payload = {}) {
  if (!Array.isArray(lead.conversationMessages)) lead.conversationMessages = [];
  lead.conversationMessages.push({
    channel: payload.channel,
    direction: payload.direction,
    sender: payload.sender || 'The Fixlo Team',
    bodyOriginal: safeText(payload.bodyOriginal),
    bodyNormalized: safeText(payload.bodyNormalized),
    subject: safeText(payload.subject),
    messageId: safeText(payload.messageId),
    providerMessageId: safeText(payload.providerMessageId),
    inReplyTo: safeText(payload.inReplyTo),
    references: Array.isArray(payload.references) ? payload.references.filter(Boolean) : [],
    intent: safeText(payload.intent),
    confidence: Number(payload.confidence || 0),
    escalationStatus: payload.escalationStatus || 'none',
    deliveryStatus: safeText(payload.deliveryStatus),
    idempotencyKey: safeText(payload.idempotencyKey),
    createdAt: payload.createdAt || new Date(),
    metadata: payload.metadata || {}
  });
}

async function getBusinessContext(settings) {
  const signupLink = settings?.signupLink || process.env.PRO_SIGNUP_URL || 'https://www.fixloapp.com/pros/signup';
  const proPrice = Number(Pro.schema.path('subscriptionPrice')?.defaultValue || 59.99);
  const trades = Pro.schema.path('trade')?.enumValues || [];

  let promotionText = '';
  try {
    const early = await EarlyAccessSpots.getInstance();
    if (early?.spotsRemaining > 0) {
      promotionText = `A limited early-access offer may be available while spots remain (${early.spotsRemaining} spots left).`;
    }
  } catch {
    promotionText = '';
  }

  return {
    signupLink,
    membershipPrice: `$${proPrice.toFixed(2)}`,
    promotionText,
    supportedTrades: trades,
    serviceCoverage: 'Fixlo currently serves homeowners and professionals across the United States.',
    backgroundCheck: 'Background screening requirements are handled during professional verification.',
    supportEmail: settings?.supportEmail || process.env.SENDGRID_REPLY_TO_EMAIL || 'support@fixloapp.com'
  };
}

function generateIntentResponse(intent, ctx, lead = null) {
  const name = lead?.firstName ? ` ${lead.firstName}` : '';
  const escalationFallback = 'A member of the Fixlo Team will review that and get back to you.';

  switch (intent) {
    case 'learn_more':
      return `Absolutely! Fixlo connects homeowners with trusted local professionals across the United States.\n\nProfessionals can create a profile, complete the required setup, and receive homeowner opportunities that match their trade and service area.\n\nWhat would you like to know more about: membership, pricing, leads, or getting started?`;
    case 'interested':
      return `Great to hear${name}! This is the Fixlo Team. You can get started here: ${ctx.signupLink}`;
    case 'pricing':
      return `The Fixlo membership is currently ${ctx.membershipPrice}.${ctx.promotionText ? `\n\n${ctx.promotionText}` : ''}\n\nYou can review the current plan and get started here:\n${ctx.signupLink}`;
    case 'promotion':
      return ctx.promotionText
        ? `${ctx.promotionText}\n\nYou can review details and get started here: ${ctx.signupLink}`
        : `Thanks for asking. We currently have no confirmed active promotion to share right now.\n\nCurrent signup details are here: ${ctx.signupLink}`;
    case 'how_leads_work':
      return `When a homeowner submits a request, Fixlo matches the opportunity with eligible professionals based on factors such as trade and service area.\n\nWhen a matching opportunity is available, you may receive a notification with the next steps.`;
    case 'signup_help':
      return `Thanks for getting back to Fixlo. You can start your professional signup here: ${ctx.signupLink}\n\nIf you run into any issue, reply and the Fixlo Team can help.`;
    case 'service_area':
      return `${ctx.serviceCoverage}\n\nYou can start here: ${ctx.signupLink}`;
    case 'supported_trade':
      return `Thanks for letting us know. Fixlo supports many professional trades, including ${ctx.supportedTrades.slice(0, 6).join(', ')} and more.\n\nYou can create your professional profile here:\n${ctx.signupLink}`;
    case 'background_check':
    case 'verification':
      return `${ctx.backgroundCheck}\n\nIf you want the exact policy for your account, ${escalationFallback}`;
    case 'not_interested':
      return `Thanks for letting us know. We’ll stop the promotional follow-ups.\n\nYou can contact Fixlo again anytime if your plans change.`;
    case 'unsubscribe':
      return `Thanks for your message. We’ve updated your preferences and stopped promotional follow-ups for this channel.`;
    case 'cancellation':
    case 'billing':
    case 'refund':
    case 'technical_problem':
    case 'human_help':
    case 'unclear':
    default:
      return escalationFallback;
  }
}

module.exports = {
  createIdempotencyKey,
  hasIdempotencyKey,
  appendConversationMessage,
  getBusinessContext,
  generateIntentResponse
};
