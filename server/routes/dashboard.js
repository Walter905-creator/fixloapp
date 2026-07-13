const router = require('express').Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const RecruiterProfile = require('../models/RecruiterProfile');
const RecruiterReferral = require('../models/RecruiterReferral');
const RecruiterCommission = require('../models/RecruiterCommission');
const RecruiterPayout = require('../models/RecruiterPayout');
const Pro = require('../models/Pro');
const LeadAssignment = require('../models/LeadAssignment');
const JobRequest = require('../models/JobRequest');
const SmsNotification = require('../models/SmsNotification');
const { requireDatabase } = require('../config/database');
const { getOwnerLeadAnalytics, getProLeadMetrics } = require('../services/leadTrackingService');

const TOTAL_COMMISSION_STATUSES = ['pending', 'held', 'approved', 'paid'];
const PENDING_COMMISSION_STATUSES = ['pending', 'held'];
const ACCEPTED_JOB_STATUSES = ['accepted', 'completed', 'in-progress'];

router.use(requireDatabase);

function normalizeId(value) {
  if (!value) return null;
  return String(value);
}

function getAuthedUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      id: normalizeId(decoded.id || decoded.proId),
      role: decoded.role || null
    };
  } catch {
    return null;
  }
}

function getRequestedUserId(req) {
  const user = getAuthedUser(req);
  if (user?.id) return { id: user.id, role: user.role, fallback: false };

  const devOnly = process.env.NODE_ENV !== 'production';
  const userId = normalizeId(req.query.userId);
  if (!devOnly || !userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  return { id: userId, role: null, fallback: true };
}

function mapRecruiterStatus(status) {
  if (status === 'active') return 'converted';
  if (status === 'paid') return 'paid';
  if (status === 'cancelled' || status === 'fraud_review') return 'rejected';
  return 'pending';
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildLast7Days() {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    days.push(startOfDay(day));
  }
  return days;
}

router.get('/recruiter', async (req, res) => {
  try {
    const requester = getRequestedUserId(req);
    if (!requester?.id) return res.status(401).json({ error: 'Unauthorized' });
    if (requester.role && requester.role !== 'recruiter') {
      return res.status(403).json({ error: 'Recruiter access required' });
    }

    const recruiter = await RecruiterProfile.findById(requester.id).lean();
    if (!recruiter) return res.status(404).json({ error: 'Recruiter not found' });

    const [referrals, commissions] = await Promise.all([
      RecruiterReferral.find({ recruiterId: recruiter._id }).sort({ createdAt: -1 }).limit(200).lean(),
      RecruiterCommission.find({ recruiterId: recruiter._id }).select('referralId amount status createdAt').lean()
    ]);

    const sevenDays = buildLast7Days();
    const weekStart = sevenDays[0];

    const referralMap = new Map();
    commissions.forEach((commission) => {
      if (!commission.referralId) return;
      referralMap.set(String(commission.referralId), commission);
    });

    const recentReferrals = referrals.filter((r) => new Date(r.createdAt) >= weekStart);
    const convertedRecent = recentReferrals.filter((r) => {
      const status = mapRecruiterStatus(r.status);
      return status === 'converted' || status === 'paid';
    }).length;

    const totalCommission = commissions
      .filter((c) => TOTAL_COMMISSION_STATUSES.includes(c.status))
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    const pendingCommission = commissions
      .filter((c) => PENDING_COMMISSION_STATUSES.includes(c.status))
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    const weekly = sevenDays.map((day) => {
      const next = new Date(day);
      next.setDate(day.getDate() + 1);

      const dayReferrals = referrals.filter((r) => {
        const date = new Date(r.createdAt);
        return date >= day && date < next;
      });

      const dayConverted = dayReferrals.filter((r) => {
        const status = mapRecruiterStatus(r.status);
        return status === 'converted' || status === 'paid';
      }).length;

      return {
        date: day.toISOString(),
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        referrals: dayReferrals.length,
        converted: dayConverted
      };
    });

    const sourceTotals = referrals.reduce((acc, referral) => {
      const key = referral.referralSource || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const totalSources = Object.values(sourceTotals).reduce((sum, count) => sum + count, 0) || 1;
    const sources = Object.entries(sourceTotals)
      .map(([source, count]) => ({
        source,
        count,
        percentage: Number(((count / totalSources) * 100).toFixed(2))
      }))
      .sort((a, b) => b.count - a.count);

    const response = {
      user: {
        id: String(recruiter._id),
        name: recruiter.name || '',
        role: 'recruiter',
        referralCode: recruiter.recruiterCode || '',
        referralLink: recruiter.proReferralLink || recruiter.recruiterLink || ''
      },
      summary: {
        totalReferrals: recentReferrals.length,
        convertedPros: convertedRecent,
        conversionRate: recentReferrals.length ? Number(((convertedRecent / recentReferrals.length) * 100).toFixed(2)) : 0,
        totalCommission,
        pendingCommission
      },
      weekly,
      sources,
      referrals: referrals.slice(0, 50).map((referral) => {
        const commission = referralMap.get(String(referral._id));
        return {
          id: String(referral._id),
          name: referral.proName || referral.proEmail || 'Unknown',
          trade: referral.proTrade || '—',
          location: referral.proCity || '—',
          dateReferred: referral.signupDate || referral.createdAt,
          status: mapRecruiterStatus(referral.status),
          commission: commission?.amount || 0
        };
      })
    };

    return res.json(response);
  } catch (error) {
    console.error('Dashboard recruiter error:', error);
    return res.status(500).json({ error: 'Failed to load recruiter dashboard' });
  }
});

router.get('/pro', async (req, res) => {
  try {
    const requester = getRequestedUserId(req);
    if (!requester?.id) return res.status(401).json({ error: 'Unauthorized' });
    if (requester.role && !['pro', 'admin'].includes(requester.role)) {
      return res.status(403).json({ error: 'Pro access required' });
    }

    const pro = await Pro.findById(requester.id)
      .select('name role subscriptionStatus subscriptionType subscriptionActive backgroundCheckStatus verificationStatus notificationSettings smsConsent stripeCustomerId stripeSubscriptionId subscriptionEndDate')
      .lean();
    if (!pro) return res.status(404).json({ error: 'Pro not found' });

    const [assignments, ownedJobs] = await Promise.all([
      LeadAssignment.find({ proId: pro._id }).populate('leadId', 'name trade city state address phone smsConsent status createdAt laborCost totalCost visitFee').sort({ createdAt: -1 }).limit(100).lean(),
      JobRequest.find({ $or: [{ assignedProId: pro._id }, { assignedTo: pro._id }] })
        .select('name trade city state address phone smsConsent status createdAt laborCost totalCost visitFee')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()
    ]);

    const assignmentLeads = assignments
      .filter((assignment) => assignment.leadId)
      .map((assignment) => {
        const lead = assignment.leadId;
        const status = assignment.status === 'accepted' ? 'accepted' : assignment.status || lead.status || 'pending';
        const homeownerUnlocked = status === 'accepted';
        return {
          id: String(lead._id),
          customerName: homeownerUnlocked ? (lead.name || 'Customer') : 'Homeowner locked',
          service: lead.trade || 'Service',
          location: homeownerUnlocked
            ? ([lead.city, lead.state].filter(Boolean).join(', ') || lead.address || '—')
            : ([lead.city, lead.state].filter(Boolean).join(', ') || '—'),
          dateRequested: lead.createdAt,
          status,
          estimatedValue: lead.totalCost || lead.laborCost || lead.visitFee || 0,
          phone: homeownerUnlocked ? (lead.phone || '') : '',
          smsConsent: !!lead.smsConsent,
          secureLeadRequired: !homeownerUnlocked
        };
      });

    const directLeads = ownedJobs.map((job) => ({
      id: String(job._id),
      customerName: job.name || 'Customer',
      service: job.trade || 'Service',
      location: [job.city, job.state].filter(Boolean).join(', ') || job.address || '—',
      dateRequested: job.createdAt,
      status: ['assigned', 'in-progress', 'completed'].includes(job.status) ? 'accepted' : (job.status || 'pending'),
      estimatedValue: job.totalCost || job.laborCost || job.visitFee || 0,
      phone: job.phone || '',
      smsConsent: !!job.smsConsent
    }));

    const dedupe = new Map();
    [...assignmentLeads, ...directLeads].forEach((lead) => {
      if (!dedupe.has(lead.id)) dedupe.set(lead.id, lead);
    });

    const leads = Array.from(dedupe.values()).sort((a, b) => new Date(b.dateRequested) - new Date(a.dateRequested));
    const metrics = await getProLeadMetrics(pro._id);

    const newLeads = leads.filter((lead) => lead.status === 'pending').length;
    const acceptedJobs = leads.filter((lead) => ACCEPTED_JOB_STATUSES.includes(lead.status)).length;
    const pendingQuotes = leads.filter((lead) => lead.status === 'pending').length;
    const estimatedEarnings = leads
      .filter((lead) => ACCEPTED_JOB_STATUSES.includes(lead.status))
      .reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);

    const recentRequests = leads.slice(0, 7).map((lead) => ({
      date: lead.dateRequested,
      label: new Date(lead.dateRequested).toLocaleDateString('en-US', { weekday: 'short' }),
      count: 1,
      service: lead.service,
      status: lead.status
    }));

    const subscriptionStatus = pro.subscriptionStatus
      || (pro.subscriptionActive ? 'active' : null)
      || pro.subscriptionType
      || 'inactive';

    return res.json({
      user: {
        id: String(pro._id),
        name: pro.name || '',
        role: 'pro'
      },
      summary: {
        newLeads,
        acceptedJobs,
        pendingQuotes,
        subscriptionStatus,
        checkrStatus: pro.backgroundCheckStatus || pro.verificationStatus || 'pending',
        smsEnabled: !!(pro.notificationSettings?.sms && pro.smsConsent),
        estimatedEarnings,
        leadsReceived: metrics.leadsReceived,
        leadsViewed: metrics.leadsViewed,
        completedJobs: metrics.completed,
        averageResponseTimeMs: metrics.averageResponseTimeMs,
        performanceScore: metrics.performanceScore,
        openRate: metrics.openRate,
        acceptanceRate: metrics.acceptanceRate,
        completionRate: metrics.completionRate,
        declineRate: metrics.declineRate
      },
      leads,
      recentRequests,
      billing: {
        stripeCustomerId: pro.stripeCustomerId || '',
        subscriptionStatus,
        currentPeriodEnd: pro.subscriptionEndDate || ''
      }
    });
  } catch (error) {
    console.error('Dashboard pro error:', error);
    return res.status(500).json({ error: 'Failed to load pro dashboard' });
  }
});

// ── Owner Executive Dashboard ──────────────────────────────────────────────────
// GET /api/dashboard/owner
// Access: authenticated recruiter whose email matches OWNER_EMAIL env var

router.get('/owner', async (req, res) => {
  try {
    // Auth check
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Owner-only gate: email must match OWNER_EMAIL env var
    const ownerEmail = (process.env.OWNER_EMAIL || '').toLowerCase().trim();
    const userEmail = (decoded.email || '').toLowerCase().trim();
    if (!ownerEmail || userEmail !== ownerEmail) {
      return res.status(403).json({ error: 'Owner access required' });
    }

    const now = new Date();
    const leadAnalytics = await getOwnerLeadAnalytics();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // ── Referral / Recruiter Metrics ─────────────────────────────────────────────
    const [
      totalRecruiters,
      weeklyReferrals,
      monthlyReferrals,
      lastMonthReferrals,
      sourceAgg
    ] = await Promise.all([
      RecruiterProfile.countDocuments(),
      RecruiterReferral.countDocuments({ createdAt: { $gte: startOfWeek } }),
      RecruiterReferral.countDocuments({ createdAt: { $gte: startOfMonth } }),
      RecruiterReferral.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      RecruiterReferral.aggregate([
        { $group: { _id: { $ifNull: ['$referralSource', 'unknown'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Conversion metrics
    const [convertedTotal, convertedMonth] = await Promise.all([
      RecruiterReferral.countDocuments({ status: 'active' }),
      RecruiterReferral.countDocuments({ status: 'active', createdAt: { $gte: startOfMonth } })
    ]);
    const totalReferralsAll = await RecruiterReferral.countDocuments();
    const conversionRate = totalReferralsAll > 0
      ? Number(((convertedTotal / totalReferralsAll) * 100).toFixed(2))
      : 0;

    // ── Commission Analytics ──────────────────────────────────────────────────────
    const [commissionAgg, monthCommissionAgg, payoutAgg] = await Promise.all([
      RecruiterCommission.aggregate([
        { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      RecruiterCommission.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      RecruiterPayout.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    const commissionByStatus = commissionAgg.reduce((acc, item) => {
      if (item._id) acc[item._id] = { total: item.total || 0, count: item.count || 0 };
      return acc;
    }, {});
    const monthCommissionByStatus = monthCommissionAgg.reduce((acc, item) => {
      if (item._id) acc[item._id] = { total: item.total || 0, count: item.count || 0 };
      return acc;
    }, {});

    // ── Pro Onboarding & Subscription ────────────────────────────────────────────
    const [
      totalPros,
      activePros,
      prosThisWeek,
      prosThisMonth,
      prosLastMonth,
      subTypeAgg,
      checkrAgg
    ] = await Promise.all([
      Pro.countDocuments(),
      Pro.countDocuments({ subscriptionActive: true }),
      Pro.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Pro.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Pro.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Pro.aggregate([
        { $group: { _id: { $ifNull: ['$subscriptionType', 'none'] }, count: { $sum: 1 } } }
      ]),
      Pro.aggregate([
        { $group: { _id: { $ifNull: ['$backgroundCheckStatus', 'pending'] }, count: { $sum: 1 } } }
      ])
    ]);

    const proGrowthMoM = prosLastMonth > 0
      ? Number((((prosThisMonth - prosLastMonth) / prosLastMonth) * 100).toFixed(1))
      : null;

    const subscriptionBreakdown = subTypeAgg.reduce((acc, item) => {
      if (item._id) acc[item._id] = item.count;
      return acc;
    }, {});

    const checkrBreakdown = checkrAgg.reduce((acc, item) => {
      if (item._id) acc[item._id] = item.count;
      return acc;
    }, {});

    // Revenue projection: active subscribers × monthly price
    const monthlyPriceCents = 5999; // $59.99
    const projectedMonthlyRevenueCents = activePros * monthlyPriceCents;

    // ── Service Request Statistics ────────────────────────────────────────────────
    const [
      totalLeads,
      leadsThisWeek,
      leadsThisMonth,
      leadsLastMonth,
      leadsToday,
      leadStatusAgg,
      leadStateAgg
    ] = await Promise.all([
      JobRequest.countDocuments(),
      JobRequest.countDocuments({ createdAt: { $gte: startOfWeek } }),
      JobRequest.countDocuments({ createdAt: { $gte: startOfMonth } }),
      JobRequest.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      JobRequest.countDocuments({ createdAt: { $gte: startOfToday } }),
      JobRequest.aggregate([
        { $group: { _id: { $ifNull: ['$status', 'pending'] }, count: { $sum: 1 } } }
      ]),
      // US map: referral distribution by state
      JobRequest.aggregate([
        { $match: { state: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 50 }
      ])
    ]);

    const leadGrowthMoM = leadsLastMonth > 0
      ? Number((((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100).toFixed(1))
      : null;

    const leadStatusBreakdown = leadStatusAgg.reduce((acc, item) => {
      if (item._id) acc[item._id] = item.count;
      return acc;
    }, {});

    const stateDistribution = leadStateAgg.map((s) => ({ state: s._id, count: s.count }));

    // ── Twilio SMS Dashboard ──────────────────────────────────────────────────────
    let smsSentTotal = 0;
    let smsFailedTotal = 0;
    let smsSentThisMonth = 0;
    let recentSmsCount = 0;
    let twilioConfigured = false;

    try {
      twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

      const [smsAllAgg, smsMonthAgg, smsRecentAgg] = await Promise.all([
        SmsNotification.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        SmsNotification.aggregate([
          { $match: { createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ]),
        SmsNotification.countDocuments({ createdAt: { $gte: startOfWeek } })
      ]);

      smsAllAgg.forEach((s) => {
        if (s._id === 'sent') smsSentTotal = s.count;
        if (s._id === 'failed') smsFailedTotal = s.count;
      });
      smsSentThisMonth = smsMonthAgg[0]?.count || 0;
      recentSmsCount = smsRecentAgg || 0;
    } catch {
      // SmsNotification model may not exist in all environments
    }

    // ── Owner Alert Logs ──────────────────────────────────────────────────────────
    let ownerAlertsEnabled = false;
    let lastAlertSentAt = null;
    let recentAlerts = [];

    try {
      const OwnerAlertLog = require('../models/OwnerAlertLog');
      ownerAlertsEnabled = !!(
        process.env.OWNER_PHONE_NUMBER &&
        process.env.TWILIO_ACCOUNT_SID &&
        (process.env.NODE_ENV === 'production' || process.env.ENABLE_OWNER_SMS_ALERTS === 'true')
      );

      const [lastAlert, alertHistory] = await Promise.all([
        OwnerAlertLog.findOne({ status: 'sent' }).sort({ createdAt: -1 }).select('createdAt type').lean(),
        OwnerAlertLog.find().sort({ createdAt: -1 }).limit(20).select('type status message createdAt twilioMessageSid errorMessage').lean()
      ]);

      lastAlertSentAt = lastAlert?.createdAt || null;
      recentAlerts = alertHistory.map((a) => ({
        type: a.type,
        status: a.status,
        message: a.message,
        sentAt: a.createdAt,
        twilioMessageSid: a.twilioMessageSid,
        errorMessage: a.errorMessage
      }));
    } catch {
      // OwnerAlertLog may not be initialized yet
    }

    // ── Weekly bar chart data (last 7 days) ───────────────────────────────────────
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      day.setHours(0, 0, 0, 0);
      days.push(day);
    }

    const dailyMetrics = await Promise.all(
      days.map(async (day) => {
        const next = new Date(day);
        next.setDate(day.getDate() + 1);
        const [leads, pros, referrals] = await Promise.all([
          JobRequest.countDocuments({ createdAt: { $gte: day, $lt: next } }),
          Pro.countDocuments({ createdAt: { $gte: day, $lt: next } }),
          RecruiterReferral.countDocuments({ createdAt: { $gte: day, $lt: next } })
        ]);
        return {
          date: day.toISOString(),
          label: day.toLocaleDateString('en-US', { weekday: 'short' }),
          leads,
          pros,
          referrals
        };
      })
    );

    // ── Referral source breakdown ─────────────────────────────────────────────────
    const totalSourceCount = sourceAgg.reduce((s, i) => s + i.count, 0) || 1;
    const referralSources = sourceAgg.map((s) => ({
      source: s._id,
      count: s.count,
      percentage: Number(((s.count / totalSourceCount) * 100).toFixed(2))
    }));

    // ── Stripe subscription overview ──────────────────────────────────────────────
    const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY);

    return res.json({
      generatedAt: now.toISOString(),
      referrals: {
        total: totalReferralsAll,
        weekly: weeklyReferrals,
        monthly: monthlyReferrals,
        lastMonth: lastMonthReferrals,
        converted: convertedTotal,
        convertedThisMonth: convertedMonth,
        conversionRate,
        sources: referralSources,
        totalRecruiters
      },
      commissions: {
        byStatus: commissionByStatus,
        thisMonth: monthCommissionByStatus,
        totalPaid: payoutAgg[0]?.total || 0,
        totalPayouts: payoutAgg[0]?.count || 0
      },
      pros: {
        total: totalPros,
        active: activePros,
        thisWeek: prosThisWeek,
        thisMonth: prosThisMonth,
        lastMonth: prosLastMonth,
        growthMoM: proGrowthMoM,
        subscriptionBreakdown,
        checkrStatus: checkrBreakdown
      },
      leads: {
        total: totalLeads,
        today: leadsToday,
        thisWeek: leadsThisWeek,
        thisMonth: leadsThisMonth,
        lastMonth: leadsLastMonth,
        growthMoM: leadGrowthMoM,
        statusBreakdown: leadStatusBreakdown,
        stateDistribution,
        analytics: leadAnalytics
      },
      revenue: {
        projectedMonthly: projectedMonthlyRevenueCents,
        activeSubs: activePros,
        monthlyPriceCents
      },
      sms: {
        twilioConfigured,
        sentTotal: smsSentTotal,
        failedTotal: smsFailedTotal,
        sentThisMonth: smsSentThisMonth,
        sentThisWeek: recentSmsCount
      },
      ownerAlerts: {
        enabled: ownerAlertsEnabled,
        lastSentAt: lastAlertSentAt,
        recentAlerts
      },
      stripe: {
        configured: stripeConfigured
      },
      growth: {
        daily: dailyMetrics
      }
    });
  } catch (error) {
    console.error('Dashboard owner error:', error);
    return res.status(500).json({ error: 'Failed to load owner dashboard' });
  }
});

module.exports = router;
