const router = require('express').Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const RecruiterProfile = require('../models/RecruiterProfile');
const RecruiterReferral = require('../models/RecruiterReferral');
const RecruiterCommission = require('../models/RecruiterCommission');
const Pro = require('../models/Pro');
const LeadAssignment = require('../models/LeadAssignment');
const JobRequest = require('../models/JobRequest');
const { requireDatabase } = require('../config/database');

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
        return {
          id: String(lead._id),
          customerName: lead.name || 'Customer',
          service: lead.trade || 'Service',
          location: [lead.city, lead.state].filter(Boolean).join(', ') || lead.address || '—',
          dateRequested: lead.createdAt,
          status,
          estimatedValue: lead.totalCost || lead.laborCost || lead.visitFee || 0,
          phone: lead.phone || '',
          smsConsent: !!lead.smsConsent
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
        estimatedEarnings
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

module.exports = router;
