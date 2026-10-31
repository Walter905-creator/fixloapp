const test = require('node:test');
const assert = require('node:assert/strict');
const { makeDraft, canSendInvoice } = require('./hourlyWorkflow');

test('day 1: six tasks out of ten, eight hours at $75, draft not sent', () => {
  const tasks = Array.from({length: 10}, (_, i) => ({completed: i < 6}));
  const draft = makeDraft({
    startedAt: '2026-10-31T12:00:00Z', endedAt: '2026-10-31T20:00:00Z',
    hourlyRateCents: 7500
  });
  assert.equal(tasks.filter(t => t.completed).length, 6);
  assert.equal(tasks.filter(t => !t.completed).length, 4);
  assert.equal(draft.minutes, 480);
  assert.equal(draft.totalCents, 60000);
  assert.equal(draft.status, 'draft');
  assert.equal(canSendInvoice(draft), false);
});

test('day 2 has a separate draft and pending tasks remain', () => {
  const tasks = Array.from({length: 10}, (_, i) => ({ completed: i < 6 }));
  tasks.push({completed: false}, {completed: false});
  const day2 = makeDraft({
    startedAt: '2026-11-01T13:00:00Z', endedAt: '2026-11-01T15:30:00Z',
    hourlyRateCents: 7500, materials: [{description:'Hinges', amountCents: 1250}]
  });
  assert.equal(tasks.filter(t => !t.completed).length, 6);
  assert.equal(day2.totalCents, 20000);
});

test('review is mandatory before sending', () => {
  assert.equal(canSendInvoice({status:'draft'}), false);
  assert.equal(canSendInvoice({status:'draft', reviewedAt:new Date(), reviewedBy:'pro'}), true);
  assert.equal(canSendInvoice({status:'invoiced', reviewedAt:new Date(), reviewedBy:'pro'}), false);
});

test('reject bad time and invalid materials', () => {
  assert.throws(() => makeDraft({startedAt:1,endedAt:1,hourlyRateCents:7500}));
  assert.throws(() => makeDraft({startedAt:1,endedAt:100000,hourlyRateCents:7500,materials:[{description:'x',amountCents:-1}]}));
});
