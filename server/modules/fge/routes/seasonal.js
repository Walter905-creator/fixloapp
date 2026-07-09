/**
 * FGE Seasonal Campaign Routes
 * GET  /api/fge/seasonal/current     – get current season info + recommendations
 * GET  /api/fge/seasonal/campaigns   – list seasonal campaigns
 * POST /api/fge/seasonal/generate    – AI-generate a seasonal campaign
 */

'use strict';

const router = require('express').Router();
const requireAuth = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');
const Campaign = require('../models/Campaign');
const ai = require('../services/aiGenerator');
const { allowedEnum, safeString } = require('../middleware/sanitize');

const SEASON_VALUES   = ['spring','summer','fall','winter'];
const CAMPAIGN_TYPES  = ['email','sms','blog','facebook','instagram','linkedin','x','google_business'];
const AUDIENCE_VALUES = ['homeowners','contractors','recruiters','all'];

router.use(requireAuth, requireAdmin);

// ─── Season utilities ─────────────────────────────────────────────────────────

function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1–12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

const SEASONAL_SERVICES = {
  spring: ['gutters', 'lawn care', 'pressure washing', 'HVAC tune-up', 'exterior painting'],
  summer: ['AC repair', 'pool cleaning', 'pest control', 'roof inspection', 'deck staining'],
  fall: ['heating system check', 'chimney cleaning', 'insulation', 'weatherproofing', 'leaf removal'],
  winter: ['furnace repair', 'pipe insulation', 'snow removal', 'holiday lighting', 'attic insulation'],
};

// ─── Current season ───────────────────────────────────────────────────────────

router.get('/current', async (req, res) => {
  try {
    const season = getCurrentSeason();
    const services = SEASONAL_SERVICES[season] || [];

    // Check for existing campaigns this season
    const campaigns = await Campaign.find({ season, status: { $in: ['draft', 'active', 'scheduled'] } })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ ok: true, season, recommendedServices: services, campaigns });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Seasonal campaigns list ──────────────────────────────────────────────────

router.get('/campaigns', async (req, res) => {
  try {
    const season = allowedEnum(req.query.season, SEASON_VALUES);
    const filter = { type: 'seasonal' };
    if (season) filter.season = season;

    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, campaigns });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Generate seasonal campaign ───────────────────────────────────────────────

/**
 * POST /api/fge/seasonal/generate
 * Body: { season?, service?, type? ('email'|'sms'|'facebook'|…), audience? }
 */
router.post('/generate', async (req, res) => {
  try {
    const requestedSeason = allowedEnum(req.body.season, SEASON_VALUES);
    const type     = allowedEnum(req.body.type, CAMPAIGN_TYPES) || 'email';
    const audience = allowedEnum(req.body.audience, AUDIENCE_VALUES) || 'homeowners';
    const service  = safeString(req.body.service);

    if (!ai.isAvailable) return res.status(503).json({ ok: false, error: 'OpenAI not configured.' });

    const season = requestedSeason || getCurrentSeason();
    const recommendedServices = SEASONAL_SERVICES[season] || [];
    const targetService = service || recommendedServices[0];

    const topic = `${season.charAt(0).toUpperCase() + season.slice(1)} home maintenance — ${targetService}`;

    let content;
    switch (type) {
      case 'email':
        content = await ai.generateEmailCampaign({ topic, audience });
        break;
      case 'sms':
        content = { body: await ai.generateSmsMessage({ topic, audience }) };
        break;
      default:
        content = { body: await ai.generateSocialPost({ platform: type, topic, service: targetService }) };
    }

    // Save as draft campaign
    const campaign = await Campaign.create({
      title: content.subject || topic,
      type,
      body: content.bodyHtml || content.body,
      excerpt: content.previewText,
      subject: content.subject,
      audience,
      season,
      status: 'draft',
      targetServices: [targetService],
      generatedByAI: true,
      aiPrompt: topic,
      tags: [season, 'seasonal'],
    });

    return res.json({ ok: true, campaign, season, recommendedServices });
  } catch (err) {
    console.error('[FGE Seasonal] generate error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
