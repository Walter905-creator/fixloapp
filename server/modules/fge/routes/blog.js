/**
 * FGE Blog Engine Routes
 * POST /api/fge/blog/generate     – AI-generate a blog article
 * POST /api/fge/blog               – create manually
 * GET  /api/fge/blog               – list articles (admin)
 * GET  /api/fge/blog/public        – list published articles (public)
 * GET  /api/fge/blog/:id           – get one article
 * GET  /api/fge/blog/slug/:slug    – get by slug (public)
 * PUT  /api/fge/blog/:id           – update article
 * DELETE /api/fge/blog/:id         – delete article
 * POST /api/fge/blog/:id/publish   – publish or schedule
 */

'use strict';

const router = require('express').Router();
const requireAuth = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');
const Blog = require('../models/Blog');
const ai = require('../services/aiGenerator');
const { allowedEnum, regexFilter, posInt } = require('../middleware/sanitize');

const BLOG_STATUSES = ['draft','scheduled','published'];

// ─── Public routes ────────────────────────────────────────────────────────────

/** GET /api/fge/blog/public — list published articles for the website */
router.get('/public', async (req, res) => {
  try {
    const page  = posInt(req.query.page, 1);
    const limit = posInt(req.query.limit, 12);
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const tag      = typeof req.query.tag      === 'string' ? req.query.tag      : undefined;
    const filter = { status: 'published' };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;

    const [posts, total] = await Promise.all([
      Blog.find(filter)
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-body')
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return res.json({ ok: true, posts, total });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/** GET /api/fge/blog/slug/:slug — get a published article by slug */
router.get('/slug/:slug', async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!post) return res.status(404).json({ ok: false, error: 'Article not found.' });

    // Increment view counter (fire-and-forget)
    Blog.findByIdAndUpdate(post._id, { $inc: { views: 1 } }).exec();

    return res.json({ ok: true, post });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Admin guard ──────────────────────────────────────────────────────────────

router.use(requireAuth, requireAdmin);

// ─── AI generation ────────────────────────────────────────────────────────────

router.post('/generate', async (req, res) => {
  try {
    const { topic, service, city, saveDraft = true } = req.body;
    if (!topic) return res.status(400).json({ ok: false, error: 'topic is required.' });
    if (!ai.isAvailable) return res.status(503).json({ ok: false, error: 'OpenAI not configured.' });

    const content = await ai.generateBlogArticle({ topic, service, city });

    let post = null;
    if (saveDraft) {
      post = await Blog.create({
        title: content.title,
        slug: content.slug,
        excerpt: content.excerpt,
        body: content.body,
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        tags: content.tags || [],
        readTimeMinutes: content.readTimeMinutes || 5,
        status: 'draft',
        generatedByAI: true,
        aiPrompt: topic,
        author: 'Fixlo Team',
      });
    }

    return res.status(201).json({ ok: true, content, post });
  } catch (err) {
    console.error('[FGE Blog] generate error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const post = await Blog.create(req.body);
    return res.status(201).json({ ok: true, post });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const page   = posInt(req.query.page, 1);
    const limit  = posInt(req.query.limit, 20);
    const status = allowedEnum(req.query.status, BLOG_STATUSES);
    const searchRx = regexFilter(req.query.search);
    const filter = {};
    if (status) filter.status = status;
    if (searchRx) filter.$or = [{ title: searchRx }, { tags: searchRx }];

    const [posts, total] = await Promise.all([
      Blog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-body')
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return res.json({ ok: true, posts, total, page });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ ok: false, error: 'Article not found.' });
    return res.json({ ok: true, post });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const post = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ ok: false, error: 'Article not found.' });
    return res.json({ ok: true, post });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/:id/publish', async (req, res) => {
  try {
    const { scheduledAt } = req.body;
    const update = scheduledAt
      ? { status: 'scheduled', scheduledAt: new Date(scheduledAt) }
      : { status: 'published', publishedAt: new Date() };

    const post = await Blog.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!post) return res.status(404).json({ ok: false, error: 'Article not found.' });
    return res.json({ ok: true, post });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
