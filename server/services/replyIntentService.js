const ESCALATION_INTENTS = new Set([
  'refund',
  'billing',
  'technical_problem',
  'human_help',
  'unclear'
]);

function normalizeText(input = '') {
  const source = String(input || '');
  let inTag = false;
  let out = '';
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '<') {
      inTag = true;
      out += ' ';
      continue;
    }
    if (char === '>') {
      inTag = false;
      out += ' ';
      continue;
    }
    if (!inTag) out += char;
  }
  return out.replace(/\s+/g, ' ').trim();
}

function scoreMatch(text, phrases = []) {
  return phrases.reduce((score, phrase) => (text.includes(phrase) ? score + 1 : score), 0);
}

const intentRules = [
  ['unsubscribe', ['unsubscribe', 'opt out', 'stop', 'remove me', 'do not text', 'do not email']],
  ['not_interested', ['not interested', 'no thanks', 'not now', 'not for me', 'pass']],
  ['human_help', ['human', 'person', 'agent', 'representative', 'call me']],
  ['refund', ['refund', 'money back', 'chargeback', 'dispute charge']],
  ['billing', ['billing', 'charged', 'payment issue', 'invoice', 'card declined']],
  ['pricing', ['price', 'pricing', 'cost', 'how much', 'monthly']],
  ['promotion', ['promotion', 'discount', 'offer', 'deal', 'coupon', 'early access']],
  ['how_leads_work', ['how leads work', 'how does it work', 'lead process', 'opportunity']],
  ['signup_help', ['signup', 'sign up', 'register', 'create profile', 'get started']],
  ['service_area', ['service area', 'where available', 'which states', 'coverage']],
  ['supported_trade', ['i am a', "i'm a", 'my trade', 'do you support', 'painter', 'plumber', 'electrician', 'hvac', 'roofer']],
  ['background_check', ['background check', 'checkr', 'screening']],
  ['verification', ['verification', 'verified', 'verify account']],
  ['technical_problem', ['not working', 'error', 'bug', 'issue logging in', 'can’t log in', 'cannot log in']],
  ['cancellation', ['cancel membership', 'cancel subscription', 'close account']],
  ['interested', ['interested', 'yes', 'sounds good']],
  ['learn_more', ['learn more', 'more info', 'tell me more', 'details']]
];

function classifyIntent(rawText = '') {
  const normalized = normalizeText(rawText).toLowerCase();
  if (!normalized) {
    return { intent: 'unclear', confidence: 0.1, normalizedText: '' };
  }

  let best = { intent: 'unclear', confidence: 0.25 };
  for (const [intent, phrases] of intentRules) {
    const score = scoreMatch(normalized, phrases);
    if (score > 0) {
      // Confidence baseline 0.5 for first match, +0.15 per additional phrase hit.
      // Cap at 0.98 to avoid claiming absolute certainty from keyword matching.
      const confidence = Math.min(0.98, 0.5 + (score * 0.15));
      if (confidence > best.confidence) best = { intent, confidence };
    }
  }

  return {
    intent: best.intent,
    confidence: Number(best.confidence.toFixed(2)),
    normalizedText: normalized
  };
}

function requiresEscalation(intent, confidence) {
  if (ESCALATION_INTENTS.has(intent)) return true;
  return confidence < 0.45;
}

module.exports = {
  normalizeText,
  classifyIntent,
  requiresEscalation
};
