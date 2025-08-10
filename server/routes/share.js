const express = require('express');
const router = express.Router();
const Pro = require('../models/Pro');
const ShareEvent = require('../models/ShareEvent');

const BOOST_DAYS = parseInt(process.env.BOOST_DAYS || '7', 10);

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Award badges based on history
async function awardBadges(pro, now, sharesLast30) {
  const updates = { $set: {} };
  const badgesToAdd = [];

  // Top Promoter: awarded on first share
  if (!pro.hasBadge('Top Promoter')) {
    badgesToAdd.push({ name: 'Top Promoter', earnedAt: now });
  }
  
  // Community Builder: awarded for 3+ shares in any rolling 30-day window
  if (sharesLast30 >= 3 && !pro.hasBadge('Community Builder')) {
    badgesToAdd.push({ name: 'Community Builder', earnedAt: now });
  }
  
  if (badgesToAdd.length) {
    updates.$push = { badges: { $each: badgesToAdd } };
  }
  return updates;
}

// POST /api/profiles/:proId/share-event
// Record a share event and award 7-day boost + badges
router.post('/profiles/:proId/share-event', async (req, res) => {
  try {
    const { proId } = req.params;
    const { medium, utm = {} } = req.body; // medium: 'facebook'|'instagram'|'linkedin'|'x'|'whatsapp'|'copy'

    // Validate medium
    const validMediums = ['facebook', 'instagram', 'linkedin', 'x', 'whatsapp', 'copy'];
    if (!medium || !validMediums.includes(medium)) {
      return res.status(400).json({ error: 'Valid medium is required' });
    }

    const pro = await Pro.findById(proId);
    if (!pro) return res.status(404).json({ error: 'Pro not found' });

    // 1) Record event
    await ShareEvent.create({ proId, medium, utm });

    // 2) Count shares in last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sharesLast30 = await ShareEvent.countDocuments({
      proId,
      createdAt: { $gte: thirtyDaysAgo, $lte: now }
    });

    // 3) Activate / extend boost
    const newBoostUntil = addDays(now, BOOST_DAYS);
    const boostActiveUntil = pro.boostActiveUntil && pro.boostActiveUntil > now
      ? (pro.boostActiveUntil > newBoostUntil ? pro.boostActiveUntil : newBoostUntil)
      : newBoostUntil;

    let update = {
      $set: { boostActiveUntil }
    };

    // 4) Badges
    const badgeUpdate = await awardBadges(pro, now, sharesLast30);
    update = { ...update, ...badgeUpdate };

    const updated = await Pro.findByIdAndUpdate(proId, update, { new: true });

    return res.json({
      ok: true,
      boostActiveUntil: updated.boostActiveUntil,
      badges: updated.badges,
      sharesLast30
    });
  } catch (err) {
    console.error('share-event error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/profiles/:proId/share-stats
// Get sharing statistics for dashboard
router.get('/profiles/:proId/share-stats', async (req, res) => {
  try {
    const { proId } = req.params;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const events = await ShareEvent.aggregate([
      { $match: { proId: require('mongoose').Types.ObjectId.createFromHexString(proId), createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$medium', count: { $sum: 1 } } }
    ]);

    const totals = events.reduce((acc, e) => ({ ...acc, [e._id]: e.count }), {});
    const clicksLast30 = Object.values(totals).reduce((a, b) => a + b, 0);

    const pro = await Pro.findById(proId).lean();

    res.json({
      ok: true,
      clicksLast30,
      byMedium: totals,
      boostActiveUntil: pro?.boostActiveUntil || null,
      badges: pro?.badges || []
    });
  } catch (err) {
    console.error('share-stats error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;