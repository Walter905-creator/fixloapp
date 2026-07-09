/**
 * FGE Queue Admin Routes
 * GET  /api/fge/queue/stats    – queue depth by type/status
 * GET  /api/fge/queue/jobs     – list jobs with filters
 * POST /api/fge/queue/retry/:id – requeue a failed job
 * DELETE /api/fge/queue/jobs/:id – delete a job
 */

'use strict';

const router = require('express').Router();
const requireAuth = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');
const MarketingQueue = require('../models/MarketingQueue');
const { getQueueStats } = require('../services/queue');

router.use(requireAuth, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const stats = await getQueueStats();
    return res.json({ ok: true, stats });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/jobs', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const [jobs, total] = await Promise.all([
      MarketingQueue.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      MarketingQueue.countDocuments(filter),
    ]);

    return res.json({ ok: true, jobs, total });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/retry/:id', async (req, res) => {
  try {
    const job = await MarketingQueue.findByIdAndUpdate(
      req.params.id,
      { status: 'pending', attempts: 0, error: null, runAt: new Date() },
      { new: true }
    );
    if (!job) return res.status(404).json({ ok: false, error: 'Job not found.' });
    return res.json({ ok: true, job });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.delete('/jobs/:id', async (req, res) => {
  try {
    await MarketingQueue.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
