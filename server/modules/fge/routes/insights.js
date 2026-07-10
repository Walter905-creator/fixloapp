/**
 * FGE AI Insights Routes
 * GET  /api/fge/insights/today   – today's AI-generated report
 * GET  /api/fge/insights/history – list past reports
 * POST /api/fge/insights/generate – generate a report now (on-demand)
 */

'use strict';

const router = require('express').Router();
const requireAuth = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');
const AIReport = require('../models/AIReport');
const FGEAnalytics = require('../models/FGEAnalytics');
const { generateDailyReport } = require('../services/aiGenerator');

router.use(requireAuth, requireAdmin);

// ─── Today's report ───────────────────────────────────────────────────────────

router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const report = await AIReport.findOne({ date: { $gte: today } }).lean();
    return res.json({ ok: true, report: report || null });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── History ──────────────────────────────────────────────────────────────────

router.get('/history', async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const reports = await AIReport.find()
      .sort({ date: -1 })
      .limit(Number(limit))
      .select('-rawAiResponse')
      .lean();
    return res.json({ ok: true, reports });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── On-demand generation ─────────────────────────────────────────────────────

/**
 * POST /api/fge/insights/generate
 * Generates and saves a report for the given date (defaults to today).
 */
router.post('/generate', async (req, res) => {
  try {
    const { date } = req.body;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    // Pull last 7 days of analytics as context
    const since = new Date(reportDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const analytics = await FGEAnalytics.find({ date: { $gte: since, $lte: reportDate } }).lean();

    const metricsSnapshot = analytics.reduce(
      (acc, r) => {
        acc.newUsers += r.newHomeowners + r.newContractors + r.newRecruiters;
        acc.revenue += r.revenue;
        acc.traffic += r.visitors;
        return acc;
      },
      { newUsers: 0, revenue: 0, traffic: 0, conversionRate: 0 }
    );

    // Calculate avg conversion rate
    const total = analytics.reduce((s, r) => s + r.visitors, 0);
    const convs = analytics.reduce((s, r) => s + r.conversions, 0);
    metricsSnapshot.conversionRate = total > 0 ? ((convs / total) * 100).toFixed(2) : 0;

    const aiResult = await generateDailyReport(metricsSnapshot);

    const report = await AIReport.findOneAndUpdate(
      { date: reportDate },
      {
        date: reportDate,
        summary: aiResult.summary,
        metrics: metricsSnapshot,
        seoOpportunities: aiResult.seoOpportunities || [],
        recommendations: aiResult.recommendations || [],
        rawAiResponse: JSON.stringify(aiResult),
      },
      { upsert: true, new: true }
    );

    return res.json({ ok: true, report });
  } catch (err) {
    console.error('[FGE Insights] generate error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
