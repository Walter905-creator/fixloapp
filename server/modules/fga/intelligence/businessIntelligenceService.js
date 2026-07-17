'use strict';

/**
 * Business Intelligence Service
 *
 * Provides aggregated business metrics backed by real database queries.
 * All methods return live data — no caches, no fakes.
 */

const mongoose = require('mongoose');

// ── Lazy loaders (avoid circular deps at boot) ─────────────────────────────────
function Pro()            { return require('../../../models/Pro');            }
function JobRequest()     { return require('../../../models/JobRequest');     }
function LeadAssignment() { return require('../../../models/LeadAssignment'); }
function Review()         { return require('../../../models/Review');         }
function RecruiterProfile()  { return require('../../../models/RecruiterProfile');  }
function RecruiterReferral() { return require('../../../models/RecruiterReferral'); }
function FGACampaignAttribution() { return require('../models/FGACampaignAttribution'); }
function FGAProScore()    { return require('../models/FGAProScore');          }
function FGARecruiterScore() { return require('../models/FGARecruiterScore'); }

// ── Helpers ───────────────────────────────────────────────────────────────────

function dateRange(days) {
  return { $gte: new Date(Date.now() - days * 86400000) };
}

// ── Top Performing Trade ──────────────────────────────────────────────────────

/**
 * Ranks trades by: lead volume, completion rate, average rating.
 * @param {number} [days=30]
 * @returns {Promise<Array>}
 */
