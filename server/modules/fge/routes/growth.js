/**
 * FGE Growth Dashboard Routes
 * GET /api/fge/growth/summary  – aggregated KPIs for the growth dashboard
 * GET /api/fge/growth/health   – website health indicators
 */

'use strict';

const router = require('express').Router();
const requireAuth = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');
const FGEAnalytics = require('../models/FGEAnalytics');
const LandingPage = require('../models/LandingPage');
const Blog = require('../models/Blog');
const Campaign = require('../models/Campaign');
const MarketingQueue = require('../models/MarketingQueue');
const AIReport = require('../models/AIReport');

router.use(requireAuth, requireAdmin);

// ─── Growth summary ───────────────────────────────────────────────────────────

/**
 * GET /api/fge/growth/summary
 * Returns aggregated KPIs for the single growth dashboard panel.
 */
router.get('/summary', async (req, res) => {
  try {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [analytics30, landingPageCount, publishedBlogCount, campaignCounts, queueDepth, latestReport] =
      await Promise.all([
        FGEAnalytics.find({ date: { $gte: since30 } }).lean(),
        LandingPage.countDocuments({ status: 'published' }),
        Blog.countDocuments({ status: 'published' }),
        Campaign.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        MarketingQueue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        AIReport.findOne().sort({ date: -1 }).select('-rawAiResponse').lean(),
      ]);

    // Aggregate 30-day totals
    const totals = analytics30.reduce(
      (acc, r) => {
        acc.visitors += r.visitors;
        acc.conversions += r.conversions;
        acc.revenue += r.revenue;
        acc.newUsers += r.newHomeowners + r.newContractors + r.newRecruiters;
        acc.emailsSent += r.sources?.email || 0;
        acc.gscImpressions += r.gscImpressions;
        acc.gscClicks += r.gscClicks;
        return acc;
      },
      { visitors: 0, conversions: 0, revenue: 0, newUsers: 0, emailsSent: 0, gscImpressions: 0, gscClicks: 0 }
    );

    const campaignMap = Object.fromEntries(campaignCounts.map((c) => [c._id, c.count]));
    const queueMap = Object.fromEntries(queueDepth.map((q) => [q._id, q.count]));

    const summary = {
      period: '30d',
      // Traffic & SEO
      visitors: totals.visitors,
      gscImpressions: totals.gscImpressions,
      gscClicks: totals.gscClicks,
      // Conversions
      conversions: totals.conversions,
      revenue: totals.revenue,
      newUsers: totals.newUsers,
      // Content
      publishedLandingPages: landingPageCount,
      publishedBlogPosts: publishedBlogCount,
      // Campaigns
      campaigns: campaignMap,
      // Queue
      queueDepth: queueMap,
      // Latest AI report snippet
      latestInsight: latestReport?.summary || null,
      latestInsightDate: latestReport?.date || null,
    };

    return res.json({ ok: true, summary });
  } catch (err) {
    console.error('[FGE Growth] summary error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Health indicators ────────────────────────────────────────────────────────

router.get('/health', async (req, res) => {
  try {
    const [totalPages, pendingIndexing, draftBlogs, failedJobs] = await Promise.all([
      LandingPage.countDocuments({ status: 'published' }),
      LandingPage.countDocuments({ indexingStatus: 'pending' }),
      Blog.countDocuments({ status: 'draft' }),
      MarketingQueue.countDocuments({ status: 'failed' }),
    ]);

    const health = {
      landingPages: { total: totalPages, pendingIndexing },
      blogs: { drafts: draftBlogs },
      queue: { failedJobs },
      timestamp: new Date(),
    };

    return res.json({ ok: true, health });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
