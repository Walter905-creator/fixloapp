/**
 * FGE SEO Engine Routes
 * POST /api/fge/seo/generate         – generate a single landing page
 * POST /api/fge/seo/batch            – batch generate pages for a service + cities
 * GET  /api/fge/seo/pages            – list landing pages
 * GET  /api/fge/seo/pages/:id        – get one landing page
 * PUT  /api/fge/seo/pages/:id        – update landing page
 * DELETE /api/fge/seo/pages/:id      – delete landing page
 * POST /api/fge/seo/sitemap          – trigger sitemap update
 * GET  /api/fge/seo/jobs             – list SEO generation jobs
 */

'use strict';

const router = require('express').Router();
const requireAuth = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');
const LandingPage = require('../models/LandingPage');
const SeoJob = require('../models/SeoJob');
const { createLandingPage, updateSitemap } = require('../services/seoGenerator');
const { enqueue } = require('../services/queue');

router.use(requireAuth, requireAdmin);

// ─── Generate single landing page ────────────────────────────────────────────

router.post('/generate', async (req, res) => {
  try {
    const { service, city, state, skipIfExists = true } = req.body;
    if (!service || !city || !state) {
      return res.status(400).json({ ok: false, error: 'service, city, and state are required.' });
    }

    const page = await createLandingPage({ service, city, state, skipIfExists });
    return res.status(201).json({ ok: true, page });
  } catch (err) {
    console.error('[FGE SEO] generate error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Batch generate ───────────────────────────────────────────────────────────

/**
 * POST /api/fge/seo/batch
 * Body: { service: string, cities: [{city, state}] }
 * Creates a SeoJob and enqueues individual page generation tasks.
 */
router.post('/batch', async (req, res) => {
  try {
    const { service, cities } = req.body;
    if (!service || !Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({ ok: false, error: 'service and cities[] are required.' });
    }

    const job = await SeoJob.create({
      service,
      cities,
      totalPages: cities.length,
      status: 'pending',
    });

    // Enqueue one seo_page job per city
    for (const { city, state } of cities) {
      await enqueue({
        type: 'seo_page',
        priority: 5,
        payload: { service, city, state, seoJobId: job._id.toString() },
      });
    }

    return res.status(202).json({ ok: true, jobId: job._id, queued: cities.length });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Landing page CRUD ────────────────────────────────────────────────────────

router.get('/pages', async (req, res) => {
  try {
    const { status, service, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (service) filter.service = service.toLowerCase();
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
    ];

    const [pages, total] = await Promise.all([
      LandingPage.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .select('-body -schemaJson')  // exclude heavy fields from list view
        .lean(),
      LandingPage.countDocuments(filter),
    ]);

    return res.json({ ok: true, pages, total, page: Number(page) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/pages/:id', async (req, res) => {
  try {
    const page = await LandingPage.findById(req.params.id).lean();
    if (!page) return res.status(404).json({ ok: false, error: 'Landing page not found.' });
    return res.json({ ok: true, page });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/pages/:id', async (req, res) => {
  try {
    const page = await LandingPage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!page) return res.status(404).json({ ok: false, error: 'Landing page not found.' });
    return res.json({ ok: true, page });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/pages/:id', async (req, res) => {
  try {
    await LandingPage.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Sitemap update ───────────────────────────────────────────────────────────

router.post('/sitemap', async (req, res) => {
  try {
    await updateSitemap();
    return res.json({ ok: true, message: 'Sitemap updated.' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── SEO jobs ─────────────────────────────────────────────────────────────────

router.get('/jobs', async (req, res) => {
  try {
    const jobs = await SeoJob.find().sort({ createdAt: -1 }).limit(50).lean();
    return res.json({ ok: true, jobs });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
