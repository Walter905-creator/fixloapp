'use strict';

// Money and time calculations are deterministic; no outbound messages or charges.
function minutesBetween(startedAt, endedAt) {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error('End time must be after start time');
  }
  return Math.ceil((end - start) / 60000);
}

function makeDraft({ startedAt, endedAt, hourlyRateCents, materials = [] }) {
  if (!Number.isSafeInteger(hourlyRateCents) || hourlyRateCents < 0) {
    throw new Error('Invalid hourly rate');
  }
  const minutes = minutesBetween(startedAt, endedAt);
  if (!Array.isArray(materials) || materials.some(m =>
    !m || typeof m.description !== 'string' || !m.description.trim() ||
    !Number.isSafeInteger(m.amountCents) || m.amountCents < 0)) {
    throw new Error('Invalid materials');
  }
  const laborCents = Math.round(minutes * hourlyRateCents / 60);
  const materialsCents = materials.reduce((sum, m) => sum + m.amountCents, 0);
  if (!Number.isSafeInteger(materialsCents) || !Number.isSafeInteger(laborCents + materialsCents)) {
    throw new Error('Invoice amount overflow');
  }
  return Object.freeze({
    minutes, hourlyRateCents, laborCents, materialsCents,
    totalCents: laborCents + materialsCents, status: 'draft'
  });
}

function canSendInvoice(session) {
  return !!session && session.status === 'draft' &&
    !!session.reviewedAt && !!session.reviewedBy && !session.invoiceId;
}

module.exports = { minutesBetween, makeDraft, canSendInvoice };
