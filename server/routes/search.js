const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Homeowner = require('../models/Homeowner');
const Pro = require('../models/Pro');
const JobRequest = require('../models/JobRequest');
const Message = require('../models/Message');
const Document = require('../models/Document');
const RecruiterProfile = require('../models/RecruiterProfile');
const RecruiterReferral = require('../models/RecruiterReferral');
const { requireDatabase } = require('../config/database');

const router = express.Router();

const BOOST_WEIGHT = parseFloat(process.env.BOOST_WEIGHT || '10');
const RATING_WEIGHT = parseFloat(process.env.RATING_WEIGHT || '1.5');
const RECENCY_WEIGHT = parseFloat(process.env.RECENCY_WEIGHT || '0.1');

function normalizeId(value) {
  return value ? String(value) : null;
}

function getAuthedUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      id: normalizeId(decoded.id || decoded.proId),
      role: decoded.role || null,
      email: decoded.email || '',
      isAdmin: decoded.isAdmin === true
    };
  } catch {
    return null;
  }
}

function requireUser(req, res, next) {
  const user = getAuthedUser(req);
  if (!user?.id || !mongoose.Types.ObjectId.isValid(user.id)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  return next();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function paginateResult(items, page, limit) {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
}

// GET /api/search/pros
router.get('/search/pros', requireDatabase, async (req, res) => {
  try {
    const { service, lat, lng, radiusMiles = 30 } = req.query;
    const now = new Date();

    let searchQuery = { isActive: true };

    if (service) {
      const serviceToTrade = {
        plumbing: 'plumbing',
        electrical: 'electrical',
        landscaping: 'landscaping',
        cleaning: 'cleaning',
        'house cleaning': 'cleaning',
        'junk removal': 'junk_removal',
        handyman: 'handyman',
        hvac: 'hvac',
        heating: 'hvac',
        'air conditioning': 'hvac',
        painting: 'painting',
        roofing: 'roofing',
        flooring: 'flooring',
        carpentry: 'carpentry',
        'appliance repair': 'appliance_repair'
      };

      const trade = serviceToTrade[String(service).toLowerCase()] || String(service).toLowerCase();
      searchQuery.trade = trade;
    }

    if (lat && lng) {
      const radiusInMeters = Number(radiusMiles) * 1609.34;
      searchQuery.location = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusInMeters
        }
      };
    }

    const candidates = await Pro.find(searchQuery)
      .select('name firstName lastName businessName trade primaryService location avgRating reviewCount completedJobs badges boostActiveUntil updatedAt slug')
      .lean();

    const scored = candidates
      .map((pro) => {
        const boosted = pro.boostActiveUntil && new Date(pro.boostActiveUntil) > now;
        const rating = pro.avgRating || pro.rating || 0;
        const recent = pro.updatedAt ? (now - new Date(pro.updatedAt)) / (1000 * 60 * 60 * 24) : 999;
        const recencyScore = Math.max(0, 30 - recent) * RECENCY_WEIGHT;
        let score = rating * RATING_WEIGHT + recencyScore;
        if (boosted) score += BOOST_WEIGHT;
        return { ...pro, _score: score, _boosted: boosted };
      })
      .sort((a, b) => b._score - a._score);

    return res.json({ ok: true, results: scored });
  } catch (error) {
    console.error('search error', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/search', requireDatabase, requireUser, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({ error: 'q is required' });
    }

    const type = req.query.type ? String(req.query.type).toLowerCase() : null;
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const regex = new RegExp(escapeRegex(q), 'i');

    async function searchHomeownerJobs() {
      const homeowner = await Homeowner.findById(req.user.id).select('email phone').lean();
      const filters = [];
      if (homeowner?.email) filters.push({ email: homeowner.email.toLowerCase() });
      if (homeowner?.phone) filters.push({ phone: homeowner.phone });
      filters.push({ customerId: req.user.id });

      const jobs = await JobRequest.find({
        $and: [
          { $or: filters },
          {
            $or: [
              { trade: regex },
              { description: regex },
              { name: regex },
              { address: regex }
            ]
          }
        ]
      })
        .sort({ createdAt: -1 })
        .lean();

      return {
        total: jobs.length,
        results: paginateResult(jobs, page, limit).map((job) => ({
          type: 'job',
          id: job._id,
          title: `${job.trade} job`,
          subtitle: `${job.status} · ${job.name || job.address || 'Job request'}`,
          url: `/jobs/${job._id}`,
          createdAt: job.createdAt
        }))
      };
    }

    async function searchAccessibleDocuments() {
      const documents = await Document.find({
        $and: [
          {
            $or: [
              { ownerId: req.user.id },
              { sharedWith: req.user.id }
            ]
          },
          { isDeleted: { $ne: true } },
          {
            $or: [
              { name: regex },
              { description: regex },
              { tags: regex }
            ]
          }
        ]
      })
        .sort({ createdAt: -1 })
        .lean();

      return {
        total: documents.length,
        results: paginateResult(documents, page, limit).map((document) => ({
          type: 'document',
          id: document._id,
          title: document.name,
          subtitle: `${document.type} · ${document.description || 'Document'}`,
          url: `/documents/${document._id}`,
          createdAt: document.createdAt
        }))
      };
    }

    async function searchUserMessages() {
      const messages = await Message.find({
        $and: [
          {
            $or: [
              { senderId: req.user.id },
              { receiverId: req.user.id }
            ]
          },
          { content: regex }
        ]
      })
        .sort({ createdAt: -1 })
        .lean();

      return {
        total: messages.length,
        results: paginateResult(messages, page, limit).map((message) => ({
          type: 'message',
          id: message._id,
          title: message.content.slice(0, 80),
          subtitle: `${message.senderRole} → ${message.receiverRole}`,
          url: `/messages/${message.conversationId}`,
          createdAt: message.createdAt
        }))
      };
    }

    async function searchProJobs() {
      const jobs = await JobRequest.find({
        $and: [
          {
            $or: [
              { assignedProId: req.user.id },
              { assignedTo: req.user.id }
            ]
          },
          {
            $or: [
              { name: regex },
              { trade: regex },
              { address: regex },
              { city: regex },
              { state: regex },
              { description: regex }
            ]
          }
        ]
      })
        .sort({ createdAt: -1 })
        .lean();

      return {
        total: jobs.length,
        results: paginateResult(jobs, page, limit).map((job) => ({
          type: 'job',
          id: job._id,
          title: `${job.name || 'Lead'} · ${job.trade}`,
          subtitle: `${job.city || job.address || 'Location unavailable'} · ${job.status}`,
          url: `/pro/jobs/${job._id}`,
          createdAt: job.createdAt
        }))
      };
    }

    async function searchRecruiterPros() {
      const referrals = await RecruiterReferral.find({
        $and: [
          { recruiterId: req.user.id },
          {
            $or: [
              { proName: regex },
              { proEmail: regex },
              { proTrade: regex },
              { proCity: regex },
              { proPhone: regex }
            ]
          }
        ]
      })
        .sort({ createdAt: -1 })
        .lean();

      return {
        total: referrals.length,
        results: paginateResult(referrals, page, limit).map((referral) => ({
          type: 'pro',
          id: referral.proId || referral._id,
          title: referral.proName || referral.proEmail || 'Referred pro',
          subtitle: `${referral.proTrade || 'Trade unavailable'} · ${referral.status}`,
          url: referral.proId ? `/pros/${referral.proId}` : `/recruiter/referrals/${referral._id}`,
          createdAt: referral.createdAt
        }))
      };
    }

    async function searchAdminJobs() {
      const jobs = await JobRequest.find({
        $or: [
          { trade: regex },
          { description: regex },
          { name: regex },
          { email: regex },
          { phone: regex },
          { address: regex },
          { city: regex },
          { state: regex }
        ]
      })
        .sort({ createdAt: -1 })
        .lean();

      return {
        total: jobs.length,
        results: paginateResult(jobs, page, limit).map((job) => ({
          type: 'job',
          id: job._id,
          title: `${job.trade} · ${job.name || 'Customer'}`,
          subtitle: `${job.status} · ${job.city || job.address || ''}`.trim(),
          url: `/admin/jobs/${job._id}`,
          createdAt: job.createdAt
        }))
      };
    }

    async function searchAdminPros() {
      const pros = await Pro.find({
        $or: [
          { name: regex },
          { firstName: regex },
          { lastName: regex },
          { businessName: regex },
          { email: regex },
          { trade: regex },
          { primaryService: regex },
          { city: regex },
          { state: regex }
        ]
      })
        .sort({ createdAt: -1 })
        .lean();

      return {
        total: pros.length,
        results: paginateResult(pros, page, limit).map((pro) => ({
          type: 'pro',
          id: pro._id,
          title: pro.businessName || pro.name || [pro.firstName, pro.lastName].filter(Boolean).join(' '),
          subtitle: `${pro.trade || pro.primaryService || 'Trade unavailable'} · ${pro.email || pro.phone || ''}`.trim(),
          url: `/pros/${pro._id}`,
          createdAt: pro.createdAt
        }))
      };
    }

    async function searchAdminRecruiters() {
      const recruiters = await RecruiterProfile.find({
        $or: [
          { name: regex },
          { email: regex },
          { recruiterCode: regex },
          { city: regex },
          { state: regex }
        ]
      })
        .sort({ createdAt: -1 })
        .lean();

      return {
        total: recruiters.length,
        results: paginateResult(recruiters, page, limit).map((recruiter) => ({
          type: 'recruiter',
          id: recruiter._id,
          title: recruiter.name,
          subtitle: `${recruiter.email} · ${recruiter.recruiterCode}`,
          url: `/admin/recruiters/${recruiter._id}`,
          createdAt: recruiter.createdAt
        }))
      };
    }

    async function searchAdminDocuments() {
      const documents = await Document.find({
        $and: [
          { isDeleted: { $ne: true } },
          {
            $or: [
              { name: regex },
              { description: regex },
              { tags: regex }
            ]
          }
        ]
      })
        .sort({ createdAt: -1 })
        .lean();

      return {
        total: documents.length,
        results: paginateResult(documents, page, limit).map((document) => ({
          type: 'document',
          id: document._id,
          title: document.name,
          subtitle: `${document.type} · ${document.ownerRole}`,
          url: `/documents/${document._id}`,
          createdAt: document.createdAt
        }))
      };
    }

    async function searchAdminMessages() {
      const messages = await Message.find({ content: regex })
        .sort({ createdAt: -1 })
        .lean();

      return {
        total: messages.length,
        results: paginateResult(messages, page, limit).map((message) => ({
          type: 'message',
          id: message._id,
          title: message.content.slice(0, 80),
          subtitle: `${message.senderRole} → ${message.receiverRole}`,
          url: `/messages/${message.conversationId}`,
          createdAt: message.createdAt
        }))
      };
    }

    const handlers = [];

    if (req.user.role === 'homeowner') {
      if (!type || type === 'jobs') handlers.push(searchHomeownerJobs);
      if (!type || type === 'documents') handlers.push(searchAccessibleDocuments);
      if (!type || type === 'messages') handlers.push(searchUserMessages);
    } else if (req.user.role === 'pro') {
      if (!type || type === 'jobs') handlers.push(searchProJobs);
      if (!type || type === 'documents') handlers.push(searchAccessibleDocuments);
      if (!type || type === 'messages') handlers.push(searchUserMessages);
    } else if (req.user.role === 'recruiter') {
      if (!type || type === 'pros') handlers.push(searchRecruiterPros);
      if (!type || type === 'messages') handlers.push(searchUserMessages);
    } else if (req.user.role === 'admin' || req.user.isAdmin === true) {
      if (!type || type === 'jobs') handlers.push(searchAdminJobs);
      if (!type || type === 'pros') handlers.push(searchAdminPros);
      if (!type || type === 'recruiters') handlers.push(searchAdminRecruiters);
      if (!type || type === 'documents') handlers.push(searchAdminDocuments);
      if (!type || type === 'messages') handlers.push(searchAdminMessages);
    } else {
      return res.status(403).json({ error: 'Unsupported role for search' });
    }

    const datasets = await Promise.all(handlers.map((handler) => handler()));
    const total = datasets.reduce((sum, dataset) => sum + dataset.total, 0);
    const results = datasets
      .flatMap((dataset) => dataset.results)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.json({
      results: type ? results : paginateResult(results, page, limit),
      total,
      page
    });
  } catch (error) {
    console.error('Error running role-based search:', error);
    return res.status(500).json({ error: 'Failed to search' });
  }
});

module.exports = router;
