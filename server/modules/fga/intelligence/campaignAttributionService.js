'use strict';

/**
 * Campaign Attribution Service
 *
 * Creates and updates the FGACampaignAttribution record for each professional.
 * Tracks the full signup funnel: visitor → lead → registration → phone verified
 *   → subscribed → first lead → first job completed.
 */

const FGACampaignAttribution = require('../models/FGACampaignAttribution');

// ── Source detection ──────────────────────────────────────────────────────────

const SOURCE_MAP = {
  facebook:    'facebook',
  fb:          'facebook',
  instagram:   'instagram',
  ig:          'instagram',
  google:      'google',
  adwords:     'google',
  seo:         'seo',
  organic:     'seo',
  referral:    'referral',
  ref:         'referral',
  recruiter:   'recruiter',
  direct:      'direct',
  landing:     'landing_page',
  landing_page:'landing_page',
  qr:          'qr_code',
  qr_code:     'qr_code',
  email:       'email',
  sms:         'sms',
  youtube:     'youtube',
  tiktok:      'tiktok',
  twitter:     'twitter',
  linkedin:    'linkedin',
};

/**
 * Map a raw UTM source string to a canonical source name.
 *
 * @param {string} rawSource
 * @returns {string}
 */
function normalizeSource(rawSource) {
  const key = (rawSource || '').toLowerCase().trim();
  return SOURCE_MAP[key] || 'unknown';
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create or update the attribution record when a pro registers.
 *
 * @param {object} params
 * @param {string|ObjectId} params.proId
 * @param {string} [params.utmSource]
 * @param {string} [params.utmMedium]
 * @param {string} [params.utmCampaign]
 * @param {string} [params.utmContent]
 * @param {string} [params.utmTerm]
 * @param {string|ObjectId} [params.recruiterId]
 * @param {string} [params.recruiterCode]
 * @param {string} [params.landingPage]
 * @param {string} [params.referrerUrl]
 * @param {string} [params.promoCode]
 * @param {string} [params.qrCodeId]
 * @param {string} [params.signupIp]
 * @returns {Promise<FGACampaignAttribution>}
 */
async function recordRegistration(params) {
  const {
    proId, utmSource, utmMedium, utmCampaign, utmContent, utmTerm,
    recruiterId, recruiterCode, landingPage, referrerUrl,
    promoCode, qrCodeId, signupIp,
  } = params;

  const source = recruiterId
    ? 'recruiter'
    : normalizeSource(utmSource);

  const now = new Date();

  return FGACampaignAttribution.findOneAndUpdate(
    { proId },
    {
      $setOnInsert: {
        proId,
        source,
        utmSource:    utmSource    || '',
        utmMedium:    utmMedium    || '',
        utmCampaign:  utmCampaign  || '',
        utmContent:   utmContent   || '',
        utmTerm:      utmTerm      || '',
        recruiterId:  recruiterId  || null,
        recruiterCode:recruiterCode|| '',
        landingPage:  landingPage  || '',
        referrerUrl:  referrerUrl  || '',
        promoCode:    promoCode    || '',
        qrCodeId:     qrCodeId     || '',
        signupIp:     signupIp     || '',
        registeredAt: now,
        funnelStage:  'registered',
      },
    },
    { upsert: true, new: true }
  );
}

/**
 * Advance the funnel stage for a professional.
 *
 * @param {string|ObjectId} proId
 * @param {'phone_verified'|'subscribed'|'first_lead'|'first_job_completed'} stage
 * @param {object} [extra]  Additional fields to set (e.g. subscribedAt)
 */
async function advanceFunnel(proId, stage, extra = {}) {
  const stageTimestamps = {
    phone_verified:      { phoneVerifiedAt: new Date() },
    subscribed:          { subscribedAt:    new Date() },
    first_lead:          { firstLeadAt:     new Date() },
    first_job_completed: { firstJobCompletedAt: new Date() },
  };

  const timestamps = stageTimestamps[stage] || {};

  try {
    await FGACampaignAttribution.findOneAndUpdate(
      { proId },
      { $set: { funnelStage: stage, ...timestamps, ...extra } }
    );
  } catch (err) {
    console.error('[FGA:Attribution] ❌ advanceFunnel error:', err.message);
  }
}

/**
 * Record subscription revenue contribution for a pro.
 *
 * @param {string|ObjectId} proId
 * @param {number} amountCents
 */
async function recordRevenue(proId, amountCents) {
  try {
    await FGACampaignAttribution.findOneAndUpdate(
      { proId },
      {
        $inc:  { lifetimeRevenueCents: amountCents, monthsSubscribed: 1 },
        $set:  { funnelStage: 'subscribed' },
      }
    );
  } catch (err) {
    console.error('[FGA:Attribution] ❌ recordRevenue error:', err.message);
  }
}

/**
 * Aggregate attribution ROI by source.
 *
 * @param {{ from?: Date, to?: Date }} [dateRange]
 * @returns {Promise<Array>}
 */
async function getROIBySource(dateRange = {}) {
  const match = {};
  if (dateRange.from || dateRange.to) {
    match.createdAt = {};
    if (dateRange.from) match.createdAt.$gte = dateRange.from;
    if (dateRange.to)   match.createdAt.$lte = dateRange.to;
  }

  return FGACampaignAttribution.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$source',
        totalVisitors:     { $sum: 1 },
        registered:        { $sum: { $cond: [{ $ne: ['$registeredAt', null] }, 1, 0] } },
        phoneVerified:     { $sum: { $cond: [{ $ne: ['$phoneVerifiedAt', null] }, 1, 0] } },
        subscribed:        { $sum: { $cond: [{ $ne: ['$subscribedAt', null] }, 1, 0] } },
        firstLeads:        { $sum: { $cond: [{ $ne: ['$firstLeadAt', null] }, 1, 0] } },
        firstJobCompleted: { $sum: { $cond: [{ $ne: ['$firstJobCompletedAt', null] }, 1, 0] } },
        totalRevenueCents: { $sum: '$lifetimeRevenueCents' },
        avgMonthsSubscribed: { $avg: '$monthsSubscribed' },
      },
    },
    {
      $addFields: {
        conversionRate: {
          $cond: [
            { $gt: ['$totalVisitors', 0] },
            { $multiply: [{ $divide: ['$subscribed', '$totalVisitors'] }, 100] },
            0,
          ],
        },
        totalRevenueDollars: { $divide: ['$totalRevenueCents', 100] },
      },
    },
    { $sort: { totalRevenueDollars: -1 } },
  ]);
}

