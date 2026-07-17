'use strict';

/**
 * Report Generator Service
 *
 * Generates downloadable JSON/CSV reports for admin use.
 * Data comes directly from MongoDB aggregations — no fabrication.
 */

function Pro()             { return require('../../../models/Pro');             }
function JobRequest()      { return require('../../../models/JobRequest');      }
function LeadAssignment()  { return require('../../../models/LeadAssignment');  }
function RecruiterProfile(){ return require('../../../models/RecruiterProfile'); }
function RecruiterReferral(){ return require('../../../models/RecruiterReferral'); }
function RecruiterCommission(){ return require('../../../models/RecruiterCommission'); }
function FGAProScore()     { return require('../models/FGAProScore');           }
function FGARecruiterScore(){ return require('../models/FGARecruiterScore');    }

// ── CSV serializer ────────────────────────────────────────────────────────────

function toCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines   = [headers.join(',')];
  for (const row of rows) {
    const values = headers.map(h => {
      const v = row[h];
      if (v === null || v === undefined) return '';
      const s = String(v);
      // Quote fields containing commas, double-quotes, newlines, or carriage returns (RFC 4180)
      return s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    });
    lines.push(values.join(','));
  }
  // Use CRLF line endings per RFC 4180
  return lines.join('\r\n');
}

// ── Report: Pros ──────────────────────────────────────────────────────────────

async function generateProsReport({ from, to } = {}) {
  const filter = {};
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to)   filter.createdAt.$lte = new Date(to);
  }

  const pros = await Pro().find(filter)
    .select('name email phone trade city state subscriptionTier subscriptionStatus isVerified isActive createdAt avgRating completedJobs')
    .lean();

  // Enrich with performance scores
  const proIds = pros.map(p => p._id);
  const scores = await FGAProScore().find({ proId: { $in: proIds } }).lean();
  const scoreMap = Object.fromEntries(scores.map(s => [String(s.proId), s]));

  const rows = pros.map(p => {
    const s = scoreMap[String(p._id)] || {};
    return {
      id:                String(p._id),
      name:              p.name || '',
      email:             p.email || '',
      phone:             p.phone || '',
      trade:             p.trade || '',
      city:              p.city  || '',
      state:             p.state || '',
      subscriptionTier:  p.subscriptionTier  || '',
      subscriptionStatus:p.subscriptionStatus || '',
      isVerified:        p.isVerified ? 'Yes' : 'No',
      isActive:          p.isActive   ? 'Yes' : 'No',
      joinedDate:        p.createdAt  ? p.createdAt.toISOString().slice(0, 10) : '',
      avgRating:         p.avgRating  || 0,
      completedJobs:     p.completedJobs || 0,
      performanceScore:  s.score        || 0,
      scoreLabel:        s.scoreLabel   || '',
      acceptanceRate:    s.acceptanceRate || 0,
      avgResponseTimeSec:s.avgResponseTimeSec || 0,
    };
  });

  return { rows, csv: toCSV(rows), total: rows.length };
}

// ── Report: Recruiters ────────────────────────────────────────────────────────

async function generateRecruitersReport() {
  const recruiters = await RecruiterProfile().find({})
    .select('name email city state recruiterCode status createdAt')
    .lean();

  const rids = recruiters.map(r => r._id);
  const scores = await FGARecruiterScore().find({ recruiterId: { $in: rids } }).lean();
  const scoreMap = Object.fromEntries(scores.map(s => [String(s.recruiterId), s]));

  const rows = recruiters.map(r => {
    const s = scoreMap[String(r._id)] || {};
    return {
      id:                String(r._id),
      name:              r.name  || '',
      email:             r.email || '',
      city:              r.city  || '',
      state:             r.state || '',
      recruiterCode:     r.recruiterCode || '',
      status:            r.status || '',
      joinedDate:        r.createdAt ? r.createdAt.toISOString().slice(0, 10) : '',
      prosInvited:       s.prosInvited    || 0,
      subscriptions:     s.subscriptions  || 0,
      conversionRate:    s.conversionRate || 0,
      retentionRate:     s.retentionRate  || 0,
      revenueGenerated:  s.revenueGeneratedCents ? (s.revenueGeneratedCents / 100).toFixed(2) : '0.00',
      performanceScore:  s.score      || 0,
      scoreLabel:        s.scoreLabel || '',
    };
  });

  return { rows, csv: toCSV(rows), total: rows.length };
}

// ── Report: Lead Performance ──────────────────────────────────────────────────

