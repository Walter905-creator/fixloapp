/**
 * Fixlo Growth Engine (FGE) — Main Module
 *
 * Registers all FGE routes, starts the scheduler and queue worker,
 * and registers background job processors.
 *
 * To activate:   set FGE_ENABLED=true in server .env
 * To deactivate: remove FGE_ENABLED or set to false — nothing breaks.
 *
 * Route prefix: /api/fge/*
 */

'use strict';

const router = require('express').Router();
const featureFlag = require('./middleware/featureFlag');

// ─── Sub-routers ──────────────────────────────────────────────────────────────

const marketingRoutes = require('./routes/marketing');
const seoRoutes = require('./routes/seo');
const blogRoutes = require('./routes/blog');
const emailRoutes = require('./routes/email');
const smsRoutes = require('./routes/sms');
const referralRoutes = require('./routes/referral');
const analyticsRoutes = require('./routes/analytics');
const insightsRoutes = require('./routes/insights');
const reviewsRoutes = require('./routes/reviews');
const seasonalRoutes = require('./routes/seasonal');
const growthRoutes = require('./routes/growth');
const settingsRoutes = require('./routes/settings');
const queueRoutes = require('./routes/queue');

// ─── Feature flag (gates ALL /api/fge/* routes) ───────────────────────────────

router.use(featureFlag);

// ─── Mount sub-routers ────────────────────────────────────────────────────────

router.use('/marketing', marketingRoutes);
router.use('/seo', seoRoutes);
router.use('/blog', blogRoutes);
router.use('/email', emailRoutes);
router.use('/sms', smsRoutes);
router.use('/referral', referralRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/insights', insightsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/seasonal', seasonalRoutes);
router.use('/growth', growthRoutes);
router.use('/settings', settingsRoutes);
router.use('/queue', queueRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────

router.get('/health', (req, res) => {
  res.json({ ok: true, module: 'FGE', version: '1.0.0', timestamp: new Date() });
});

// ─── Queue processors ─────────────────────────────────────────────────────────

/**
 * Register background job processors for each queue type.
 * Called once during server initialization.
 */
function registerQueueProcessors() {
  const { registerProcessor } = require('./services/queue');
  const ai = require('./services/aiGenerator');
  const { createLandingPage, updateSitemap } = require('./services/seoGenerator');
  const Blog = require('./models/Blog');
  const AIReport = require('./models/AIReport');
  const FGEAnalytics = require('./models/FGEAnalytics');
  const SeoJob = require('./models/SeoJob');
  const FGEImage = require('./models/FGEImage');

  // ── SEO page generation ──────────────────────────────────────────────────
  registerProcessor('seo_page', async (job) => {
    const { service, city, state, seoJobId } = job.payload;
    try {
      const page = await createLandingPage({ service, city, state });
      if (seoJobId) {
        await SeoJob.findByIdAndUpdate(seoJobId, { $inc: { createdPages: 1 } });
      }
      return { slug: page.slug };
    } catch (err) {
      if (seoJobId) {
        await SeoJob.findByIdAndUpdate(seoJobId, { $inc: { failedPages: 1 }, $push: { errorLog: err.message } });
      }
      throw err;
    }
  });

  // ── Sitemap update ───────────────────────────────────────────────────────
  registerProcessor('sitemap_update', async () => {
    await updateSitemap();
    return { updated: true };
  });

  // ── AI content generation ────────────────────────────────────────────────
  registerProcessor('ai_content', async (job) => {
    const { task, topic, type, service, city } = job.payload;
    if (task === 'blog_article') {
      const content = await ai.generateBlogArticle({ topic, service, city });
      const post = await Blog.create({
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
      });
      return { postId: post._id };
    }
    return { skipped: true };
  });

  // ── Image generation ─────────────────────────────────────────────────────
  registerProcessor('image_generation', async (job) => {
    if (!ai.isAvailable) throw new Error('OpenAI not configured.');
    const { prompt, size } = job.payload;
    const result = await ai.generateImage(prompt, size);

    // Store image reference
    const img = await FGEImage.create({
      prompt,
      url: result.url,
      generatedBy: 'dall-e-3',
    });

    return { imageId: img._id, url: result.url };
  });

  // ── Daily AI report ──────────────────────────────────────────────────────
  registerProcessor('ai_report', async () => {
    if (!ai.isAvailable) return { skipped: true, reason: 'OpenAI not configured.' };

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const analytics = await FGEAnalytics.find({ date: { $gte: since } }).lean();

    const metricsSnapshot = analytics.reduce(
      (acc, r) => {
        acc.newUsers += r.newHomeowners + r.newContractors + r.newRecruiters;
        acc.revenue += r.revenue;
        acc.traffic += r.visitors;
        return acc;
      },
      { newUsers: 0, revenue: 0, traffic: 0, conversionRate: 0 }
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aiResult = await ai.generateDailyReport(metricsSnapshot);

    await AIReport.findOneAndUpdate(
      { date: today },
      {
        date: today,
        summary: aiResult.summary,
        metrics: metricsSnapshot,
        seoOpportunities: aiResult.seoOpportunities || [],
        recommendations: aiResult.recommendations || [],
        rawAiResponse: JSON.stringify(aiResult),
      },
      { upsert: true, new: true }
    );

    return { generated: true };
  });

  // ── Newsletter ───────────────────────────────────────────────────────────
  registerProcessor('newsletter', async () => {
    // Placeholder: real implementation would pull recent blogs and send via SendGrid
    console.log('[FGE] Newsletter job executed (no-op placeholder).');
    return { sent: 0 };
  });

  // ── Indexing request ─────────────────────────────────────────────────────
  registerProcessor('indexing_request', async (job) => {
    // Requires Google Search Console API — placeholder logs the intent
    const { url } = job.payload;
    console.log('[FGE] Indexing request for:', url);
    return { requested: true, url };
  });
}

// ─── Initialize ───────────────────────────────────────────────────────────────

/**
 * Initialize the FGE module: start queue worker + scheduler.
 * Call this after MongoDB connects.
 */
function initialize() {
  if (process.env.FGE_ENABLED !== 'true') {
    console.log('ℹ️  Fixlo Growth Engine (FGE) is disabled. Set FGE_ENABLED=true to enable.');
    return;
  }

  console.log('🚀 Initializing Fixlo Growth Engine (FGE)...');

  try {
    registerQueueProcessors();
    console.log('✅ FGE queue processors registered.');
  } catch (err) {
    console.error('❌ FGE queue processors failed:', err.message);
  }

  try {
    const { startWorker } = require('./services/queue');
    startWorker('* * * * *'); // poll every minute
    console.log('✅ FGE queue worker started.');
  } catch (err) {
    console.error('❌ FGE queue worker failed to start:', err.message);
  }

  try {
    const scheduler = require('./services/scheduler');
    scheduler.initialize();
    console.log('✅ FGE scheduler started.');
  } catch (err) {
    console.error('❌ FGE scheduler failed:', err.message);
  }

  console.log('✅ Fixlo Growth Engine (FGE) ready.');
}

module.exports = { router, initialize };