/**
 * Full funnel breakdown by campaign (utmCampaign).
 *
 * @returns {Promise<Array>}
 */
async function getFunnelByCampaign() {
  return FGACampaignAttribution.aggregate([
    { $match: { utmCampaign: { $ne: '' } } },
    {
      $group: {
        _id: '$utmCampaign',
        source: { $first: '$source' },
        visitors:    { $sum: 1 },
        subscribed:  { $sum: { $cond: [{ $ne: ['$subscribedAt', null] }, 1, 0] } },
        totalRevenueCents: { $sum: '$lifetimeRevenueCents' },
      },
    },
    {
      $addFields: {
        conversionRate: {
          $cond: [
            { $gt: ['$visitors', 0] },
            { $multiply: [{ $divide: ['$subscribed', '$visitors'] }, 100] },
            0,
          ],
        },
        totalRevenueDollars: { $divide: ['$totalRevenueCents', 100] },
      },
    },
    { $sort: { totalRevenueDollars: -1 } },
  ]);
}

/**
 * Get attribution record for a specific pro.
 *
 * @param {string|ObjectId} proId
 * @returns {Promise<FGACampaignAttribution|null>}
 */
async function getAttribution(proId) {
  return FGACampaignAttribution.findOne({ proId }).lean();
}

module.exports = {
  normalizeSource,
  recordRegistration,
  advanceFunnel,
  recordRevenue,
  getROIBySource,
  getFunnelByCampaign,
  getAttribution,
};
