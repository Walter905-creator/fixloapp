const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const Homeowner = require('../models/Homeowner');
const Discount = require('../models/HomeownerDiscount');
const service = require('./homeownerReferralService');
afterEach(() => require('node:test').mock.restoreAll());

test('discounts the complete $1,000 total to $900 and rounds in cents', () => {
  assert.deepEqual(service.discountAmounts(1000), { grossTotal: 1000, discountAmount: 100, total: 900 });
  assert.deepEqual(service.discountAmounts(123.45), { grossTotal: 123.45, discountAmount: 12.35, total: 111.1 });
  assert.throws(() => service.discountAmounts(NaN));
  assert.throws(() => service.discountAmounts(-1));
});

test('accepts the owner campaign but rejects unknown invitations', async () => {
  assert.deepEqual(await service.validateInvitation(' fixlo10 '), { code: 'FIXLO10', referrerId: null });
  assert.equal(await service.validateInvitation(''), null);
  await assert.rejects(service.validateInvitation('MADEUP10'), /Invalid invitation/);
});

test('normalizes formatted phone numbers and rejects short numbers', () => {
  assert.equal(service.phoneNumber('(704) 555-1234'), '+17045551234');
  assert.equal(service.phoneNumber('17045551234'), '+17045551234');
  assert.equal(service.phoneNumber('123'), null);
});

test('blocks self-referrals with a different phone format', async t => {
  t.mock.method(Homeowner, 'findOne', () => ({ lean: async () => ({ _id: 'owner', email: 'a@example.com', phone: '+17045551234' }) }));
  await assert.rejects(service.validateInvitation('HW-123456ABCDEF', { phone: '(704) 555-1234' }), /own invitation/);
  await assert.rejects(service.validateInvitation('HW-123456ABCDEF', { email: 'A@EXAMPLE.COM' }), /own invitation/);
});

test('no discount is granted before phone verification', async t => {
  const write = t.mock.method(Discount, 'findOneAndUpdate');
  assert.equal(await service.grantDiscount({ _id: 'user', invitationCode: 'FIXLO10' }), null);
  assert.equal(write.mock.callCount(), 0);
});

test('a second account cannot overwrite the benefit for the same verified phone', async t => {
  const original = { _id: '+17045551234', homeownerId: 'first', usedAt: new Date() };
  t.mock.method(Discount, 'findOneAndUpdate', async (query, update) => {
    assert.equal(query._id, original._id);
    assert.ok(update.$setOnInsert);
    assert.equal(update.$set, undefined);
    return original;
  });
  const benefit = await service.grantDiscount({ _id: 'second', verifiedPhone: original._id, invitationCode: 'FIXLO10' });
  assert.equal(benefit.homeownerId, 'first');
  assert.ok(benefit.usedAt);
});

test('a verified account reserves the discount for only one of two jobs', async t => {
  const phone = '+17045551234';
  t.mock.method(Homeowner, 'findOne', () => ({ lean: async () => ({ _id: 'user', verifiedPhone: phone }) }));
  let reservation = null;
  t.mock.method(Discount, 'findOneAndUpdate', async (query, update) => {
    assert.equal(query.usedAt, null);
    assert.equal(query.homeownerId, 'user');
    assert.equal(query._id, phone);
    assert.deepEqual(query.$or, [{ reservedJobId: null }, { reservedJobId: update.$set.reservedJobId }]);
    if (reservation && reservation !== update.$set.reservedJobId) return null;
    reservation = update.$set.reservedJobId;
    return { reservedJobId: reservation };
  });
  const makeJob = id => ({ _id: id, email: 'customer@example.com', phone, save: async () => {} });
  const jobs = [makeJob('job1'), makeJob('job2')];
  const amounts = await Promise.all(jobs.map(job => service.reserveJobDiscount(job, 1000)));
  assert.equal(amounts.filter(value => value.discountAmount === 100).length, 1);
  assert.equal(amounts.filter(value => value.total === 1000).length, 1);
});

test('a retried job keeps its frozen discounted total without spending again', async t => {
  const find = t.mock.method(Discount, 'findOneAndUpdate');
  const job = { homeownerDiscountPhone: '+17045551234', discountGrossTotal: 123.45, discountAmount: 12.35 };
  assert.deepEqual(await service.reserveJobDiscount(job, 500), { grossTotal: 123.45, discountAmount: 12.35, total: 111.1 });
  assert.equal(find.mock.callCount(), 0);
});

test('payment completion only consumes the reservation belonging to that job', async t => {
  t.mock.method(Discount, 'updateOne', async (query, update) => {
    assert.deepEqual(query, { _id: '+17045551234', reservedJobId: 'job1', usedAt: null });
    assert.ok(update.$set.usedAt instanceof Date);
  });
  await service.completeJobDiscount({ _id: 'job1', homeownerDiscountPhone: '+17045551234' });
});