async function getTopTrades(days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  return JobRequest().aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: '$trade',
        totalLeads:    { $sum: 1 },
        completed:     { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelled:     { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      },
    },
    {
      $addFields: {
        completionRate: {
          $cond: [
            { $gt: ['$totalLeads', 0] },
            { $multiply: [{ $divide: ['$completed', '$totalLeads'] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: { totalLeads: -1, completionRate: -1 } },
    { $limit: 20 },
  ]);
}

// ── Top Performing City ───────────────────────────────────────────────────────

/**
 * Ranks cities by lead volume and active professionals.
 * @param {number} [days=30]
 */
async function getTopCities(days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  return JobRequest().aggregate([
    { $match: { createdAt: { $gte: since }, city: { $ne: null, $ne: '' } } },
    {
      $group: {
        _id: { city: '$city', state: '$state' },
        totalLeads:  { $sum: 1 },
        completed:   { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
    {
      $addFields: {
        completionRate: {
          $cond: [
            { $gt: ['$totalLeads', 0] },
            { $multiply: [{ $divide: ['$completed', '$totalLeads'] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: { totalLeads: -1 } },
    { $limit: 20 },
  ]);
}

// ── Fastest Growing States ────────────────────────────────────────────────────

/**
 * Compares pro registrations in current vs. previous period to find fastest-growing states.
 * @param {number} [days=30]
 */
async function getFastestGrowingStates(days = 30) {
  const now    = Date.now();
  const since  = new Date(now - days * 86400000);
  const before = new Date(now - days * 2 * 86400000);

  const [current, previous] = await Promise.all([
    Pro().aggregate([
      { $match: { createdAt: { $gte: since }, state: { $ne: null, $ne: '' } } },
      { $group: { _id: '$state', count: { $sum: 1 } } },
    ]),
    Pro().aggregate([
      { $match: { createdAt: { $gte: before, $lt: since }, state: { $ne: null, $ne: '' } } },
      { $group: { _id: '$state', count: { $sum: 1 } } },
    ]),
  ]);

  const prevMap = Object.fromEntries(previous.map(p => [p._id, p.count]));
  return current
    .map(c => {
      const prev   = prevMap[c._id] || 0;
      const growth = prev > 0 ? ((c.count - prev) / prev) * 100 : c.count * 100;
      return { state: c._id, currentPeriod: c.count, previousPeriod: prev, growthPct: growth };
    })
    .sort((a, b) => b.growthPct - a.growthPct)
    .slice(0, 20);
}

// ── Best Marketing Campaign ───────────────────────────────────────────────────

/**
 * Returns campaign attribution sorted by conversion rate and revenue.
 */
async function getBestCampaigns() {
  const { getFunnelByCampaign } = require('./campaignAttributionService');
  return getFunnelByCampaign();
}

// ── Best Recruiter ────────────────────────────────────────────────────────────

/**
 * Top recruiters by revenue generated.
 * @param {number} [limit=10]
 */
async function getTopRecruiters(limit = 10) {
  return FGARecruiterScore().find({ revenueGeneratedCents: { $gt: 0 } })
    .sort({ revenueGeneratedCents: -1 })
    .limit(limit)
    .populate('recruiterId', 'name email city state')
    .lean();
}

// ── Highest Revenue Source ────────────────────────────────────────────────────

/**
 * Revenue by acquisition source.
 */
async function getRevenueBySource() {
  const { getROIBySource } = require('./campaignAttributionService');
  return getROIBySource();
}

// ── Highest Converting Landing Page ──────────────────────────────────────────

/**
 * Conversion rates by landing page.
 */
async function getBestLandingPages() {
  return FGACampaignAttribution().aggregate([
    { $match: { landingPage: { $ne: '' } } },
    {
      $group: {
        _id: '$landingPage',
        visitors:  { $sum: 1 },
        subscribed: { $sum: { $cond: [{ $ne: ['$subscribedAt', null] }, 1, 0] } },
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
      },
    },
    { $sort: { conversionRate: -1 } },
    { $limit: 20 },
  ]);
}

// ── Highest Performing Referral Campaign ─────────────────────────────────────

/**
 * Performance of each recruiter referral code.
 */
async function getBestReferralCampaigns() {
  return RecruiterReferral().aggregate([
    {
      $group: {
        _id: '$referralCode',
        totalReferrals:  { $sum: 1 },
        activeReferrals: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        revenue:         { $sum: '$subscriptionAmount' },
      },
    },
    {
      $addFields: {
        conversionRate: {
          $cond: [
            { $gt: ['$totalReferrals', 0] },
            { $multiply: [{ $divide: ['$activeReferrals', '$totalReferrals'] }, 100] },
            0,
          ],
        },
        revenueDollars: { $divide: ['$revenue', 100] },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 20 },
  ]);
}

// ── Lead Funnel Summary ───────────────────────────────────────────────────────

/**
 * Lead funnel from creation to completion.
 * @param {number} [days=30]
 */
async function getLeadFunnel(days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  const LeadEvent = require('../../../models/LeadEvent');
  return LeadEvent.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
}

// ── Subscription Funnel ───────────────────────────────────────────────────────

/**
 * Subscription funnel metrics.
 * @param {number} [days=30]
 */
async function getSubscriptionFunnel(days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  const [started, verified, subscribed, cancelled] = await Promise.all([
    Pro().countDocuments({ createdAt: { $gte: since } }),
    Pro().countDocuments({ createdAt: { $gte: since }, isVerified: true }),
    Pro().countDocuments({ createdAt: { $gte: since }, subscriptionActive: true }),
    Pro().countDocuments({ createdAt: { $gte: since }, subscriptionStatus: 'cancelled' }),
  ]);

  return { started, verified, subscribed, cancelled,
    verificationRate: started > 0 ? (verified / started) * 100 : 0,
    subscriptionRate: started > 0 ? (subscribed / started) * 100 : 0,
    churnRate:        subscribed > 0 ? (cancelled / subscribed) * 100 : 0,
  };
}

// ── Worst Performing Areas ────────────────────────────────────────────────────

/**
 * Cities/states with the most cancelled leads or lowest completion rates.
 * @param {number} [days=30]
 */
async function getWorstPerformingAreas(days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  return JobRequest().aggregate([
    {
      $match: {
        createdAt: { $gte: since },
        city: { $ne: null, $ne: '' },
        status: { $in: ['completed', 'cancelled'] },
      },
    },
    {
      $group: {
        _id: { city: '$city', state: '$state' },
        totalLeads: { $sum: 1 },
        cancelled:  { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        completed:  { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
    {
      $addFields: {
        cancellationRate: {
          $cond: [
            { $gt: ['$totalLeads', 0] },
            { $multiply: [{ $divide: ['$cancelled', '$totalLeads'] }, 100] },
            0,
          ],
        },
      },
    },
    { $match: { totalLeads: { $gte: 3 } } },
    { $sort: { cancellationRate: -1 } },
    { $limit: 20 },
  ]);
}

// ── Growth Funnel (combined) ──────────────────────────────────────────────────

/**
 * Growth funnel combining pro registration, verification, and subscription steps.
 * @param {number} [days=30]
 */
async function getGrowthFunnel(days = 30) {
  const [subFunnel, roiBySource] = await Promise.all([
    getSubscriptionFunnel(days),
    getRevenueBySource(),
  ]);
  return { subscriptionFunnel: subFunnel, roiBySource };
}

module.exports = {
  getTopTrades,
  getTopCities,
  getFastestGrowingStates,
  getBestCampaigns,
  getTopRecruiters,
  getRevenueBySource,
  getBestLandingPages,
  getBestReferralCampaigns,
  getLeadFunnel,
  getSubscriptionFunnel,
  getWorstPerformingAreas,
  getGrowthFunnel,
};