async function generateLeadPerformanceReport({ days = 30 } = {}) {
  const since = new Date(Date.now() - days * 86400000);
  const agg = await JobRequest().aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: '$trade',
        totalLeads:   { $sum: 1 },
        completed:    { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelled:    { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        pending:      { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      },
    },
    {
      $addFields: {
        completionRate:  { $multiply: [{ $divide: ['$completed', '$totalLeads'] }, 100] },
        cancellationRate:{ $multiply: [{ $divide: ['$cancelled', '$totalLeads'] }, 100] },
      },
    },
    { $sort: { totalLeads: -1 } },
  ]);

  const rows = agg.map(r => ({
    trade:            r._id || '',
    totalLeads:       r.totalLeads,
    completed:        r.completed,
    cancelled:        r.cancelled,
    pending:          r.pending,
    completionRate:   Math.round(r.completionRate  * 10) / 10,
    cancellationRate: Math.round(r.cancellationRate * 10) / 10,
  }));

  return { rows, csv: toCSV(rows), total: rows.length, days };
}

// ── Report: Subscriptions ─────────────────────────────────────────────────────

async function generateSubscriptionsReport({ from, to } = {}) {
  const filter = { subscriptionActive: true };
  if (from || to) {
    filter.subscriptionStartDate = {};
    if (from) filter.subscriptionStartDate.$gte = new Date(from);
    if (to)   filter.subscriptionStartDate.$lte = new Date(to);
  }

  const pros = await Pro().find(filter)
    .select('name email trade city state subscriptionTier subscriptionPlan subscriptionStatus subscriptionStartDate subscriptionPrice')
    .lean();

  const rows = pros.map(p => ({
    name:           p.name     || '',
    email:          p.email    || '',
    trade:          p.trade    || '',
    city:           p.city     || '',
    state:          p.state    || '',
    plan:           p.subscriptionPlan   || '',
    tier:           p.subscriptionTier   || '',
    status:         p.subscriptionStatus || '',
    monthlyPrice:   p.subscriptionPrice  || 0,
    startDate:      p.subscriptionStartDate ? p.subscriptionStartDate.toISOString().slice(0, 10) : '',
  }));

  return { rows, csv: toCSV(rows), total: rows.length };
}

// ── Report: Revenue ───────────────────────────────────────────────────────────

async function generateRevenueReport({ days = 30 } = {}) {
  const since = new Date(Date.now() - days * 86400000);

  const [monthlyRevenue, tradeRevenue] = await Promise.all([
    // Revenue by subscription tier
    Pro().aggregate([
      { $match: { subscriptionActive: true, subscriptionStartDate: { $gte: since } } },
      {
        $group: {
          _id: '$subscriptionTier',
          count:            { $sum: 1 },
          totalRevenueCents:{ $sum: { $multiply: ['$subscriptionPrice', 100] } },
        },
      },
      { $sort: { totalRevenueCents: -1 } },
    ]),

    // Revenue-related leads by trade
    JobRequest().aggregate([
      { $match: { createdAt: { $gte: since }, status: 'completed' } },
      { $group: { _id: '$trade', completedJobs: { $sum: 1 } } },
      { $sort: { completedJobs: -1 } },
    ]),
  ]);

  const rows = monthlyRevenue.map(r => ({
    tier:              r._id || '',
    activeSubscriptions: r.count,
    estimatedRevenue:  (r.totalRevenueCents / 100).toFixed(2),
  }));

  return { rows, csv: toCSV(rows), total: rows.length, tradeRevenue, days };
}

// ── Report: Response Times ────────────────────────────────────────────────────

async function generateResponseTimesReport({ days = 30 } = {}) {
  const since = new Date(Date.now() - days * 86400000);

  const agg = await LeadAssignment().aggregate([
    { $match: { createdAt: { $gte: since }, responseTimeMs: { $gt: 0 } } },
    {
      $group: {
        _id: '$proId',
        avgResponseMs: { $avg: '$responseTimeMs' },
        minResponseMs: { $min: '$responseTimeMs' },
        maxResponseMs: { $max: '$responseTimeMs' },
        sampleCount:   { $sum: 1 },
      },
    },
    { $sort: { avgResponseMs: 1 } },
    { $limit: 200 },
  ]);

  const proIds = agg.map(r => r._id);
  const pros   = await Pro().find({ _id: { $in: proIds } }).select('name trade city state').lean();
  const proMap = Object.fromEntries(pros.map(p => [String(p._id), p]));

  const rows = agg.map(r => {
    const p = proMap[String(r._id)] || {};
    return {
      proId:          String(r._id),
      name:           p.name  || '',
      trade:          p.trade || '',
      city:           p.city  || '',
      state:          p.state || '',
      avgResponseSec: Math.round((r.avgResponseMs / 1000) * 10) / 10,
      minResponseSec: Math.round((r.minResponseMs / 1000) * 10) / 10,
      maxResponseSec: Math.round((r.maxResponseMs / 1000) * 10) / 10,
      sampleCount:    r.sampleCount,
    };
  });

  return { rows, csv: toCSV(rows), total: rows.length, days };
}

module.exports = {
  generateProsReport,
  generateRecruitersReport,
  generateLeadPerformanceReport,
  generateSubscriptionsReport,
  generateRevenueReport,
  generateResponseTimesReport,
  toCSV,
};
